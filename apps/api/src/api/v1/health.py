"""Health check endpoints for container orchestrators and monitoring systems."""

import time
from datetime import datetime, timezone
from fastapi import APIRouter, Response, status

from apps.api.src.core.config import settings
from apps.api.src.db.session import check_database_health
from apps.api.src.services.storage import storage_service
from apps.api.src.services.token_service import token_service
from apps.api.src.schemas.job import HealthResponse, HealthComponentStatus

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
async def get_health_status(response: Response):
    """
    Comprehensive health check testing PostgreSQL, Redis, and MinIO/S3.
    """
    components = {}
    is_healthy = True

    # Check Database
    t0 = time.perf_counter()
    db_ok = await check_database_health()
    t_db = (time.perf_counter() - t0) * 1000
    components["database"] = HealthComponentStatus(
        status="healthy" if db_ok else "unhealthy",
        latency_ms=round(t_db, 2),
        details="Connected" if db_ok else "Database connection failed",
    )
    if not db_ok:
        is_healthy = False

    # Check Redis
    t0 = time.perf_counter()
    redis_ok = await token_service.check_health()
    t_redis = (time.perf_counter() - t0) * 1000
    components["redis"] = HealthComponentStatus(
        status="healthy" if redis_ok else "unhealthy",
        latency_ms=round(t_redis, 2),
        details="Connected" if redis_ok else "Redis connection failed",
    )
    if not redis_ok:
        is_healthy = False

    # Check S3 / MinIO
    t0 = time.perf_counter()
    s3_ok = storage_service.check_health()
    t_s3 = (time.perf_counter() - t0) * 1000
    components["storage"] = HealthComponentStatus(
        status="healthy" if s3_ok else "unhealthy",
        latency_ms=round(t_s3, 2),
        details="Connected" if s3_ok else "Storage cluster unreachable",
    )
    if not s3_ok:
        is_healthy = False

    overall_status = "healthy" if is_healthy else "degraded"
    if not is_healthy and settings.ENVIRONMENT == "production":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthResponse(
        status=overall_status,
        version="0.1.0",
        timestamp=datetime.now(timezone.utc),
        components=components,
    )


@router.get("/liveness", status_code=status.HTTP_200_OK)
async def get_liveness():
    """Kubernetes liveness probe: verifies process is alive and responsive."""
    return {"status": "alive"}


@router.get("/readiness", status_code=status.HTTP_200_OK)
async def get_readiness(response: Response):
    """Kubernetes readiness probe: verifies process is ready to receive traffic."""
    db_ok = await check_database_health()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "unready", "reason": "Database connection failed"}
    return {"status": "ready"}
