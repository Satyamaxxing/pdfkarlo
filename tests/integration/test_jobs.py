"""Integration tests for job creation, validation, and merge execution."""

import io
import pytest
import pikepdf
from httpx import AsyncClient


def create_test_pdf_bytes(page_count: int = 1) -> bytes:
    """Helper to generate a real, valid PDF binary stream with a specified page count."""
    pdf = pikepdf.Pdf.new()
    for _ in range(page_count):
        pdf.add_blank_page()
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_create_job_merge_success(client: AsyncClient):
    # Create two authentic PDFs: 2 pages and 3 pages
    pdf1_bytes = create_test_pdf_bytes(2)
    pdf2_bytes = create_test_pdf_bytes(3)

    files = [
        ("files", ("doc1.pdf", pdf1_bytes, "application/pdf")),
        ("files", ("doc2.pdf", pdf2_bytes, "application/pdf")),
    ]
    data = {
        "operation": "merge",
        "options": '{"output_filename": "combined.pdf"}',
    }

    # 1. Post job
    response = await client.post("/api/v1/jobs", data=data, files=files)
    assert response.status_code == 201
    job_data = response.json()
    assert "job_id" in job_data
    assert job_data["operation"] == "merge"
    assert "expires_at" in job_data

    # 2. Check job status
    job_id = job_data["job_id"]
    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["job_id"] == job_id
    assert status_data["status"] == "COMPLETED"
    assert status_data["progress_percent"] == 100
    assert status_data["download_token"] is not None
    assert status_data["download_url"] is not None
    assert len(status_data["output_files"]) == 1
    assert status_data["output_files"][0]["filename_original"] == "combined.pdf"

    # 3. Download merged artifact and verify page count integrity
    token = status_data["download_token"]
    download_resp = await client.get(f"/api/v1/downloads/{token}")
    assert download_resp.status_code == 200
    assert download_resp.headers["Content-Disposition"] == 'attachment; filename="combined.pdf"'

    # Verify actual PDF structure
    merged_pdf = pikepdf.open(io.BytesIO(download_resp.content))
    assert len(merged_pdf.pages) == 5  # 2 + 3 = 5 pages!


@pytest.mark.asyncio
async def test_create_job_single_file_rejected(client: AsyncClient):
    pdf_bytes = create_test_pdf_bytes(1)
    files = [
        ("files", ("only_one.pdf", pdf_bytes, "application/pdf")),
    ]
    data = {"operation": "merge"}

    response = await client.post("/api/v1/jobs", data=data, files=files)
    assert response.status_code == 400
    assert "at least two input pdf files" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_job_invalid_magic_bytes(client: AsyncClient):
    fake_content = b"This is not a PDF file header at all."
    files = [
        ("files", ("malicious_1.pdf", fake_content, "application/pdf")),
        ("files", ("malicious_2.pdf", fake_content, "application/pdf")),
    ]
    data = {
        "operation": "merge",
    }

    response = await client.post("/api/v1/jobs", data=data, files=files)
    assert response.status_code == 400
    assert "validation failed" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_nonexistent_job(client: AsyncClient):
    nonexistent_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/jobs/{nonexistent_uuid}")
    assert response.status_code == 404
