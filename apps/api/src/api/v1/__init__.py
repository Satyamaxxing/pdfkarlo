"""API v1 router assembly."""

from fastapi import APIRouter
from apps.api.src.api.v1.health import router as health_router
from apps.api.src.api.v1.jobs import router as jobs_router
from apps.api.src.api.v1.downloads import router as downloads_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(downloads_router)

__all__ = ["api_v1_router"]
