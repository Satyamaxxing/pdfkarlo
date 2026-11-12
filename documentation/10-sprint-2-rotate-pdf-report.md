# Sprint 2 Feature Report — Rotate PDF Engine End-to-End

> **Document ID:** DOC-10-SPRINT-2-ROTATE-REPORT  
> **Status:** Implemented & Verified  
> **Date:** November 12, 2026  
> **Milestone:** Sprint 2 (Rotate PDF Complete)  
> **Repository:** `E:\REA`

---

## 1. Executive Summary

The **Rotate PDF** feature has been designed, implemented, and verified end-to-end across the backend processing engine, asynchronous Celery worker pipeline, REST API gateway, and Next.js 15 user interface.

The engine is powered by **`pikepdf` 10.18.0** and **QPDF 12.4.2**, operating under the **Apache-2.0** license, fully preserving our architectural guarantee of **Zero AGPL copyleft exposure**.

### Key Capabilities:
1. **Rotate All Pages:** Globally rotates all document pages by 90°, 180°, or 270° clockwise or counter-clockwise.
2. **Rotate Selected Pages:** Rotates an arbitrary subset of pages (e.g. `[1, 3]`).
3. **Per-Page Custom Rotation Mapping:** Supports individual target angles per page (e.g. `{"1": 90, "2": 180, "3": 270}`).
4. **Preservation of Inherent Metadata:** Inherent `/Rotate` page dictionary metadata is accurately read, accumulated, and preserved modulo 360:
   $$\text{new\_angle} = (\text{existing\_angle} + \Delta\text{angle}) \pmod{360}$$
5. **Zero Raster Transcoding:** Updates page dictionary orientation tags directly with zero image re-compression or quality degradation.
6. **Download Delivery:** Output files are uploaded to S3 artifacts with leased, rate-limited download tokens.

All 12 dedicated automated tests pass with a 100% success rate, bringing the entire platform test suite to **48 passing automated tests**.

---

## 2. Python Runtime Architecture Resolution

The runtime architecture discrepancy between earlier planning documents (specifying `python:3.12-slim`) and the active developer environment has been formally resolved:

| Dimension | Specification | Status |
| :--- | :--- | :--- |
| **Minimum Supported Version** | **Python 3.12.0** | Enterprise backward-compatibility floor. |
| **Active Local Runtime** | **Python 3.15.2** | Verified active runtime for host development, tests, and CI. |
| **Container Base Images** | `python:3.12-slim-bookworm` / `python:3.15-slim` | Multi-stage Dockerfiles support either base image transparently. |
| **Language Subset Standard** | Shared 3.12–3.15 subset | Zero bleeding-edge or version-exclusive syntax allowed in codebase. |

---

## 3. Files Created or Modified

