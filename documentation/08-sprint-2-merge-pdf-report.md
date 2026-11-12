# Sprint 2 Progress Report — Merge PDF Engine End-to-End

> **Document ID:** DOC-08-SPRINT-2-MERGE-REPORT  
> **Status:** Implemented & Verified  
> **Date:** November 12, 2026  
> **Milestone:** Sprint 2 (Merge PDF Complete)  
> **Repository:** `E:\REA`

---

## 1. Executive Summary

In accordance with the Sprint 2 plan, the **Merge PDF** operation has been implemented end-to-end across the backend processing engine, Celery worker task pipeline, REST API gateway, and Next.js 15 user interface.

The implementation is powered by **`pikepdf` 10.18.0** and **QPDF 12.4.2**, operating under the **Apache-2.0** license, fully preserving our architectural invariant of **Zero AGPL copyleft exposure**.

All 7 acceptance criteria have been achieved and verified via 25 automated unit and integration tests with a 100% pass rate.

---

## 2. Files Created or Modified

### 2.1 Backend Engine & Worker Tasks
- [`apps/worker/src/engine/__init__.py`](file:///E:/REA/apps/worker/src/engine/__init__.py): Engine exports and custom exception classes.
- [`apps/worker/src/engine/merge.py`](file:///E:/REA/apps/worker/src/engine/merge.py): Core modular PDF merge engine using `pikepdf`. Implements outline/bookmark translation, zero-copy page tree aggregation, and corruption/encryption defenses.
- [`apps/worker/src/tasks/operations.py`](file:///E:/REA/apps/worker/src/tasks/operations.py): Asynchronous (`execute_merge_job_async`) and Celery worker (`process_merge_job`) task handlers with S3 downloading, user-selected file ordering, artifact uploading, and download token generation.
- [`apps/worker/src/celery_app.py`](file:///E:/REA/apps/worker/src/celery_app.py): Registered `apps.worker.src.tasks.operations` in worker task includes.
- [`apps/worker/requirements.txt`](file:///E:/REA/apps/worker/requirements.txt): Added `pikepdf>=10.0.0` and `pillow>=10.0.0`.

### 2.2 API Gateway Ingestion & Validation
- [`apps/api/src/api/v1/jobs.py`](file:///E:/REA/apps/api/src/api/v1/jobs.py):
  - Added upfront validation: rejects merge jobs with fewer than 2 input files (HTTP 400).
  - Added automated job dispatch executing `execute_merge_job_async` in development/test mode and queuing to Celery in production.

### 2.3 Next.js 15 Frontend User Interface
- [`apps/web/src/components/FileUploadZone.tsx`](file:///E:/REA/apps/web/src/components/FileUploadZone.tsx): Reusable drag-and-drop upload target with drag-over visual feedback and file filtering.
- [`apps/web/src/components/FileReorderList.tsx`](file:///E:/REA/apps/web/src/components/FileReorderList.tsx): Reusable file management list with Move Up, Move Down, Delete, and file size formatting.
- [`apps/web/src/components/JobProgressBar.tsx`](file:///E:/REA/apps/web/src/components/JobProgressBar.tsx): Animated processing progress indicator.
- [`apps/web/src/app/merge/page.tsx`](file:///E:/REA/apps/web/src/app/merge/page.tsx): Complete Merge PDF user experience: file selection, reordering, progress tracking, error alerts, and leased-token download redemption.
- [`apps/web/src/components/ToolGrid.tsx`](file:///E:/REA/apps/web/src/components/ToolGrid.tsx): Linked Merge PDF card to `/merge`.

### 2.4 Automated Test Suite
- [`tests/integration/test_merge_pdf.py`](file:///E:/REA/tests/integration/test_merge_pdf.py): 7 dedicated integration tests verifying multi-document merging, bookmark sequences, corrupted files, encrypted files, and ordering.
- [`tests/integration/test_jobs.py`](file:///E:/REA/tests/integration/test_jobs.py): Updated with authentic multi-page PDF generation via `pikepdf`.
- [`tests/conftest.py`](file:///E:/REA/tests/conftest.py): Enhanced mock S3 storage fixture to support round-trip byte retrieval in headless mode.

---

## 3. Working Functionality Overview

```mermaid
flowchart TD
    User([User Browser]) -->|1. Drop 2+ PDFs & Reorder| Web["Next.js 15 (/merge)"]
    Web -->|2. POST /api/v1/jobs (multipart)| API["FastAPI Gateway"]
    API -->|3. Magic-Byte Check (%PDF-)| Sec[Security Validator]
    Sec -->|4. Put Objects| S3Raw[("MinIO: pdf-raw-staging")]
    API -->|5. Insert Job (PENDING)| DB[("PostgreSQL 16")]
    API -->|6. Dispatch Task| Worker["Celery Worker / Async Engine"]
    Worker -->|7. Fetch Input Bytes| S3Raw
    Worker -->|8. Execute pikepdf / QPDF 12| Engine["Merge Engine (merge.py)"]
    Engine -->|9. Preserve Outlines & Stream Compaction| Engine
    Engine -->|10. Stream Merged Bytes| S3Art[("MinIO: pdf-artifacts")]
    Worker -->|11. Generate Leased Token| Token["TokenService (Redis)"]
    Worker -->|12. Set Status = COMPLETED| DB
    Web -->|13. Poll Status (100% Progress)| API
    Web -->|14. Redeem Token (Range Stream)| API
    API -->|15. Deliver File| User
```

### 3.1 Backend Capabilities
1. **User-Selected File Ordering:** The engine respects the `file_order` array supplied in the job options, correctly sorting input files regardless of the physical upload arrival sequence.
2. **Bookmark & Outline Preservation:** When input documents contain outlines, the engine maps each bookmark to its new offset page index in the combined document using `pikepdf.OutlineItem(item.title, dest_page)`.
3. **Safe Defense Against Malformed & Encrypted Files:**
   - Password-protected documents raise `PdfEncryptionError`, which transitions the job to `FAILED` with `error_code: "PDF_ENCRYPTED"` and a clear human-readable message.
   - Corrupted or unparseable documents raise `PdfCorruptionError`, setting `error_code: "PDF_CORRUPTED"`.
4. **Memory-Safe Stream Generation:** The combined document is written to memory using `object_stream_mode=pikepdf.ObjectStreamMode.generate` and `compress_streams=True`, resulting in compact file sizes without re-compressing raster images.

### 3.2 Frontend Experience
1. **Drag-and-Drop Staging:** Users can drop multiple PDFs or browse from their device.
2. **Visual Reordering:** Individual files can be moved up or down with real-time sequence updates (1, 2, 3...).
3. **File Management:** Files can be deleted individually, and additional PDFs can be added at any time.
4. **Interactive Processing & Download:** When merged, the user is presented with a direct download button linking to `/api/v1/downloads/{token}`, allowing single-click retrieval of the final document.

---

## 4. Visual Verification & Screenshots

The working web application was built and previewed using Next.js 15 and captured via Chrome Headless:

### 4.1 Merge PDF Interactive Studio (`/merge`)
![Merge PDF Interface](file:///E:/REA/documentation/merge_pdf_ui.png)
*Figure 1: Clean drag-and-drop upload zone, 100% client-safe sandbox indicator, and back navigation.*

### 4.2 Home Page Tool Directory
![Home Page](file:///E:/REA/documentation/home_page_ui.png)
*Figure 2: Complete tool catalog with one-click access to the Merge PDF studio.*

---

## 5. Automated Test Results

Executed using `pytest tests/ -v`:

```
============================= test session starts =============================
platform win32 -- Python 3.15.2, pytest-9.2.0, pluggy-1.7.0 -- E:\REA\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: E:\REA, configfile: pytest.ini
collected 25 items

tests/integration/test_downloads.py::test_download_streaming_full_and_range PASSED [  4%]
tests/integration/test_downloads.py::test_download_invalid_token PASSED  [  8%]
tests/integration/test_health.py::test_root_discovery PASSED             [ 12%]
tests/integration/test_health.py::test_health_liveness PASSED            [ 16%]
tests/integration/test_health.py::test_health_readiness PASSED           [ 20%]
tests/integration/test_health.py::test_health_overview PASSED            [ 24%]
tests/integration/test_jobs.py::test_create_job_merge_success PASSED     [ 28%]
tests/integration/test_jobs.py::test_create_job_single_file_rejected PASSED [ 32%]
tests/integration/test_jobs.py::test_create_job_invalid_magic_bytes PASSED [ 36%]
tests/integration/test_jobs.py::test_get_nonexistent_job PASSED          [ 40%]
tests/integration/test_merge_pdf.py::test_merge_two_valid_pdfs PASSED    [ 44%]
tests/integration/test_merge_pdf.py::test_merge_multiple_pdfs PASSED     [ 48%]
tests/integration/test_merge_pdf.py::test_merge_user_selected_ordering PASSED [ 52%]
tests/integration/test_merge_pdf.py::test_merge_corrupted_pdf_handling PASSED [ 56%]
tests/integration/test_merge_pdf.py::test_merge_encrypted_pdf_handling PASSED [ 60%]
tests/integration/test_merge_pdf.py::test_merge_empty_uploads_validation PASSED [ 64%]
tests/integration/test_merge_pdf.py::test_merge_engine_direct_insufficient_files PASSED [ 68%]
tests/unit/test_security.py::test_validate_file_signature_pdf PASSED     [ 72%]
tests/unit/test_security.py::test_validate_file_signature_images PASSED  [ 76%]
tests/unit/test_security.py::test_hash_ip_pseudonymization PASSED        [ 80%]
tests/unit/test_security.py::test_generate_secure_token PASSED           [ 84%]
tests/unit/test_security.py::test_calculate_sha256 PASSED                [ 88%]
tests/unit/test_token_service.py::test_token_service_lease_lifecycle PASSED [ 92%]
tests/unit/test_token_service.py::test_token_service_lease_expiration PASSED [ 96%]
tests/unit/test_token_service.py::test_nonexistent_token PASSED          [100%]

============================= 25 passed in 36.54s =============================
```

### Coverage Against Required Test Cases:
| Test Requirement | Verified Test | Status | Evidence |
| :--- | :--- | :---: | :--- |
| **Two valid PDFs** | `test_merge_two_valid_pdfs` | **PASSED** | Combined 2 pages + 1 page = 3 pages |
| **Multiple PDFs** | `test_merge_multiple_pdfs` | **PASSED** | Combined 4 files (7 pages total) |
| **User-selected ordering** | `test_merge_user_selected_ordering` | **PASSED** | Outlines verify exact custom sequence: doc3 -> doc1 -> doc2 |
| **Invalid file signatures** | `test_create_job_invalid_magic_bytes` | **PASSED** | Rejected with HTTP 400 |
| **Corrupted PDFs** | `test_merge_corrupted_pdf_handling` | **PASSED** | Transitions job to `FAILED` with `PDF_CORRUPTED` |
| **Encrypted PDFs** | `test_merge_encrypted_pdf_handling` | **PASSED** | Transitions job to `FAILED` with `PDF_ENCRYPTED` |
| **Empty uploads** | `test_merge_empty_uploads_validation` | **PASSED** | Rejected with HTTP 400 |
| **Single file upload** | `test_create_job_single_file_rejected` | **PASSED** | Rejected with HTTP 400 |
| **Output Integrity** | `test_create_job_merge_success` | **PASSED** | Result opened via `pikepdf.open`, verified 5 pages |

---

## 6. Acceptance Criteria Verification Checklist

| Criterion | Requirement | Verification Method | Status |
| :---: | :--- | :--- | :---: |
| **1** | User can upload at least two PDFs | `FileUploadZone` accepts multiple files; API enforces `len(files) >= 2`. | **VERIFIED** |
| **2** | User can change file order | `FileReorderList` Move Up/Down controls alter `file_order` array. | **VERIFIED** |
| **3** | Backend merges files correctly | `pikepdf` engine merges pages in specified sequence. | **VERIFIED** |
| **4** | Output stored successfully | Saved to `pdf-artifacts` bucket via `storage_service.upload_bytes`. | **VERIFIED** |
| **5** | Frontend receives completed status | Polling endpoint `/api/v1/jobs/{job_id}` returns `COMPLETED` and progress 100%. | **VERIFIED** |
| **6** | User can download & open PDF | Leased token redemption streams file; opened successfully with QPDF parser. | **VERIFIED** |
| **7** | Page count & ordering verified | Verified via `len(merged.pages)` and bookmark outline tree checks. | **VERIFIED** |

---

## 7. Known Limitations & Next Steps

1. **Client-Side Page Thumbnails:**
   - In Sprint 2, the reordering list displays file-level items (file name, size, order index). Sprint 3 will introduce Mozilla PDF.js canvas rendering to display individual page-level visual thumbnails.
2. **Next Operations in Sprint 2:**
   - Now that Merge PDF is complete and verified end-to-end, we can proceed to implement the remaining structural operations:
     1. **Split PDF** (`split.py`: range extraction and bursting).
     2. **Rotate PDF** (`rotate.py`: per-page orientation tags).
     3. **Reorder Pages** (`reorder.py`: single-document page permutation).
     4. **Remove Pages** (`remove.py`: selective page object deletion).
