"""Leased download token manager using Redis with atomic state transitions."""

import time
import json
from typing import Optional, Dict, Any, Tuple
import redis.asyncio as aioredis
from botocore.exceptions import ClientError

from apps.api.src.core.config import settings
from apps.api.src.core.security import generate_secure_token

# Atomic Lua script for leased token redemption
# Evaluates state, checks retry bounds, and transitions ACTIVE -> LEASED
LUA_REDEEM_TOKEN_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local lease_window = tonumber(ARGV[2])
local max_retries = tonumber(ARGV[3])

if redis.call("EXISTS", key) == 0 then
    return {0, "TOKEN_NOT_FOUND"}
end

local state = redis.call("HGET", key, "state")
local retries = tonumber(redis.call("HGET", key, "retry_count") or "0")
local lease_exp = tonumber(redis.call("HGET", key, "lease_expires_at") or "0")

if state == "ACTIVE" then
    -- First access: activate 120s lease window and count attempt 1
    local new_lease_exp = now + lease_window
    redis.call("HSET", key, "state", "LEASED", "retry_count", 1, "lease_expires_at", new_lease_exp)
    -- Extend key TTL to ensure it lives at least through the lease window
    redis.call("EXPIRE", key, lease_window)
    return {1, "OK", 1, tostring(new_lease_exp)}

elseif state == "LEASED" then
    -- Retry or range-request within active lease
    if now > lease_exp then
        redis.call("HSET", key, "state", "EXPIRED")
        return {0, "LEASE_EXPIRED"}
    end
    if retries >= max_retries then
        redis.call("HSET", key, "state", "RETRIES_EXHAUSTED")
        return {0, "RETRIES_EXHAUSTED"}
    end
    local next_retries = retries + 1
    redis.call("HSET", key, "retry_count", next_retries)
    return {1, "OK", next_retries, tostring(lease_exp)}

else
    return {0, "TOKEN_INACTIVE"}
end
"""


class TokenService:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self._redis_client: Optional[aioredis.Redis] = None
        self._lua_redeem = None
        # Memory fallback store for offline testing/mocking
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    async def get_redis(self) -> Optional[aioredis.Redis]:
        """Lazy connection to Redis server."""
        if self._redis_client is None:
            try:
                self._redis_client = aioredis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=1.0,
                )
                await self._redis_client.ping()
            except Exception:
                self._redis_client = None
        return self._redis_client

    async def check_health(self) -> bool:
        """Check Redis connectivity."""
        try:
            r = await self.get_redis()
            if r is not None:
                await r.ping()
                return True
        except Exception:
            pass
        return False

    async def create_download_token(
        self,
        job_id: str,
        file_id: str,
        s3_bucket: str,
        s3_key: str,
        filename: str,
        ttl_seconds: int = 900,
        lease_window_seconds: int = 120,
        max_retries: int = 3,
    ) -> str:
        """Create a new download token in Redis (or in-memory fallback)."""
        token = generate_secure_token(prefix="dl_", nbytes=24)
        now = time.time()

        token_data = {
            "token": token,
            "job_id": str(job_id),
            "file_id": str(file_id),
            "s3_bucket": s3_bucket,
            "s3_key": s3_key,
            "filename": filename,
            "state": "ACTIVE",
            "retry_count": "0",
            "max_retries": str(max_retries),
            "lease_window": str(lease_window_seconds),
            "lease_expires_at": "0",
            "created_at": str(now),
        }

        redis_client = await self.get_redis()
        if redis_client is not None:
            key = f"download_token:{token}"
            await redis_client.hset(key, mapping=token_data)
            await redis_client.expire(key, ttl_seconds)
        else:
            # Fallback for dev / tests without Redis
            self._memory_store[token] = {
                **token_data,
                "_expires_at": now + ttl_seconds,
            }

        return token

    async def validate_and_lease_token(
        self,
        token: str,
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Atomically validate and lease the token.
        Returns:
            (is_allowed: bool, status_code_or_reason: str, token_metadata: Optional[dict])
        """
        redis_client = await self.get_redis()
        now = time.time()

        if redis_client is not None:
            key = f"download_token:{token}"
            meta = await redis_client.hgetall(key)
            if not meta:
                return False, "TOKEN_NOT_FOUND", None

            lease_window = int(meta.get("lease_window", settings.DOWNLOAD_LEASE_WINDOW_SECONDS))
            max_retries = int(meta.get("max_retries", 3))

            res = await redis_client.eval(
                LUA_REDEEM_TOKEN_SCRIPT,
                1,
                key,
                now,
                lease_window,
                max_retries,
            )

            status_code, reason = res[0], res[1]
            if status_code == 1:
                meta["retry_count"] = int(res[2])
                meta["lease_expires_at"] = float(res[3])
                meta["state"] = "LEASED"
                return True, "OK", meta
            return False, reason, meta

        # In-memory fallback
        if token not in self._memory_store:
            return False, "TOKEN_NOT_FOUND", None

        data = self._memory_store[token]
        state = data.get("state")
        retries = int(data.get("retry_count", 0))
        max_retries = int(data.get("max_retries", 3))
        lease_window = int(data.get("lease_window", settings.DOWNLOAD_LEASE_WINDOW_SECONDS))
        lease_exp = float(data.get("lease_expires_at", 0))
        ttl_exp = float(data.get("_expires_at", 0))

        if state == "ACTIVE":
            if now > ttl_exp:
                data["state"] = "EXPIRED"
                return False, "TOKEN_EXPIRED", None
            new_lease_exp = now + lease_window
            data["state"] = "LEASED"
            data["retry_count"] = 1
            data["lease_expires_at"] = new_lease_exp
            return True, "OK", data

        elif state == "LEASED":
            if now > lease_exp:
                data["state"] = "LEASE_EXPIRED"
                return False, "LEASE_EXPIRED", None
            if retries >= max_retries:
                data["state"] = "RETRIES_EXHAUSTED"
                return False, "RETRIES_EXHAUSTED", None
            next_retries = retries + 1
            data["retry_count"] = next_retries
            return True, "OK", data

        return False, "TOKEN_INACTIVE", None


token_service = TokenService()
