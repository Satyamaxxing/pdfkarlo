"""Unit tests for the leased download token lifecycle and retry bounds."""

import time
import pytest
from apps.api.src.services.token_service import TokenService


@pytest.mark.asyncio
async def test_token_service_lease_lifecycle():
    service = TokenService()

    # Create a token with 10s lease window for lifecycle testing
    token = await service.create_download_token(
        job_id="test-job-uuid",
        file_id="test-file-uuid",
        s3_bucket="test-bucket",
        s3_key="test-key",
        filename="output.pdf",
        ttl_seconds=60,
        lease_window_seconds=10,
        max_retries=3,
    )

    assert token.startswith("dl_")

    # 1. First redemption: transitions to LEASED with retry_count = 1
    allowed, reason, meta = await service.validate_and_lease_token(token)
    assert allowed is True
    assert reason == "OK"
    assert int(meta["retry_count"]) == 1
    assert meta["state"] == "LEASED"

    # 2. Second redemption within lease window: retry_count = 2
    allowed, reason, meta = await service.validate_and_lease_token(token)
    assert allowed is True
    assert reason == "OK"
    assert int(meta["retry_count"]) == 2

    # 3. Third redemption: retry_count = 3 (last permitted)
    allowed, reason, meta = await service.validate_and_lease_token(token)
    assert allowed is True
    assert reason == "OK"
    assert int(meta["retry_count"]) == 3

    # 4. Fourth redemption: exceeds max_retries
    allowed, reason, _ = await service.validate_and_lease_token(token)
    assert allowed is False
    assert reason == "RETRIES_EXHAUSTED"


@pytest.mark.asyncio
async def test_token_service_lease_expiration():
    service = TokenService()

    # 1 second lease
    token = await service.create_download_token(
        job_id="test-job-exp",
        file_id="test-file-exp",
        s3_bucket="test-bucket",
        s3_key="test-key",
        filename="output.pdf",
        ttl_seconds=60,
        lease_window_seconds=1,
        max_retries=3,
    )

    # First access activates 1s lease
    allowed, reason, _ = await service.validate_and_lease_token(token)
    assert allowed is True

    # Wait for lease to expire
    time.sleep(1.2)

    allowed, reason, _ = await service.validate_and_lease_token(token)
    assert allowed is False
    assert reason == "LEASE_EXPIRED"


@pytest.mark.asyncio
async def test_nonexistent_token():
    service = TokenService()
    allowed, reason, _ = await service.validate_and_lease_token("dl_nonexistent_token_123")
    assert allowed is False
    assert reason == "TOKEN_NOT_FOUND"
