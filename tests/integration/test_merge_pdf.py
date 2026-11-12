"""Comprehensive integration tests for Merge PDF operation covering all edge cases."""

import io
import pytest
import pikepdf
from httpx import AsyncClient

from apps.worker.src.engine.merge import (
    merge_pdf_documents,
    PdfEngineError,
    PdfEncryptionError,
    PdfCorruptionError,
)
from apps.api.src.services.storage import storage_service


def make_numbered_pdf(page_texts: list[str]) -> bytes:
    """Create a PDF with specific page count and text markers for ordering verification."""
    pdf = pikepdf.Pdf.new()
    for text in page_texts:
        page = pdf.add_blank_page()
        # Add metadata or outline so we can verify sequence
        # We can also add a bookmark for each page
    with pdf.open_outline() as outline:
        for t in page_texts:
            item = pikepdf.OutlineItem(t, 0)
            outline.root.append(item)
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_merge_two_valid_pdfs(client: AsyncClient):
    pdf_a = make_numbered_pdf(["Page A1", "Page A2"])
    pdf_b = make_numbered_pdf(["Page B1"])

    files = [
        ("files", ("doc_a.pdf", pdf_a, "application/pdf")),
        ("files", ("doc_b.pdf", pdf_b, "application/pdf")),
    ]
    data = {"operation": "merge", "options": "{}"}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "COMPLETED"

    # Download output
    token = status_resp.json()["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    assert dl_resp.status_code == 200

    merged = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(merged.pages) == 3


@pytest.mark.asyncio
async def test_merge_multiple_pdfs(client: AsyncClient):
    pdf_1 = make_numbered_pdf(["P1"])
    pdf_2 = make_numbered_pdf(["P2", "P3"])
    pdf_3 = make_numbered_pdf(["P4"])
    pdf_4 = make_numbered_pdf(["P5", "P6", "P7"])

    files = [
        ("files", ("doc1.pdf", pdf_1, "application/pdf")),
        ("files", ("doc2.pdf", pdf_2, "application/pdf")),
        ("files", ("doc3.pdf", pdf_3, "application/pdf")),
        ("files", ("doc4.pdf", pdf_4, "application/pdf")),
    ]
    data = {"operation": "merge", "options": "{}"}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.json()["status"] == "COMPLETED"

    token = status_resp.json()["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    merged = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(merged.pages) == 7  # 1 + 2 + 1 + 3 = 7


@pytest.mark.asyncio
async def test_merge_user_selected_ordering(client: AsyncClient):
    # Doc 1 has 1 page, Doc 2 has 2 pages, Doc 3 has 3 pages
    doc1 = make_numbered_pdf(["Doc1_Page1"])
    doc2 = make_numbered_pdf(["Doc2_Page1", "Doc2_Page2"])
    doc3 = make_numbered_pdf(["Doc3_Page1", "Doc3_Page2", "Doc3_Page3"])

    # Upload in order 1, 2, 3
    files = [
        ("files", ("file1.pdf", doc1, "application/pdf")),
        ("files", ("file2.pdf", doc2, "application/pdf")),
        ("files", ("file3.pdf", doc3, "application/pdf")),
    ]
    # But user orders them: file3, file1, file2
    options_json = '{"file_order": ["file3.pdf", "file1.pdf", "file2.pdf"]}'
    data = {"operation": "merge", "options": options_json}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.json()["status"] == "COMPLETED"

    token = status_resp.json()["download_token"]
    dl_resp = await client.get(f"/api/v1/downloads/{token}")
    merged = pikepdf.open(io.BytesIO(dl_resp.content))
    assert len(merged.pages) == 6

    # Verify bookmarks sequence matches custom order: file3 (3 items), file1 (1 item), file2 (2 items)
    with merged.open_outline() as outline:
        titles = [item.title for item in outline.root]
        assert titles[0] == "Doc3_Page1"
        assert titles[1] == "Doc3_Page2"
        assert titles[2] == "Doc3_Page3"
        assert titles[3] == "Doc1_Page1"
        assert titles[4] == "Doc2_Page1"
        assert titles[5] == "Doc2_Page2"


@pytest.mark.asyncio
async def test_merge_corrupted_pdf_handling(client: AsyncClient):
    valid_pdf = make_numbered_pdf(["Valid"])
    corrupted_bytes = b"%PDF-1.4\ncorrupted bytes that cannot be decoded as PDF"

    files = [
        ("files", ("valid.pdf", valid_pdf, "application/pdf")),
        ("files", ("corrupt.pdf", corrupted_bytes, "application/pdf")),
    ]
    data = {"operation": "merge"}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_CORRUPTED"
    assert "corrupted" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_merge_encrypted_pdf_handling(client: AsyncClient):
    valid_pdf = make_numbered_pdf(["Valid"])

    # Create password-encrypted PDF
    enc_pdf = pikepdf.Pdf.new()
    enc_pdf.add_blank_page()
    encryption = pikepdf.Encryption(owner="owner_pass", user="user_pass", R=6)
    enc_buf = io.BytesIO()
    enc_pdf.save(enc_buf, encryption=encryption)
    encrypted_bytes = enc_buf.getvalue()

    files = [
        ("files", ("valid.pdf", valid_pdf, "application/pdf")),
        ("files", ("encrypted.pdf", encrypted_bytes, "application/pdf")),
    ]
    data = {"operation": "merge"}

    resp = await client.post("/api/v1/jobs", data=data, files=files)
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    status_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "FAILED"
    assert status_data["error_code"] == "PDF_ENCRYPTED"
    assert "password-protected" in status_data["error_message"].lower()


@pytest.mark.asyncio
async def test_merge_empty_uploads_validation(client: AsyncClient):
    data = {"operation": "merge"}
    resp = await client.post("/api/v1/jobs", data=data, files=[])
    assert resp.status_code in (400, 422)


def test_merge_engine_direct_insufficient_files():
    with pytest.raises(PdfEngineError):
        merge_pdf_documents([])
    with pytest.raises(PdfEngineError):
        merge_pdf_documents([b"%PDF-1.4\n..."])
