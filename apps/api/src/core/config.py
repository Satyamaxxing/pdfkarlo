"""Global configuration management for the PDF Processing Platform API."""

import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # General
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    APP_SECRET_KEY: str = "change-me-to-a-secure-random-256-bit-key-in-production"
    
    # API Gateway
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pdf_user:pdf_password_secure@localhost:5432/pdf_platform"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage (S3 / MinIO)
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_RAW_BUCKET: str = "pdf-raw-staging"
    S3_ARTIFACT_BUCKET: str = "pdf-artifacts"
    S3_FORCE_PATH_STYLE: bool = True

    # Quotas & Deadlines
    MAX_FILE_SIZE_BYTES: int = 104857600  # 100 MB
    MAX_PAGE_COUNT: int = 1000
    DOWNLOAD_TOKEN_TTL_SECONDS: int = 900  # 15 minutes base
    DOWNLOAD_LEASE_WINDOW_SECONDS: int = 120  # 120 seconds retry lease
    RETENTION_HOURS: int = 2


settings = Settings()
