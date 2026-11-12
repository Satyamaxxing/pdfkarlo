# Sprint 2 Progress Report — Split PDF Engine End-to-End

> **Document ID:** DOC-09-SPRINT-2-SPLIT-REPORT  
> **Status:** Implemented & Verified  
> **Date:** November 12, 2026  
> **Milestone:** Sprint 2 (Split PDF Complete)  
> **Repository:** `E:\REA`

---

## 1. Executive Summary

Following the successful deployment and verification of the **Merge PDF** engine, the **Split PDF** feature has been designed, implemented, and verified end-to-end across the backend processing engine, asynchronous Celery worker pipeline, REST API gateway, and Next.js 15 frontend application.

The Split PDF engine is powered by **`pikepdf` 10.18.0** and **QPDF 12.4.2**, operating under the **Apache-2.0** license, fully maintaining our architectural mandate of **Zero AGPL copyleft exposure**.

The implementation supports all three required operating modes:
1. **Mode A — Split by Page Ranges:** Splits documents into multiple parts according to user-defined page ranges (e.g. `1-3, 4-6, 7-10`). Includes strict bounds validation, syntax parsing, and range overlap detection.
2. **Mode B — Extract Specific Pages:** Extracts arbitrary individual pages (e.g. `1, 3, 5`) into a single unified output document.
3. **Mode C — Extract Every Page (Burst):** Extracts every page of the source document into individual, standalone single-page PDFs.

For operations resulting in multiple files (Mode A with multiple ranges, and Mode C), the system automatically packages all generated PDFs into a consolidated `.zip` archive while simultaneously providing distinct, individually downloadable artifacts with leased download tokens.

All 11 dedicated integration tests pass with a 100% success rate, bringing the entire platform test suite to **36 passing automated tests**.

---

## 2. Files Created or Modified