### 3.1 Backend Processing Engine
- [`apps/worker/src/engine/rotate.py`](file:///E:/REA/apps/worker/src/engine/rotate.py): Modular Rotate PDF engine implementing `rotate_pdf_document`, `validate_rotation_angle`, `parse_rotate_pages`, `/Rotate` modulo 360 accumulation, and QPDF object stream compaction.
- [`apps/worker/src/engine/__init__.py`](file:///E:/REA/apps/worker/src/engine/__init__.py): Exposed `rotate_pdf_document`, `RotateValidationError`, `validate_rotation_angle`, and `parse_rotate_pages`.
- [`apps/worker/src/tasks/operations.py`](file:///E:/REA/apps/worker/src/tasks/operations.py):
  - `run_rotate_job(job_id_str)`: Synchronous worker task.
  - `execute_rotate_job_async(job_uuid, session)`: Async FastAPI development execution.
  - `@shared_task(name="apps.worker.src.tasks.operations.process_rotate_job")`: Celery task registration.

### 3.2 REST API Gateway
- [`apps/api/src/api/v1/jobs.py`](file:///E:/REA/apps/api/src/api/v1/jobs.py):
  - Upfront single-file validation on rotate jobs (rejects multiple uploads with HTTP 400).
  - Wired task dispatcher for `JobOperation.ROTATE`.

### 3.3 Next.js 15 Frontend User Interface
- [`apps/web/src/app/rotate/page.tsx`](file:///E:/REA/apps/web/src/app/rotate/page.tsx): Interactive Rotate Studio featuring:
  - Drag-and-drop file upload zone.
  - Client-side fast page count detection via PDF dictionary scan.
  - Visual page grid where each thumbnail reflects its rotation angle live via CSS `transform: rotate(${deg}deg)`.
  - Individual page rotate buttons, global rotation toolbar, and batch selection controls.
  - Leased-token download link upon completion.
- [`apps/web/src/components/ToolGrid.tsx`](file:///E:/REA/apps/web/src/components/ToolGrid.tsx): Linked Rotate PDF card to `/rotate`.

### 3.4 Automated Test Suite
- [`tests/integration/test_rotate_pdf.py`](file:///E:/REA/tests/integration/test_rotate_pdf.py): 12 dedicated tests covering all rotation scenarios, bounds checking, encryption, corruption, and helper functions.

---

## 4. Visual Verification

The Next.js 15 application was built and previewed via Chrome Headless:

### Rotate PDF Interactive Studio (`/rotate`)
![Rotate PDF Studio Interface](file:///E:/REA/documentation/rotate_pdf_ui.png)
*Figure 1: Visual interactive page grid with live CSS rotation preview, angle badges, and global toolbar.*

---

## 5. Automated Test Results

Executed `pytest tests/integration/test_rotate_pdf.py -v`:

```text
tests/integration/test_rotate_pdf.py::test_rotate_all_pages_90_degrees PASSED           [  8%]
tests/integration/test_rotate_pdf.py::test_rotate_mixed_orientations_preservation PASSED [ 16%]
tests/integration/test_rotate_pdf.py::test_rotate_wrap_around_360_degrees PASSED       [ 25%]
tests/integration/test_rotate_pdf.py::test_rotate_selected_pages_only PASSED          [ 33%]
tests/integration/test_rotate_pdf.py::test_rotate_per_page_custom_mapping PASSED      [ 41%]
tests/integration/test_rotate_pdf.py::test_rotate_out_of_bounds_page_fails PASSED     [ 50%]
tests/integration/test_rotate_pdf.py::test_rotate_invalid_angle_fails PASSED           [ 58%]
tests/integration/test_rotate_pdf.py::test_rotate_encrypted_pdf_fails PASSED          [ 66%]
tests/integration/test_rotate_pdf.py::test_rotate_corrupted_pdf_fails PASSED          [ 75%]
tests/integration/test_rotate_pdf.py::test_rotate_requires_exactly_one_file PASSED     [ 83%]
tests/integration/test_rotate_pdf.py::test_validate_rotation_angle_helper PASSED       [ 91%]
tests/integration/test_rotate_pdf.py::test_parse_rotate_pages_helper PASSED            [100%]
```

### Full Platform Regression Suite Pass Summary (48 Tests)
| Test Module | Coverage Area | Tests | Status |
| :--- | :--- | :---: | :---: |
| `tests/integration/test_rotate_pdf.py` | Rotate PDF (Mixed, Preserved, Selected, Corrupted, Encrypted) | 12 | **PASSED** |
| `tests/integration/test_split_pdf.py` | Split PDF (Range, Extract, Burst, ZIP, Errors) | 11 | **PASSED** |
| `tests/integration/test_merge_pdf.py` | Merge PDF (Ordering, Bookmarks, Errors) | 7 | **PASSED** |
| `tests/integration/test_jobs.py` | Job Lifecycle, Dispatches, Ingestion Validation | 4 | **PASSED** |
| `tests/integration/test_health.py` | Liveness, Readiness, Dependency Probes | 4 | **PASSED** |
| `tests/integration/test_downloads.py` | Token Leases, Range Streaming, Error Handling | 2 | **PASSED** |
| `tests/unit/test_security.py` | Magic Bytes, SHA-256, IP Hashing, Secure Tokens | 5 | **PASSED** |
| `tests/unit/test_token_service.py` | Redis Leased Token Lifecycles & Timeouts | 3 | **PASSED** |
| **Total Platform Suite** | **Full End-to-End Coverage** | **48** | **100% PASSED** |

---

## 6. Next Feature Readiness

With **Merge PDF**, **Split PDF**, and **Rotate PDF** fully operational and verified, the next feature in the Sprint 2 backlog is **Reorder Pages**:
- Visual drag-and-drop page sequence rearrangement.
- Page permutation with pikepdf structural page tree updates.
- Fast zero-recompression saving.
