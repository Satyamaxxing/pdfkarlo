"""Pytest fixtures and test environment configuration."""

import asyncio
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Override settings before importing app
from apps.api.src.core.config import settings
settings.ENVIRONMENT = "test"
settings.DATABASE_URL = "sqlite+aiosqlite:///:memory:"
settings.REDIS_URL = "redis://mock:6379/0"

from apps.api.src.db.session import Base, get_db
from apps.api.src.services.storage import storage_service
from apps.api.src.main import app

# In-memory test engine
test_engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Create all database tables for test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide isolated db session for each test."""
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide AsyncClient for FastAPI endpoint testing with db dependency override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # In-memory storage dictionary to simulate S3 in tests
    _in_memory_s3 = {}

    def mock_upload_bytes(bucket, key, data, content_type=None, metadata=None):
        _in_memory_s3[f"{bucket}/{key}"] = data
        return f"{bucket}/{key}"

    def mock_download_bytes(bucket, key):
        full_key = f"{bucket}/{key}"
        if full_key in _in_memory_s3:
            return _in_memory_s3[full_key]
        return b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

    import io
    def mock_get_object_stream(bucket, key, range_header=None):
        data = mock_download_bytes(bucket, key)
        if range_header and range_header.startswith("bytes="):
            parts = range_header.replace("bytes=", "").split("-")
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if parts[1] else len(data) - 1
            chunk = data[start:end+1]
            return io.BytesIO(chunk), len(chunk), f"bytes {start}-{end}/{len(data)}", "application/pdf"
        return io.BytesIO(data), len(data), None, "application/pdf"

    storage_service.upload_bytes = mock_upload_bytes
    storage_service.download_bytes = mock_download_bytes
    storage_service.get_object_stream = mock_get_object_stream
    storage_service.check_health = lambda: True

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()
