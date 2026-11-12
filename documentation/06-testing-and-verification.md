# Testing & Verification Report

> **Document ID:** DOC-06-TEST-VERIFY  
> **Status:** Approved Baseline  
> **Version:** 1.0.0  
> **Date:** November 12, 2026  
> **Repository:** `E:\REA`

---

## 1. Testing Philosophy & Test Architecture

The testing strategy prioritizes automated verification of critical security invariants, state machines, and API contracts before high-level PDF processing algorithms are written:
1. **Zero Mock Leakage in Production:** Production code contains zero mock shims.
2. **Transparent Test Environment Demarcation:**
   - **Local Headless Test Suite:** To ensure rapid developer iteration without external service dependencies, the local `pytest` suite uses an in-memory SQLite database (`aiosqlite`), an in-memory token fallback store, and mocked S3 storage methods configured in [`tests/conftest.py`](file:///E:/REA/tests/conftest.py).
   - **Full Infrastructure Testing:** Live PostgreSQL 16, Redis 7, and MinIO S3 integration tests are executed inside containerized environments via GitHub Actions CI and Docker Compose.
3. **Strict Verification Gates:** No code is approved without:
   - 100% test pass rate across unit and integration tests.
   - Clean Next.js static build compilation (`npm run build`).
   - Zero-AGPL license compliance verification across all installed packages.

---

## 2. Automated Test Suite Inventory

The automated test suite contains **72 tests** distributed across unit and integration layers in [`tests/`](file:///E:/REA/tests/):

```
tests/
├── conftest.py
├── integration/
│   ├── test_downloads.py      # 2 Tests: Full & Range streaming, Invalid token
│   ├── test_health.py         # 4 Tests: Root discovery, Liveness, Readiness, Overview
│   ├── test_jobs.py           # 4 Tests: Merge creation, Split/Rotate/Reorder/Remove single file check, Magic-byte spoof, 404
│   ├── test_merge_pdf.py      # 7 Tests: Merge 2 PDFs, Multiple, Reordering, Corrupted, Encrypted, Empty, Direct
│   ├── test_remove_pdf.py     # 13 Tests: Single page, Multiple, First/Last, Non-consecutive, Annots, Zero-page protection, Out-of-bounds, Duplicates, CSV strings, Encrypted, Corrupted, Single file check, Parsers
│   ├── test_reorder_pdf.py    # 11 Tests: Permutations, Reversal, First/Last shifts, Annots, Duplicates, Missing, Out-of-bounds, Errors
│   ├── test_rotate_pdf.py     # 12 Tests: Mixed, Preserved metadata, Wrap 360°, Subsets, Custom maps, Bounds, Encrypted, Corrupted
│   └── test_split_pdf.py      # 11 Tests: Single page, Multi-range + ZIP, Extract 1st/last, Burst, Overlap, Out-of-bounds, Encrypted, Corrupted, Single file check, Parsers
└── unit/
    ├── test_security.py       # 5 Tests: PDF signature, Images, IP hash, Token entropy, SHA-256
    └── test_token_service.py  # 3 Tests: Lease lifecycle, Lease timeout, Token 404
```

---

## 3. Actual Test Execution Log & Durations

Executed on November 12, 2026, using `pytest tests/ -v`:

```
============================= test session starts =============================
platform win32 -- Python 3.15.2, pytest-9.2.0, pluggy-1.7.0 -- E:\REA\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: E:\REA
configfile: pytest.ini
plugins: anyio-4.16.0, asyncio-1.4.1.post1
asyncio: mode=Mode.AUTO, debug=False, asyncio_default_fixture_loop_scope=session, asyncio_default_test_loop_scope=function
collecting ... collected 72 items

tests/integration/test_downloads.py::test_download_streaming_full_and_range PASSED [  1%]
tests/integration/test_downloads.py::test_download_invalid_token PASSED  [  2%]
tests/integration/test_health.py::test_root_discovery PASSED             [  4%]
tests/integration/test_health.py::test_health_liveness PASSED            [  5%]
tests/integration/test_health.py::test_health_readiness PASSED           [  6%]
tests/integration/test_health.py::test_health_overview PASSED            [  8%]
tests/integration/test_jobs.py::test_create_job_merge_success PASSED     [  9%]
tests/integration/test_jobs.py::test_create_job_single_file_rejected PASSED [ 11%]
tests/integration/test_jobs.py::test_create_job_invalid_magic_bytes PASSED [ 12%]
tests/integration/test_jobs.py::test_get_nonexistent_job PASSED          [ 13%]
tests/integration/test_merge_pdf.py::test_merge_two_valid_pdfs PASSED    [ 15%]
tests/integration/test_merge_pdf.py::test_merge_multiple_pdfs PASSED     [ 16%]
tests/integration/test_merge_pdf.py::test_merge_user_selected_ordering PASSED [ 18%]
tests/integration/test_merge_pdf.py::test_merge_corrupted_pdf_handling PASSED [ 19%]
tests/integration/test_merge_pdf.py::test_merge_encrypted_pdf_handling PASSED [ 20%]
tests/integration/test_merge_pdf.py::test_merge_empty_uploads_validation PASSED [ 22%]
tests/integration/test_merge_pdf.py::test_merge_engine_direct_insufficient_files PASSED [ 23%]
tests/integration/test_remove_pdf.py::test_remove_single_page PASSED     [ 25%]
tests/integration/test_remove_pdf.py::test_remove_multiple_pages PASSED  [ 26%]
tests/integration/test_remove_pdf.py::test_remove_first_and_last_page PASSED [ 27%]
tests/integration/test_remove_pdf.py::test_remove_non_consecutive_pages PASSED [ 29%]
tests/integration/test_remove_pdf.py::test_remove_preserves_annotations PASSED [ 30%]
tests/integration/test_remove_pdf.py::test_remove_all_pages_rejected PASSED [ 31%]
tests/integration/test_remove_pdf.py::test_remove_out_of_bounds_index_rejected PASSED [ 33%]
tests/integration/test_remove_pdf.py::test_remove_duplicate_indexes_handled PASSED [ 34%]
tests/integration/test_remove_pdf.py::test_remove_comma_separated_string PASSED [ 36%]
tests/integration/test_remove_pdf.py::test_remove_encrypted_pdf_rejected PASSED [ 37%]
tests/integration/test_remove_pdf.py::test_remove_corrupted_pdf_rejected PASSED [ 38%]
tests/integration/test_remove_pdf.py::test_remove_requires_exactly_one_file PASSED [ 40%]
tests/integration/test_remove_pdf.py::test_parse_remove_pages_unit_cases PASSED [ 41%]
tests/integration/test_reorder_pdf.py::test_reorder_normal_sequence PASSED [ 43%]
tests/integration/test_reorder_pdf.py::test_reorder_reverse_page_order PASSED [ 44%]
tests/integration/test_reorder_pdf.py::test_reorder_first_and_last_page_movement PASSED [ 45%]
tests/integration/test_reorder_pdf.py::test_reorder_preserves_annotations PASSED [ 47%]
tests/integration/test_reorder_pdf.py::test_reorder_duplicate_index_rejected PASSED [ 48%]
tests/integration/test_reorder_pdf.py::test_reorder_missing_pages_rejected PASSED [ 50%]
tests/integration/test_reorder_pdf.py::test_reorder_out_of_bounds_index_rejected PASSED [ 51%]
tests/integration/test_reorder_pdf.py::test_reorder_encrypted_pdf_rejected PASSED [ 52%]
tests/integration/test_reorder_pdf.py::test_reorder_corrupted_pdf_rejected PASSED [ 54%]
tests/integration/test_reorder_pdf.py::test_reorder_requires_exactly_one_file PASSED [ 55%]
tests/integration/test_reorder_pdf.py::test_validate_page_sequence_helper PASSED [ 56%]
tests/integration/test_rotate_pdf.py::test_rotate_all_pages_90_degrees PASSED [ 58%]
tests/integration/test_rotate_pdf.py::test_rotate_mixed_orientations_preservation PASSED [ 59%]
tests/integration/test_rotate_pdf.py::test_rotate_wrap_around_360_degrees PASSED [ 61%]
tests/integration/test_rotate_pdf.py::test_rotate_selected_pages_only PASSED [ 62%]
tests/integration/test_rotate_pdf.py::test_rotate_per_page_custom_mapping PASSED [ 63%]
tests/integration/test_rotate_pdf.py::test_rotate_out_of_bounds_page_fails PASSED [ 65%]
tests/integration/test_rotate_pdf.py::test_rotate_invalid_angle_fails PASSED [ 66%]
tests/integration/test_rotate_pdf.py::test_rotate_encrypted_pdf_fails PASSED [ 68%]
tests/integration/test_rotate_pdf.py::test_rotate_corrupted_pdf_fails PASSED [ 69%]
tests/integration/test_rotate_pdf.py::test_rotate_requires_exactly_one_file PASSED [ 70%]
tests/integration/test_rotate_pdf.py::test_validate_rotation_angle_helper PASSED [ 72%]
tests/integration/test_rotate_pdf.py::test_parse_rotate_pages_helper PASSED [ 73%]
tests/integration/test_split_pdf.py::test_split_single_page_pdf PASSED   [ 75%]
tests/integration/test_split_pdf.py::test_split_multiple_ranges_and_zip PASSED [ 76%]
tests/integration/test_extract_first_and_last_page PASSED [ 77%]
tests/integration/test_split_pdf.py::test_split_burst_every_page PASSED  [ 79%]
tests/integration/test_split_pdf.py::test_split_invalid_and_overlapping_ranges PASSED [ 80%]
tests/integration/test_split_pdf.py::test_split_out_of_range_page PASSED [ 81%]
tests/integration/test_split_pdf.py::test_split_encrypted_pdf PASSED     [ 83%]
tests/integration/test_split_pdf.py::test_split_corrupted_pdf PASSED     [ 84%]
tests/integration/test_split_pdf.py::test_split_requires_exactly_one_file PASSED [ 86%]
tests/integration/test_split_pdf.py::test_parse_ranges_helpers PASSED    [ 87%]
tests/integration/test_split_pdf.py::test_parse_pages_helpers PASSED     [ 88%]
tests/unit/test_security.py::test_validate_file_signature_pdf PASSED     [ 90%]
tests/unit/test_security.py::test_validate_file_signature_images PASSED  [ 91%]
tests/unit/test_security.py::test_hash_ip_pseudonymization PASSED        [ 93%]
tests/unit/test_security.py::test_generate_secure_token PASSED           [ 94%]
tests/unit/test_security.py::test_calculate_sha256 PASSED                [ 95%]
tests/unit/test_token_service.py::test_token_service_lease_lifecycle PASSED [ 97%]
tests/unit/test_token_service.py::test_token_service_lease_expiration PASSED [ 98%]
tests/unit/test_token_service.py::test_nonexistent_token PASSED          [100%]

======================= 72 passed in 108.94s (0:01:48) ========================
```

---

## 4. Security Verification & Test Vectors

### 4.1 Magic Byte Spoofing Defense
- **Vector 1 (Legitimate PDF):** Standard header `b"%PDF-1.7..."` -> Accepted (`application/pdf`).
- **Vector 2 (Padded PDF):** PDF header preceded by null bytes or comments within the 1024-byte lookahead window -> Accepted.
- **Vector 3 (Spoofed Executable):** File with `.pdf` extension containing Windows PE header (`b"MZ\x90..."`) -> **Rejected (HTTP 400)**.
- **Vector 4 (Corrupted Image):** File with `.jpg` extension containing GIF header (`b"GIF89a..."`) -> **Rejected (HTTP 400)**.
- **Vector 5 (Empty File):** 0-byte payload -> **Rejected (HTTP 400)**.

### 4.2 Client IP Pseudonymization
- Evaluated `hash_ip(ip, salt)` against IPv4 and IPv6 vectors.
- Verified that identical IPs produce deterministic 64-character SHA-256 hashes with the same salt.
- Verified that different IPs produce completely unique hashes with zero raw IP characters recoverable.
- Verified graceful fallback when IP is `None` (returns salted unknown hash).

### 4.3 Leased Token Lifecycle State Machine
- Tested token creation in `ACTIVE` state.
- **Attempt 1:** Triggers atomic transition to `LEASED` with `retry_count = 1` and `lease_expires_at = now + 120s`.
- **Attempt 2 & 3:** Allowed within the active 120s lease window, incrementing retry counter to 2 and 3.
- **Attempt 4:** Exceeds `max_retries = 3` -> **Rejected (`RETRIES_EXHAUSTED` / HTTP 403)**.
- **Expired Lease:** Request occurring after lease window elapses -> **Rejected (`LEASE_EXPIRED` / HTTP 410)**.

### 4.4 Byte Range Streaming (RFC 7233)
- Tested full file download returning status `200 OK` with complete byte payload and `Content-Disposition`.
- Tested partial download with `Range: bytes=0-19` returning status `206 Partial Content`, `Content-Range: bytes 0-19/N`, and exactly the requested 20-byte slice.

---

## 5. Frontend Build Verification

Executed `npm run build` in `apps/web/`:
```
   ▲ Next.js 15.5.27
   Creating an optimized production build ...
 ✓ Compiled successfully in 2.5s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/6) ...
   Generating static pages (1/6) 
   Generating static pages (2/6) 
   Generating static pages (4/6) 
 ✓ Generating static pages (6/6)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                      173 B         107 kB
├ ○ /_not-found                            993 B         104 kB
├ ○ /merge                               5.52 kB         113 kB
└ ○ /split                               7.87 kB         115 kB
+ First Load JS shared by all             103 kB
  ├ chunks/255-ce8c7c75002f810b.js       46.5 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)          1.99 kB

○ (Static) prerendered as static content
```
- **Result:** Static HTML export succeeded; zero TypeScript compilation errors across `/`, `/merge`, and `/split`.

---

## 6. License Compliance Audit Results

Executed `python scripts/audit_licenses.py`:
```
Running pip-licenses scan...
Scanned 51 installed dependencies.

[SUCCESS] License Compliance Audit PASSED.
All installed dependencies are 100% compliant with permissive SaaS deployment standards (Apache, MIT, BSD, PSF, MPL).
```

### Dependency Audit Breakdown:
- **Total Packages Scanned:** 51
- **Disallowed Copyleft Licenses (AGPL / Affero / GPL):** 0
- **Permissive Licenses:**
  - MIT: 28 packages
  - Apache-2.0: 10 packages
  - BSD-3-Clause / BSD-2-Clause: 9 packages
  - Python Software Foundation (PSF): 2 packages
  - ISC / HPND: 2 packages
