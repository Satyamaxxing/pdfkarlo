"""Comprehensive integration tests for Remove PDF pages operations covering
single/multiple page removal, first/last page removal, non-consecutive removal,
orientation and annotation preservation, bounds validation, zero-page protection,
encryption, corruption, and multi-file rejection.
"""

import io
import json
import pytest
import pikepdf
from httpx import AsyncClient

from apps.worker.src.engine.remove import (
    remove_pdf_pages,
    RemoveValidationError,
    parse_remove_pages,
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
    """Generate a multi-page PDF where pages 1 and 3 have text annotations."""
    pdf = pikepdf.Pdf.new()
    for _ in range(page_count):
        pdf.add_blank_page()

    annot1 = pdf.make_indirect(pikepdf.Dictionary(
        Type=pikepdf.Name.Annot,
        Subtype=pikepdf.Name.Text,
        Contents="Page 1 Notice",
        Rect=[20, 20, 100, 100],
    ))
    pdf.pages[0].Annots = pdf.make_indirect(pikepdf.Array([annot1]))

    if page_count >= 3:
        annot3 = pdf.make_indirect(pikepdf.Dictionary(
            Type=pikepdf.Name.Annot,
            Subtype=pikepdf.Name.Text,
            Contents="Page 3 Audit Note",
            Rect=[30, 30, 120, 120],
        ))
        pdf.pages[2].Annots = pdf.make_indirect(pikepdf.Array([annot3]))

    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_remove_single_page(client: AsyncClient):
    """Test removing page 2 from a 3-page document leaves 2 pages."""
    pdf_bytes = create_test_pdf_with_orientations([90, 180, 270])
    files = [("files", ("test_remove.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [2]}),
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
    assert len(out_pdf.pages) == 2
    # Original: [90, 180, 270] -> Remove page 2 -> Remaining: [90, 270]
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 90
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 270


@pytest.mark.asyncio
async def test_remove_multiple_pages(client: AsyncClient):
    """Test removing pages [1, 3] from a 4-page document leaves pages 2 and 4."""
    pdf_bytes = create_test_pdf_with_orientations([0, 90, 180, 270])
    files = [("files", ("multi_remove.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [1, 3]}),
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
    assert len(out_pdf.pages) == 2
    # Original pages 2 and 4 remained -> [90, 270]
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 90
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 270


@pytest.mark.asyncio
async def test_remove_first_and_last_page(client: AsyncClient):
    """Test removing pages [1, 5] from a 5-page document leaves pages 2, 3, 4."""
    pdf_bytes = create_test_pdf_with_orientations([90, 0, 180, 0, 270])
    files = [("files", ("boundary_remove.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [1, 5]}),
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
    # Original pages 2, 3, 4 -> [0, 180, 0]
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 0
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 180
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 0


@pytest.mark.asyncio
async def test_remove_non_consecutive_pages(client: AsyncClient):
    """Test removing pages [2, 4] from a 5-page document leaves pages 1, 3, 5."""
    pdf_bytes = create_test_pdf_with_orientations([10, 20, 30, 40, 50])
    files = [("files", ("non_consec.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [2, 4]}),
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
    # Original pages 1, 3, 5 -> [10, 30, 50]
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 10
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 30
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 50


@pytest.mark.asyncio
async def test_remove_preserves_annotations(client: AsyncClient):
    """Verify that removing page 2 preserves annotations on kept pages 1 and 3."""
    pdf_bytes = create_test_pdf_with_annotations(page_count=3)
    files = [("files", ("annotated.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [2]}),
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
    assert len(out_pdf.pages) == 2

    # Kept page 1 (was page 1) has annotation
    assert len(out_pdf.pages[0].Annots) == 1
    assert str(out_pdf.pages[0].Annots[0].Contents) == "Page 1 Notice"

    # Kept page 2 (was page 3) has annotation
    assert len(out_pdf.pages[1].Annots) == 1
    assert str(out_pdf.pages[1].Annots[0].Contents) == "Page 3 Audit Note"


@pytest.mark.asyncio
async def test_remove_all_pages_rejected(client: AsyncClient):
    """Verify that attempting to remove all pages fails with REMOVE_VALIDATION_ERROR."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0, 0])
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [1, 2, 3]}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "REMOVE_VALIDATION_ERROR"
    assert "at least one page" in status_data["error_message"].lower() or "cannot remove all" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_remove_out_of_bounds_index_rejected(client: AsyncClient):
    """Test that page index > total_pages is rejected."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0])
    files = [("files", ("bounds.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [99]}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "REMOVE_VALIDATION_ERROR"
    assert "out of bounds" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_remove_duplicate_indexes_handled(client: AsyncClient):
    """Verify duplicate and unsorted indexes are deduplicated and processed cleanly."""
    pdf_bytes = create_test_pdf_with_orientations([0, 90, 180, 270])
    files = [("files", ("duplicates.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": [3, 1, 1, 3]}),  # removes pages 1 and 3
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
    assert len(out_pdf.pages) == 2
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 90
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 270


@pytest.mark.asyncio
async def test_remove_comma_separated_string(client: AsyncClient):
    """Test specifying pages as comma-separated string '2, 4'."""
    pdf_bytes = create_test_pdf_with_orientations([10, 20, 30, 40, 50])
    files = [("files", ("csv_pages.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "remove",
        "options": json.dumps({"pages": "2, 4"}),
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


@pytest.mark.asyncio
async def test_remove_encrypted_pdf_rejected(client: AsyncClient):
    """Verify that password-protected PDFs are rejected with PDF_ENCRYPTED."""
    pdf = pikepdf.Pdf.new()
    pdf.add_blank_page()
    pdf.add_blank_page()
    enc_buf = io.BytesIO()
    encryption = pikepdf.Encryption(owner="owner", user="user", R=6)
    pdf.save(enc_buf, encryption=encryption)

    files = [("files", ("locked.pdf", enc_buf.getvalue(), "application/pdf"))]
    data = {"operation": "remove", "options": json.dumps({"pages": [1]})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_ENCRYPTED"


@pytest.mark.asyncio
async def test_remove_corrupted_pdf_rejected(client: AsyncClient):
    """Verify corrupted PDF bytes trigger PDF_CORRUPTED."""
    corrupted_bytes = b"%PDF-1.7 Corrupted broken payload 12345"
    files = [("files", ("broken.pdf", corrupted_bytes, "application/pdf"))]
    data = {"operation": "remove", "options": json.dumps({"pages": [1]})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_CORRUPTED"


@pytest.mark.asyncio
async def test_remove_requires_exactly_one_file(client: AsyncClient):
    """Verify HTTP 400 Bad Request if multiple files are provided to remove."""
    pdf1 = pikepdf.Pdf.new()
    pdf1.add_blank_page()
    buf1 = io.BytesIO()
    pdf1.save(buf1)

    pdf2 = pikepdf.Pdf.new()
    pdf2.add_blank_page()
    buf2 = io.BytesIO()
    pdf2.save(buf2)

    files = [
        ("files", ("doc1.pdf", buf1.getvalue(), "application/pdf")),
        ("files", ("doc2.pdf", buf2.getvalue(), "application/pdf")),
    ]
    data = {"operation": "remove", "options": json.dumps({"pages": [1]})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 400
    assert "requires exactly one input" in resp.json()["detail"].lower()


def test_parse_remove_pages_unit_cases():
    """Unit test for parse_remove_pages helper function."""
    assert parse_remove_pages([2], 5) == [2]
    assert parse_remove_pages([3, 1, 2], 5) == [1, 2, 3]
    assert parse_remove_pages("1, 4", 5) == [1, 4]
    assert parse_remove_pages(1, 3) == [1]
    assert parse_remove_pages({2, 3}, 4) == [2, 3]

    with pytest.raises(RemoveValidationError, match="required"):
        parse_remove_pages(None, 5)

    with pytest.raises(RemoveValidationError, match="No pages specified"):
        parse_remove_pages([], 5)

    with pytest.raises(RemoveValidationError, match="out of bounds"):
        parse_remove_pages([0], 5)

    with pytest.raises(RemoveValidationError, match="out of bounds"):
        parse_remove_pages([6], 5)

    with pytest.raises(RemoveValidationError, match="Cannot remove all"):
        parse_remove_pages([1, 2, 3], 3)
