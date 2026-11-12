"""Comprehensive integration tests for Rotate PDF operations covering mixed orientations,
rotation preservation, page subsets, per-page maps, bounds checks, encryption, and corruption defenses.
"""

import io
import json
import pytest
import pikepdf
from httpx import AsyncClient

from apps.worker.src.engine.rotate import (
    rotate_pdf_document,
    RotateValidationError,
    validate_rotation_angle,
    parse_rotate_pages,
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


@pytest.mark.asyncio
async def test_rotate_all_pages_90_degrees(client: AsyncClient):
    """Test rotating all pages of a 3-page standard PDF by 90 degrees."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0, 0])
    files = [("files", ("standard.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 90}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    print("STATUS DATA:", status_data)
    assert status_data["status"] == "COMPLETED"
    assert len(status_data["output_files"]) == 1

    # Verify download content
    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    assert dl_resp.status_code == 200

    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(out_pdf.pages) == 3
    for page in out_pdf.pages:
        assert int(page.get("/Rotate", 0)) == 90


@pytest.mark.asyncio
async def test_rotate_mixed_orientations_preservation(client: AsyncClient):
    """Verify that existing page rotation values are preserved and accumulated modulo 360."""
    # Page 1: 0°, Page 2: 90°, Page 3: 180°
    pdf_bytes = create_test_pdf_with_orientations([0, 90, 180])
    files = [("files", ("mixed.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 90}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    print("STATUS DATA:", status_data)
    assert status_data["status"] == "COMPLETED"

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    assert dl_resp.status_code == 200

    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    # Page 1: 0 + 90 = 90°
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 90
    # Page 2: 90 + 90 = 180°
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 180
    # Page 3: 180 + 90 = 270°
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 270


@pytest.mark.asyncio
async def test_rotate_wrap_around_360_degrees(client: AsyncClient):
    """Verify that 270° + 90° wraps cleanly to 0°."""
    pdf_bytes = create_test_pdf_with_orientations([270])
    files = [("files", ("wrap.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 90}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    print("STATUS DATA:", status_data)
    assert status_data["status"] == "COMPLETED"

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))
    # 270 + 90 = 360 % 360 = 0
    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 0


@pytest.mark.asyncio
async def test_rotate_selected_pages_only(client: AsyncClient):
    """Test rotating only specified pages (e.g. Page 2 and Page 4 of 4)."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0, 0, 0])
    files = [("files", ("four_pages.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 180, "pages": "2, 4"}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    print("STATUS DATA:", status_data)
    assert status_data["status"] == "COMPLETED"

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))

    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 0
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 180
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 0
    assert int(out_pdf.pages[3].get("/Rotate", 0)) == 180


@pytest.mark.asyncio
async def test_rotate_per_page_custom_mapping(client: AsyncClient):
    """Test specifying arbitrary angles for each page individually."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0, 0])
    files = [("files", ("per_page.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({
            "page_rotations": {
                "1": 90,
                "2": 180,
                "3": 270,
            }
        }),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    print("STATUS DATA:", status_data)
    assert status_data["status"] == "COMPLETED"

    token = status_data["output_files"][0]["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    out_pdf = pikepdf.open(io.BytesIO(dl_resp.content))

    assert int(out_pdf.pages[0].get("/Rotate", 0)) == 90
    assert int(out_pdf.pages[1].get("/Rotate", 0)) == 180
    assert int(out_pdf.pages[2].get("/Rotate", 0)) == 270


@pytest.mark.asyncio
async def test_rotate_out_of_bounds_page_fails(client: AsyncClient):
    """Verify that referencing an out-of-bounds page fails gracefully."""
    pdf_bytes = create_test_pdf_with_orientations([0, 0])  # 2 pages
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 90, "pages": "1, 10"}),  # page 10 out of bounds
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "ROTATE_VALIDATION_ERROR"
    assert "out of bounds" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_rotate_invalid_angle_fails(client: AsyncClient):
    """Verify that non-orthogonal angles (e.g. 45°) are rejected."""
    pdf_bytes = create_test_pdf_with_orientations([0])
    files = [("files", ("doc.pdf", pdf_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 45}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "ROTATE_VALIDATION_ERROR"
    assert "multiple of 90" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_rotate_encrypted_pdf_fails(client: AsyncClient):
    """Verify that password-protected PDFs are rejected with PDF_ENCRYPTED."""
    pdf = pikepdf.Pdf.new()
    pdf.add_blank_page()
    enc_buf = io.BytesIO()
    permissions = pikepdf.Permissions(accessibility=False)
    encryption = pikepdf.Encryption(owner="owner_pw", user="user_pw", R=6)
    pdf.save(enc_buf, encryption=encryption)
    enc_bytes = enc_buf.getvalue()

    files = [("files", ("locked.pdf", enc_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 90}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_ENCRYPTED"


@pytest.mark.asyncio
async def test_rotate_corrupted_pdf_fails(client: AsyncClient):
    """Verify corrupted PDF stream transitions job to FAILED with PDF_CORRUPTED."""
    corrupted_bytes = b"%PDF-1.7 Corrupted broken payload random data 12345"
    files = [("files", ("broken.pdf", corrupted_bytes, "application/pdf"))]
    data = {
        "operation": "rotate",
        "options": json.dumps({"angle": 90}),
    }

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_CORRUPTED"


@pytest.mark.asyncio
async def test_rotate_requires_exactly_one_file(client: AsyncClient):
    """Rotate must reject 2 or more files upfront with HTTP 400."""
    pdf_bytes = create_test_pdf_with_orientations([0])
    files = [
        ("files", ("f1.pdf", pdf_bytes, "application/pdf")),
        ("files", ("f2.pdf", pdf_bytes, "application/pdf")),
    ]
    data = {"operation": "rotate", "options": json.dumps({"angle": 90})}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 400
    assert "exactly one" in resp.json()["detail"].lower()


def test_validate_rotation_angle_helper():
    """Unit test for angle validation and normalization."""
    assert validate_rotation_angle(90) == 90
    assert validate_rotation_angle(180) == 180
    assert validate_rotation_angle(270) == 270
    assert validate_rotation_angle(-90) == 270
    assert validate_rotation_angle(-180) == 180
    assert validate_rotation_angle(-270) == 90

    with pytest.raises(RotateValidationError):
        validate_rotation_angle(0)

    with pytest.raises(RotateValidationError):
        validate_rotation_angle(45)

    with pytest.raises(RotateValidationError):
        validate_rotation_angle("invalid")


def test_parse_rotate_pages_helper():
    """Unit test for page parsing helper."""
    assert parse_rotate_pages("1, 2, 3", 5) == [1, 2, 3]
    assert parse_rotate_pages([1, 2, 2, 3], 5) == [1, 2, 3]
    assert parse_rotate_pages(4, 5) == [4]

    with pytest.raises(RotateValidationError):
        parse_rotate_pages("0", 5)

    with pytest.raises(RotateValidationError):
        parse_rotate_pages("6", 5)

    with pytest.raises(RotateValidationError):
        parse_rotate_pages("abc", 5)
