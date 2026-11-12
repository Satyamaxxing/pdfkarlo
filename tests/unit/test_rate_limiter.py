"""Unit tests for the sliding-window IP rate limiter."""

import pytest
import time
from unittest.mock import MagicMock
from fastapi import HTTPException

from apps.api.src.core.rate_limit import RateLimiter, _IN_MEMORY_RATE_LIMITS
from apps.api.src.core.config import settings


@pytest.mark.asyncio
async def test_rate_limiter_allows_under_quota():
    """Verify that requests within quota pass without exception."""
    # Temporarily set environment to development to test rate limiter logic
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "development"
    _IN_MEMORY_RATE_LIMITS.clear()

    limiter = RateLimiter(max_requests=5, window_seconds=10)
    mock_request = MagicMock()
    mock_request.client.host = "192.168.1.100"
    mock_request.url.path = "/api/v1/jobs"

    try:
        for _ in range(5):
            await limiter(mock_request)
    finally:
        settings.ENVIRONMENT = orig_env
        _IN_MEMORY_RATE_LIMITS.clear()


@pytest.mark.asyncio
async def test_rate_limiter_blocks_over_quota():
    """Verify that exceeding quota raises HTTP 429 with Retry-After header."""
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "development"
    _IN_MEMORY_RATE_LIMITS.clear()

    limiter = RateLimiter(max_requests=3, window_seconds=10)
    mock_request = MagicMock()
    mock_request.client.host = "192.168.1.101"
    mock_request.url.path = "/api/v1/jobs"

    try:
        # 3 allowed
        for _ in range(3):
            await limiter(mock_request)

        # 4th must fail
        with pytest.raises(HTTPException) as exc_info:
            await limiter(mock_request)

        assert exc_info.value.status_code == 429
        assert "Rate limit exceeded" in exc_info.value.detail
        assert "Retry-After" in exc_info.value.headers
    finally:
        settings.ENVIRONMENT = orig_env
        _IN_MEMORY_RATE_LIMITS.clear()


@pytest.mark.asyncio
async def test_rate_limiter_ip_isolation():
    """Verify that client IP A does not deplete quota for client IP B."""
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "development"
    _IN_MEMORY_RATE_LIMITS.clear()

    limiter = RateLimiter(max_requests=2, window_seconds=10)
    req_a = MagicMock()
    req_a.client.host = "10.0.0.1"
    req_a.url.path = "/api/v1/jobs"

    req_b = MagicMock()
    req_b.client.host = "10.0.0.2"
    req_b.url.path = "/api/v1/jobs"

    try:
        # Deplete quota for A
        await limiter(req_a)
        await limiter(req_a)

        # A is blocked
        with pytest.raises(HTTPException):
            await limiter(req_a)

        # B is still allowed
        await limiter(req_b)
    finally:
        settings.ENVIRONMENT = orig_env
        _IN_MEMORY_RATE_LIMITS.clear()
