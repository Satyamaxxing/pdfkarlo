"""Comprehensive integration tests for Reorder PDF operations covering permutations,
reversal, first/last shifts, orientation preservation, annotation preservation,
invalid permutations, corruption, and encryption defenses.
"""

import io
import json
import pytest
import pikepdf
from httpx import AsyncClient

from apps.worker.src.engine.reorder import (
    reorder_pdf_document,
    ReorderValidationError,
    validate_page_sequence,
)


def create_test_pdf_with_orientations(orientations: list[int]) -> bytes:
    """Generate a multi-page PDF with explicit /Rotate values on each page."""
    pdf = pikepdf.Pdf.new()
    for rot in orientations:
        page = pdf.add_blank_page()
        if rot != 0:
            page.Rotate = rot
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


def create_test_pdf_with_annotations(page_count: int = 3) -> bytes:
    """Generate a multi-page PDF where page 1 has a text annotation."""
    pdf = pikepdf.Pdf.new()
    for _ in range(page_count):
        pdf.add_blank_page()
    annot = pdf.make_indirect(pikepdf.Dictionary(
        Type=pikepdf.Name.Annot,
        Subtype=pikepdf.Name.Text,
        Contents="Confidential Review",
        Rect=[20, 20, 100, 100],
    ))
    pdf.pages[0].Annots = pdf.make_indirect(pikepdf.Array([annot]))
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_reorder_normal_sequence(client: AsyncClient):
    """Test standard permutation [2, 1, 3] on a 3-page document."""
    # Page 1: 90°, Page 2: 180°, Page 3: 270°
    pdf_bytes = create_test_pdf_with_orientations([90, 180, 270])
    files = [("files", ("test_reorder.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "reorder",
        "options": json.dumps({"sequence": [2, 1, 3]}),
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
    assert dl_resp.status_code == 200

    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(out_pdf.pages) == 3
    # Original: [90, 180, 270] -> Permutation [2, 1, 3] -> Expected: [180, 90, 270]
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 180
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 90
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 270


@pytest.mark.asyncio
async def test_reorder_reverse_page_order(client: AsyncClient):
    """Test complete reversal [4, 3, 2, 1] on a 4-page document."""
    pdf_bytes = create_test_pdf_with_orientations([0, 90, 180, 270])
    files = [("files", ("reverse.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "reorder",
        "options": json.dumps({"sequence": "4, 3, 2, 1"}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(out_pdf.pages) == 4
    # Expected reverse orientation: [270, 180, 90, 0]
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 270
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 180
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 90
    assert int(out_pdf.pages[3].get("/Rotate", 0)) == 0


@pytest.mark.asyncio
async def test_reorder_first_and_last_page_movement(client: AsyncClient):
    """Test moving first page to last position: [2, 3, 4, 1]."""
    pdf_bytes = create_test_pdf_with_orientations([90, 0, 0, 0])
    files = [("files", ("shift.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "reorder",
        "options": json.dumps({"sequence": [2, 3, 4, 1]}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(out_pdf.pages) == 4
    # The page with 90° orientation is now at index 3 (last page)
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 0
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 0
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 0
    assert int(out_pdf.pages[3].get("/Rotate", 0)) == 90


@pytest.mark.asyncio
async def test_reorder_preserves_annotations(client: AsyncClient):
    """Test that page annotations travel with their respective reordered pages."""
    pdf_bytes = create_test_pdf_with_annotations(3)
    files = [("files", ("annots.pdf", pdf_bytes, "application/pdf"))]
    # Move page 1 (which holds the annotation) to position 3: [2, 3, 1]
    data = {
        "operation": "reorder",
        "options": json.dumps({"sequence": [2, 3, 1]}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "COMPLETED"

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(out_pdf.pages) == 3
    # Page 1 & 2 have no annots; Page 3 has the moved annotation
    assert not hasattr(out_pdf.pages[0], "Annots")
    assert not hasattr(out_pdf.pages[1], "Annots")
    assert hasattr(out_pdf.pages[2], "Annots")
    assert "Confidential Review" in str(out_pdf.pages[2].Annots[0].Contents)


@pytest.mark.asyncio
async def test_reorder_duplicate_index_rejected(client: AsyncClient):
    """Test that sequences with duplicate page numbers are rejected."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0, 0])
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "reorder",
        "options": json.dumps({"sequence": [1, 2, 2]}),  # duplicate page 2
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "REORDER_VALIDATION_ERROR"
    assert "duplicate" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_reorder_missing_pages_rejected(client: AsyncClient):
    """Test that sequences missing pages are rejected."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0, 0, 0])
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "reorder",
        "options": json.dumps({"sequence": [1, 2, 4]}),  # missing page 3
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "REORDER_VALIDATION_ERROR"
    assert "incomplete" in status_data["error_message"].lower() or "missing" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_reorder_out_of_bounds_index_rejected(client: AsyncClient):
    """Test that indices > total_pages or < 1 are rejected."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0])
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "reorder",
        "options": json.dumps({"sequence": [1, 99]}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "REORDER_VALIDATION_ERROR"
    assert "out of bounds" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_reorder_encrypted_pdf_rejected(client: AsyncClient):
    """Verify that password-protected PDFs are rejected with PDF_ENCRYPTED."""
    pdf = pikepdf.Pdf.new()
    pdf.add_blank_page()
    enc_buf = io.BytesIO()
    encryption = pikepdf.Encryption(owner="owner", user="user", R=6)
    pdf.save(enc_buf, encryption=encryption)

    files = [("files", ("locked.pdf", enc_buf.getvalue(), "application/pdf"))]
    data = {"operation": "reorder", "options": json.dumps({"sequence": [1]})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_ENCRYPTED"


@pytest.mark.asyncio
async def test_reorder_corrupted_pdf_rejected(client: AsyncClient):
    """Verify corrupted PDF bytes trigger PDF_CORRUPTED."""
    corrupted_bytes = b"%PDF-1.7 Corrupted broken payload 12345"
    files = [("files", ("broken.pdf", corrupted_bytes, "application/pdf"))]
    data = {"operation": "reorder", "options": json.dumps({"sequence": [1]})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_CORRUPTED"


@pytest.mark.asyncio
async def test_reorder_requires_exactly_one_file(client: AsyncClient):
    """Submitting 2 or more files must be rejected upfront with HTTP 400."""
    pdf_bytes = create_test_pdf_with_orientations([0])
    files = [
        ("files", ("doc1.pdf", pdf_bytes, "application/pdf")),
        ("files", ("doc2.pdf", pdf_bytes, "application/pdf")),
    ]
    data = {"operation": "reorder", "options": json.dumps({"sequence": [1]})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 400
    assert "exactly one" in resp.json()["detail"].lower()


def test_validate_page_sequence_helper():
    """Unit test for sequence permutation validator."""
    assert validate_page_sequence([3, 1, 2], 3) == [3, 1, 2]
    assert validate_page_sequence("2, 1", 2) == [2, 1]

    # Incomplete
    with pytest.raises(ReorderValidationError):
        validate_page_sequence([1, 2], 3)

    # Duplicates
    with pytest.raises(ReorderValidationError):
        validate_page_sequence([1, 1, 2], 3)

    # Out of range
    with pytest.raises(ReorderValidationError):
        validate_page_sequence([1, 2, 4], 3)

    # None or empty
    with pytest.raises(ReorderValidationError):
        validate_page_sequence([], 3)
