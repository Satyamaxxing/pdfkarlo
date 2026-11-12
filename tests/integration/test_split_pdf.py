"""Comprehensive integration tests for Split PDF operation covering all modes and edge cases."""

import io
import json
import zipfile
import pytest
import pikepdf
from httpx import AsyncClient

from apps.worker.src.engine.split import (
    split_pdf_document,
    SplitMode,
    SplitValidationError,
    parse_ranges_string,
    parse_pages_string,
)


def create_numbered_pdf(page_count: int = 5) -> bytes:
    """Generate a valid test PDF with sequential bookmarks on every page."""
    pdf = pikepdf.Pdf.new()
    for i in range(page_count):
        pdf.add_blank_page()
    with pdf.open_outline() as outline:
        for i in range(page_count):
            outline.root.append(pikepdf.OutlineItem(f"Page_{i+1}", i))
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_split_single_page_pdf(client: AsyncClient):
    pdf_bytes = create_numbered_pdf(1)
    files = [("files", ("single.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "split",
        "options": json.dumps({"mode": "range", "ranges": "1"}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"
    assert len(status_data["output_files"]) == 1

    # Verify output PDF has 1 page
    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    assert dl_resp.status_code == 200
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(out_pdf.pages) == 1


@pytest.mark.asyncio
async def test_split_multiple_ranges_and_zip(client: AsyncClient):
    # 6-page document: split into 1-2, 3-4, 5-6
    pdf_bytes = create_numbered_pdf(6)
    files = [("files", ("multi.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "split",
        "options": json.dumps({
            "mode": "range",
            "ranges": "1-2, 3-4, 5-6",
            "base_filename": "report",
        }),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"

    # Should have 3 split PDF files + 1 ZIP bundle = 4 files
    assert len(status_data["output_files"]) == 4

    zip_file = next(f for f in status_data["output_files"] if f["mime_type"] == "application/zip")
    assert zip_file["filename_original"] == "report.zip"

    # Download ZIP bundle and verify contents
    dl_resp = await client.get(f"/api/v1/downloads/{zip_file['download_token']}")
    assert dl_resp.status_code == 200

    with zipfile.ZipFile(io.BytesIO(dl_resp.content), "r") as zf:
        namelist = zf.namelist()
        assert len(namelist) == 3
        # Check first part
        part1_bytes = zf.read(namelist[0])
        part1_pdf = pikepdf.open(io.BytesIO(part1_bytes))
        assert len(part1_pdf.pages) == 2


@pytest.mark.asyncio
async def test_extract_first_and_last_page(client: AsyncClient):
    # 5-page document: extract page 1 and page 5
    pdf_bytes = create_numbered_pdf(5)
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "split",
        "options": json.dumps({
            "mode": "extract",
            "pages": "1, 5",
            "output_filename": "extracted_first_last.pdf",
        }),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"
    assert len(status_data["output_files"]) == 1

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(out_pdf.pages) == 2


@pytest.mark.asyncio
async def test_split_burst_every_page(client: AsyncClient):
    # 3-page document: burst into 3 separate 1-page PDFs
    pdf_bytes = create_numbered_pdf(3)
    files = [("files", ("book.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "split",
        "options": json.dumps({"mode": "burst", "base_filename": "book"}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"

    # 3 single page files + 1 ZIP bundle = 4 files
    assert len(status_data["output_files"]) == 4


@pytest.mark.asyncio
async def test_split_invalid_and_overlapping_ranges(client: AsyncClient):
    pdf_bytes = create_numbered_pdf(5)
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    # Overlapping: 1-3 and 2-4
    data = {
        "operation": "split",
        "options": json.dumps({"mode": "range", "ranges": "1-3, 2-4"}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "SPLIT_VALIDATION_ERROR"
    assert "overlapping" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_split_out_of_range_page(client: AsyncClient):
    pdf_bytes = create_numbered_pdf(3)
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    # Page 10 is out of bounds for a 3-page PDF
    data = {
        "operation": "split",
        "options": json.dumps({"mode": "extract", "pages": "1, 10"}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "SPLIT_VALIDATION_ERROR"
    assert "exceeds" in status_data["error_message"].lower() or "out of bounds" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_split_encrypted_pdf(client: AsyncClient):
    # Encrypted document
    pdf = pikepdf.Pdf.new()
    pdf.add_blank_page()
    enc = pikepdf.Encryption(owner="owner_key", user="user_key", R=6)
    buf = io.BytesIO()
    pdf.save(buf, encryption=enc)
    enc_bytes = buf.getvalue()

    files = [("files", ("locked.pdf", enc_bytes, "application/pdf"))]
    data = {"operation": "split", "options": json.dumps({"mode": "burst"})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_ENCRYPTED"


@pytest.mark.asyncio
async def test_split_corrupted_pdf(client: AsyncClient):
    corrupt_bytes = b"%PDF-1.4\ncorrupted junk bytes that cannot be parsed by qpdf"
    files = [("files", ("damaged.pdf", corrupt_bytes, "application/pdf"))]
    data = {"operation": "split", "options": json.dumps({"mode": "burst"})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_CORRUPTED"


@pytest.mark.asyncio
async def test_split_requires_exactly_one_file(client: AsyncClient):
    # Sending 2 files for split should be rejected with 400
    pdf_bytes = create_numbered_pdf(2)
    files = [
        ("files", ("f1.pdf", pdf_bytes, "application/pdf")),
        ("files", ("f2.pdf", pdf_bytes, "application/pdf")),
    ]
    data = {"operation": "split"}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 400
    assert "exactly one input pdf file" in resp.json()["detail"].lower()


def test_parse_ranges_helpers():
    ranges = parse_ranges_string("1-3, 5-8", 10)
    assert ranges == [(1, 3), (5, 8)]

    with pytest.raises(SplitValidationError):
        parse_ranges_string("8-3", 10)  # start > end

    with pytest.raises(SplitValidationError):
        parse_ranges_string("1-15", 10)  # > total_pages


def test_parse_pages_helpers():
    pages = parse_pages_string("1, 4, 7", 10)
    assert pages == [1, 4, 7]

    with pytest.raises(SplitValidationError):
        parse_pages_string("0, 2", 10)

    with pytest.raises(SplitValidationError):
        parse_pages_string("1, 12", 10)
