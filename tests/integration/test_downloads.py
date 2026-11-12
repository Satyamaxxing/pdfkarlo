"""Integration tests for download token streaming and HTTP Range support."""

import io
import pytest
from httpx import AsyncClient
from apps.api.src.services.token_service import token_service
from apps.api.src.services.storage import storage_service


@pytest.mark.asyncio
async def test_download_streaming_full_and_range(client: AsyncClient):
    # 1. Create a dummy file in storage
    file_bytes = b"%PDF-1.7\nSample PDF payload stream content for testing download token lease."
    bucket = "pdf-artifacts"
    key = "test_output.pdf"
    
    # Mock storage_service methods for this test
    storage_service.get_object_stream = lambda bucket, key, range_header=None: (
        io.BytesIO(file_bytes[0:20] if range_header else file_bytes),
        len(file_bytes[0:20] if range_header else file_bytes),
        f"bytes 0-19/{len(file_bytes)}" if range_header else None,
        "application/pdf",
    )

    # 2. Issue a token
    token = await token_service.create_download_token(
        job_id="test-job-dl",
        file_id="test-file-dl",
        s3_bucket=bucket,
        s3_key=key,
        filename="test_output.pdf",
        ttl_seconds=300,
        lease_window_seconds=60,
        max_retries=3,
    )

    # 3. Request full download
    resp = await client.get(f"/api/v1/downloads/{token}")
    assert resp.status_code == 200
    assert resp.headers["Content-Disposition"] == 'attachment; filename="test_output.pdf"'
    assert resp.headers["Accept-Ranges"] == "bytes"
    assert resp.headers["Cache-Control"] == "private, no-store, no-cache, must-revalidate"
    assert int(resp.headers["Content-Length"]) == len(file_bytes)
    assert resp.content == file_bytes

    # 4. Request byte range (within active lease window)
    range_resp = await client.get(
        f"/api/v1/downloads/{token}",
        headers={"Range": "bytes=0-19"},
    )
    assert range_resp.status_code == 206
    assert range_resp.headers["Content-Range"] == f"bytes 0-19/{len(file_bytes)}"
    assert range_resp.content == file_bytes[0:20]


@pytest.mark.asyncio
async def test_download_invalid_token(client: AsyncClient):
    resp = await client.get("/api/v1/downloads/dl_invalid_token_999")
    assert resp.status_code == 404
