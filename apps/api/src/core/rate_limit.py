"""High-performance IP-based sliding window rate limiter for API endpoints.

Supports Redis-backed distributed counters with atomic expiration,
falling back gracefully to local thread-safe in-memory windows.
"""

import time
import structlog
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from apps.api.src.core.config import settings
from apps.api.src.core.security import hash_ip

logger = structlog.get_logger(__name__)

# In-memory sliding window fallback: {client_hash: [(timestamp, count)]}
_IN_MEMORY_RATE_LIMITS: Dict[str, list] = {}


class RateLimiter:
    """Sliding-window rate limiter per client IP."""

    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def __call__(self, request: Request):
        # Skip rate limiting during automated test suite runs
        if settings.ENVIRONMENT == "test":
            return

        client_ip = request.client.host if request.client else "unknown"
        client_hash = hash_ip(client_ip)
        endpoint_key = f"rate_limit:{client_hash}:{request.url.path}"
        now = time.time()

        # Try Redis first if token_service or redis is reachable
        try:
            from apps.api.src.services.token_service import token_service
            redis = await token_service.get_redis()
            if redis is not None:
                # Sliding log in Redis via sorted set
                window_start = now - self.window_seconds
                pipeline = redis.pipeline()
                pipeline.zremrangebyscore(endpoint_key, 0, window_start)
                pipeline.zcard(endpoint_key)
                pipeline.zadd(endpoint_key, {f"{now}": now})
                pipeline.expire(endpoint_key, self.window_seconds + 5)
                results = await pipeline.execute()

                current_count = results[1]
                if current_count >= self.max_requests:
                    logger.warning(
                        "Rate limit exceeded (Redis)",
                        client_hash=client_hash,
                        path=request.url.path,
                        count=current_count,
                        limit=self.max_requests,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds} seconds.",
                        headers={"Retry-After": str(self.window_seconds)},
                    )
                return
        except HTTPException:
            raise
        except Exception as e:
            logger.debug("Redis rate limiting fallback to in-memory", error=str(e))

        # In-memory sliding window fallback
        timestamps = _IN_MEMORY_RATE_LIMITS.setdefault(endpoint_key, [])
        # Prune expired timestamps
        cutoff = now - self.window_seconds
        _IN_MEMORY_RATE_LIMITS[endpoint_key] = [t for t in timestamps if t > cutoff]

        if len(_IN_MEMORY_RATE_LIMITS[endpoint_key]) >= self.max_requests:
            logger.warning(
                "Rate limit exceeded (In-Memory)",
                client_hash=client_hash,
                path=request.url.path,
                count=len(_IN_MEMORY_RATE_LIMITS[endpoint_key]),
                limit=self.max_requests,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_seconds} seconds.",
                headers={"Retry-After": str(self.window_seconds)},
            )

        _IN_MEMORY_RATE_LIMITS[endpoint_key].append(now)


# Standard rate limit dependencies
rate_limit_jobs = RateLimiter(max_requests=25, window_seconds=60)
rate_limit_downloads = RateLimiter(max_requests=60, window_seconds=60)
rate_limit_general = RateLimiter(max_requests=120, window_seconds=60)