### 2.1 Backend PDF Engine & Worker Pipeline
- [`apps/worker/src/engine/split.py`](file:///E:/REA/apps/worker/src/engine/split.py): Core modular Split PDF engine implementing `SplitMode` (`range`, `extract`, `burst`), `parse_ranges_string`, `parse_pages_string`, zero-copy page tree extraction, in-memory ZIP archiving, outline offset remapping, and corruption/encryption exception handling.
- [`apps/worker/src/engine/__init__.py`](file:///E:/REA/apps/worker/src/engine/__init__.py): Exposed `split_pdf_document`, `SplitMode`, `parse_ranges_string`, and `parse_pages_string`.
- [`apps/worker/src/tasks/operations.py`](file:///E:/REA/apps/worker/src/tasks/operations.py):
  - Implemented `run_split_job(job_id_str)` synchronous Celery worker task.
  - Implemented `execute_split_job_async(job_uuid, session)` for development/in-process execution.
  - S3 staging download, artifact uploads (`pdf-artifacts`), database transaction updates, and leased download token generation for both individual split documents and the aggregated ZIP archive.
  - Registered `@shared_task(name="apps.worker.src.tasks.operations.process_split_job")`.

### 2.2 REST API Gateway & Data Contracts
- [`apps/api/src/schemas/job.py`](file:///E:/REA/apps/api/src/schemas/job.py): Added `download_token` and `download_url` fields to `JobFileMetadata` schema to facilitate multi-file artifact retrieval.
- [`apps/api/src/api/v1/jobs.py`](file:///E:/REA/apps/api/src/api/v1/jobs.py):
  - Enforced single-file validation on split operations (rejects multiple uploads with HTTP 400).
  - Wired task dispatcher for split jobs (`execute_split_job_async` or Celery `process_split_job.delay`).
  - Updated `get_job_status` to map individual download tokens and URLs for each output file in `output_files`, and prioritize ZIP tokens for primary job download.

### 2.3 Next.js 15 Frontend User Interface
- [`apps/web/src/app/split/page.tsx`](file:///E:/REA/apps/web/src/app/split/page.tsx): Complete interactive Split PDF Studio featuring:
  - Single-document drag-and-drop file upload.
  - Client-side fast page count detection via PDF dictionary scanning.
  - Mode selector tabs (`Split by Range`, `Extract Pages`, `Extract Every Page`).
  - Mode A: Custom range input with quick preset buttons ("Split in half", "Full document").
  - Mode B: Interactive visual page selector cards with checkmark states, select-all, and reset.
  - Mode C: Burst mode information and bundle explanation.
  - Live client-side syntax and range overlap validation.
  - Progress indicator polling the API gateway.
  - Success view with primary "Download All (ZIP)" button and individual artifact list.
- [`apps/web/src/components/ToolGrid.tsx`](file:///E:/REA/apps/web/src/components/ToolGrid.tsx): Connected the Split PDF tool card to `/split`.

### 2.4 Automated Test Suite
- [`tests/integration/test_split_pdf.py`](file:///E:/REA/tests/integration/test_split_pdf.py): 11 end-to-end integration tests verifying single-page PDFs, multiple ranges with ZIP generation, first/last page extraction, burst mode, overlapping range rejection, out-of-range bounds checking, password protection handling, corruption handling, single-file validation, and helper parsers.

---

## 3. Working Architecture & Process Flow

```mermaid
flowchart TD
    User([User Browser]) -->|1. Upload Single PDF| UI["Next.js 15 Split Studio (/split)"]
    UI -->|2. Fast Client Scan (/Count)| UI
    UI -->|3. Select Mode & Ranges| UI
    UI -->|4. POST /api/v1/jobs (multipart)| API["FastAPI Gateway"]
    API -->|5. Validate len(files) == 1 & Magic Bytes| API
    API -->|6. Upload Staging Bytes| S3Staging[("MinIO: pdf-raw-staging")]
    API -->|7. Insert Job (PENDING)| DB[("PostgreSQL 16")]
    API -->|8. Dispatch Task| Worker["Celery Worker / Async Engine"]
    Worker -->|9. Fetch Staged Document| S3Staging
    Worker -->|10. Execute pikepdf / QPDF 12| Engine["Split Engine (split.py)"]
    Engine -->|11. Extract Pages & Remap Outlines| Engine
    Engine -->|12. Create In-Memory ZIP (if multi-file)| Engine
    Worker -->|13. Stream Artifacts| S3Art[("MinIO: pdf-artifacts")]
    Worker -->|14. Create JobFiles & Leased Tokens| DB
    Worker -->|15. Store Leased Tokens in Redis| Redis[("Redis 7 Cache")]
    Worker -->|16. Set Job Status = COMPLETED| DB
    UI -->|17. Poll Status & Fetch File List| API
    UI -->|18. Download ZIP or Individual PDFs| API
    API -->|19. Validate Token & Stream Range| User
```

---

## 4. Technical Engine Implementation Details

### 4.1 Range Parsing & Validation (`parse_ranges_string`)
The engine implements strict parsing rules to protect against invalid or malicious range inputs:
- Accepts comma-separated numbers or hyphenated ranges (e.g. `1-3, 5, 7-9`).
- Enforces `1 <= start <= end <= total_pages`.
- Detects overlapping ranges: any page requested across multiple segments immediately triggers `SplitValidationError("Overlapping page range detected: page X is included in multiple ranges")`.
- Disallows empty or unparseable segments.

### 4.2 Zero-Copy Page Extraction & Stream Optimization
For every target range or page set:
1. A fresh `pikepdf.Pdf.new()` instance is initialized.
2. Target pages are appended using `target_pdf.pages.append(src_pdf.pages[page_idx])`.
3. Outlines and bookmarks pointing to pages within the extracted range are translated to new destination offsets:
   ```python
   target_pdf.open_outline().root.append(pikepdf.OutlineItem(item.title, dest_page))
   ```
4. Output streams are compacted using `pikepdf.ObjectStreamMode.generate` and `compress_streams=True`, yielding minimal file footprints without lossy raster re-compression.

### 4.3 Automated ZIP Packaging
When a split operation produces more than one file:
- An in-memory ZIP archive is constructed using `zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)`.
- Each split document is inserted into the archive with a clean naming scheme (`split_part_1_pages_1-2.pdf`, `split_part_2_pages_3-4.pdf`, etc.).
- Both the individual split PDFs and the ZIP file are registered as `JobFile` records in PostgreSQL and uploaded to S3 artifacts.
- The ZIP artifact is prioritized as the default download URL on the job status response.

---

## 5. Visual Verification & User Experience

The Next.js 15 frontend was compiled and previewed using Chrome Headless:

### 5.1 Split PDF Interactive Studio (`/split`)
![Split PDF Studio Interface](file:///E:/REA/documentation/split_pdf_ui.png)
*Figure 1: Clean single-file dropzone, 100% client-safe sandbox indicator, and navigation back to catalog.*

---

## 6. Automated Test Results

The dedicated Split PDF test suite was executed via `pytest`:

```text
tests/integration/test_split_pdf.py::test_split_single_page_pdf PASSED             [  9%]
tests/integration/test_split_pdf.py::test_split_multiple_ranges_and_zip PASSED     [ 18%]
tests/integration/test_split_pdf.py::test_extract_first_and_last_page PASSED       [ 27%]
tests/integration/test_split_pdf.py::test_split_burst_every_page PASSED            [ 36%]
tests/integration/test_split_pdf.py::test_split_invalid_and_overlapping_ranges PASSED [ 45%]
tests/integration/test_split_pdf.py::test_split_out_of_range_page PASSED           [ 54%]
tests/integration/test_split_pdf.py::test_split_encrypted_pdf PASSED               [ 63%]
tests/integration/test_split_pdf.py::test_split_corrupted_pdf PASSED               [ 72%]
tests/integration/test_split_pdf.py::test_split_requires_exactly_one_file PASSED   [ 81%]
tests/integration/test_split_pdf.py::test_parse_ranges_helpers PASSED              [ 90%]
tests/integration/test_split_pdf.py::test_parse_pages_helpers PASSED               [100%]
```

### 6.1 Full Platform Test Suite Pass Summary (36 Tests)
| Test Module | Coverage Area | Tests | Status |
| :--- | :--- | :---: | :---: |
| `tests/integration/test_split_pdf.py` | Split PDF (Range, Extract, Burst, ZIP, Errors) | 11 | **PASSED** |
| `tests/integration/test_merge_pdf.py` | Merge PDF (Ordering, Bookmarks, Errors) | 7 | **PASSED** |
| `tests/integration/test_jobs.py` | Job Lifecycle, Dispatches, Ingestion Validation | 4 | **PASSED** |
| `tests/integration/test_health.py` | Liveness, Readiness, Dependency Health Probes | 4 | **PASSED** |
| `tests/integration/test_downloads.py` | Token Redemption, Range Requests, Streaming | 2 | **PASSED** |
| `tests/unit/test_security.py` | Magic Bytes, SHA-256, IP Hashing, Secure Tokens | 5 | **PASSED** |
| `tests/unit/test_token_service.py` | Redis Leased Token Lifecycles, Expirations | 3 | **PASSED** |
| **Total Platform Suite** | **Full End-to-End Coverage** | **36** | **100% PASSED** |

---

## 7. Next Feature Readiness

With **Merge PDF** and **Split PDF** fully operational and verified, the next feature in the Sprint 2 backlog is **Rotate PDF**:
- Support 90°, 180°, and 270° clockwise rotation.
- Support document-wide or page-specific rotation.
- Interactive thumbnail page preview and orientation toggles in Next.js 15.
- Pure `pikepdf` zero-recompression page dictionary updates (`/Rotate`).
