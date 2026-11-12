"""FastAPI application entrypoint for the PDF Processing Platform."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from apps.api.src.core.config import settings
from apps.api.src.api.v1 import api_v1_router
from apps.api.src.db.session import engine, Base
from apps.api.src.services.storage import storage_service
from apps.api.src.services.token_service import token_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and graceful shutdown lifecycle."""
    # Startup tasks
    try:
        storage_service.ensure_buckets_exist()
    except Exception:
        pass

    # Ensure database schema exists across all deployment environments
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        pass

    yield

    # Shutdown tasks
    try:
        await engine.dispose()
    except Exception:
        pass

    try:
        r = await token_service.get_redis()
        if r is not None:
            await r.close()
    except Exception:
        pass


app = FastAPI(
    title="PDF Processing Platform API",
    version="0.1.0",
    description="High-performance, secure, ephemeral PDF manipulation platform API.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Range", "Accept-Ranges", "X-Download-Attempts-Remaining"],
)

# Mount API v1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global catch-all exception handler to sanitize error responses in production."""
    # If it's already an HTTPException, FastAPI handles it natively
    if isinstance(exc, (HTTPException,)):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    # In development with DEBUG=True, provide exception details
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "INTERNAL_SERVER_ERROR", "detail": str(exc)},
        )

    # In production, return a sanitized generic error without leaking internals
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "detail": "An unexpected error occurred while processing your request. Please try again later.",
        },
    )


@app.get("/", tags=["Root"])
async def root():
    """Root platform discovery endpoint."""
    return {
        "name": "PDF Processing Platform API",
        "version": "0.1.0",
        "status": "operational",
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_url": f"{settings.API_V1_STR}/health",
    }
