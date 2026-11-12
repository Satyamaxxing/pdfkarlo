"""Integration tests for health check endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_discovery(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "PDF Processing Platform API"
    assert data["status"] == "operational"
    assert "/api/v1/health" in data["health_url"]


@pytest.mark.asyncio
async def test_health_liveness(client: AsyncClient):
    response = await client.get("/api/v1/health/liveness")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_health_readiness(client: AsyncClient):
    # In test mode with SQLite or mocked DB, readiness responds 200 or 503 depending on connectivity
    response = await client.get("/api/v1/health/readiness")
    assert response.status_code in (200, 503)


@pytest.mark.asyncio
async def test_health_overview(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "components" in data
    assert "database" in data["components"]
    assert "redis" in data["components"]
    assert "storage" in data["components"]
