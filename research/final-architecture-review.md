# Final Architecture Review & Sprint 1 Entry Criteria

**Document Type:** Executive Architecture Review & Phase 2 Gatekeeper Report  
**Status:** Architecture Finalized & Approved in Principle  
**Date:** November 2026  
**Document ID:** FAR-001  
**Project:** Independently Engineered PDF Processing Platform  
**Target Benchmark:** [iLovePDF (ilovepdf.com)](https://www.ilovepdf.com/)  
**Primary References:** 
* [`ADR-001 Revision 3`](file:///e:/REA/research/architecture-decision-record.md)
* [`MVP Implementation Plan`](file:///e:/REA/research/mvp-implementation-plan.md)
* [`Evidence Register`](file:///e:/REA/research/evidence-register.md)

---

## 1. Approved Architecture Decisions

1. **Processing Core (10 MVP Tools):**
   * **`pikepdf` (`QPDF 11+`)** for structural operations (Merge, Split, Rotate, Reorder, Remove, Encrypt, Decrypt).
   * **`pypdfium2` (`Google PDFium`)** for high-DPI (150/300 DPI) PDF-to-JPG rasterization.
   * **`img2pdf` / `Pillow`** for lossless JPG-to-PDF encapsulation.
   * **Hybrid `Pillow` + `pikepdf` Dual-Pass Pipeline** for raster image downsampling and structural object stream compaction.
2. **Backend & Service Topology (Option B):**
   * Next.js 15 (React 19, Tailwind, Mozilla PDF.js client thumbnails) on the frontend.
   * Unified Python 3.12 stack on the backend: **FastAPI Gateway v1** + **Celery Worker Cluster** + **Redis 7** (broker, idempotency, token store) + **PostgreSQL 16** (durable job/artifact metadata) + **MinIO / S3** (ephemeral object storage).
3. **Reliable Download Authorization:**
   * Leased token flow: 15-minute base token in Redis.
   * Atomic Redis Lua script activation: First download request starts a **120-second lease window** allowing up to 3 retry attempts and HTTP `Range` chunked resumes.
   * Replay attempts after window expiration receive HTTP 410 Gone. S3 storage remains completely unexposed.
4. **Reconciled Data Retention:**
   * Exact retention start $T_0$ tied to job completion/failure.
   * 120-minute retention target backed by a Celery Beat 10-minute active sweeper ($T_0 + 135\text{m}$ maximum SLA delay) and a 24-hour S3 lifecycle failsafe.
   * Automated cleanup of aborted multipart uploads, unlinked tmpfs worker files, and retry queues on storage failure.
5. **Operation-Specific Sanitization:**
   * Contextual security rules: preserve hyperlinks (`/URI`), viewing geometry (`/OpenAction`), and electronic invoice XML attachments (`/EmbeddedFiles`) in standard document operations.
   * Strips `/Launch` (OS command execution), unprompted page actions (`/AA`), and executable script attachments (`.exe`, `.bat`, `.js`).
   * Stream expansion monitoring: aborts if Flate stream exceeds a 50:1 expansion ratio or 200 MB uncompressed ceiling.
6. **Zero-Copyleft Ingress & SBOM CI:**
   * Automated CycloneDX SBOM generation via `syft`.
   * Continuous license auditing via `pip-licenses` and `trivy` container scanning against an explicit allowlist (`MIT`, `BSD-2/3`, `Apache-2.0`, `MPL-2.0`, `HPND`).
   * Complete exclusion of AGPL components (Ghostscript, MuPDF).

---

## 2. Remaining Technical Limitations

1. **Non-Standard PDF Page Geometries:** The MVP Merge tool concatenates pages preserving their native dimensions. It does not automatically scale mixed A4 and US Letter pages into a uniform size (deferred to an optional user-selected "Normalize page dimensions" flag in Phase 2).
2. **Pre-Existing Digital Signatures:** Applying lossy compression, page rotation, or page reordering breaks the cryptographic `/ByteRange` hash of existing digital signatures. The engine detects signed documents and refuses destructive alteration, requiring users to explicitly acknowledge signature removal.
3. **Complex Spot Colors in Compression:** To prevent color shifts in corporate branding or architectural CAD drawings, `/Separation` and `/DeviceN` spot color spaces are bypassed from lossy recompression and optimized only structurally.

---

## 3. Known Trade-Offs

| Decision | Trade-Off Accepted | Mitigating Architectural Control |
| :--- | :--- | :--- |
| **Option B (Unified Python) over Option A (Node.js)** | Lower raw I/O throughput under microbenchmarks compared to Node.js event loops. | FastAPI uses Starlette/Uvicorn (ASGI) with `aioboto3` for non-blocking multipart streaming. Celery multi-process prefork pool completely bypasses the Python GIL. |
| **Custom Compression over Ghostscript** | Requires maintaining a custom Python downsampling script rather than invoking a one-line Ghostscript CLI flag. | Completely eliminates AGPL-3.0 commercial copyleft liability and Artifex dual-licensing risks. Sprint 2 PoC spike validates edge cases early. |
| **Leased Token over Pure Single-Use `GETDEL`** | Token is valid for 120 seconds rather than dying on the exact first byte. | Essential for client recoverability during transient network drops and required to support browser multi-connection chunked downloads (`Range: bytes=...`). |
| **Container Sandboxing (gVisor)** | Adds minor container startup overhead (~50–100ms) compared to native process execution. | Critical defense-in-depth isolation against zero-day C/C++ memory corruption exploits in untrusted PDF parsers. |

---

## 4. Unresolved Risks & Risk Retirement Strategy

| Risk ID | Description | Severity | Probability | Retirement Strategy & Phase |
| :--- | :--- | :---: | :---: | :--- |
| **R-01** | Extreme Memory Usage on 1,000+ Page PDFs | Medium | Medium | Mitigated in Sprint 2: QPDF uses file-backed stream descriptors rather than reading full document trees into RAM. Preliminary estimate of 60 MB RAM for 50 pages; validated in Sprint 8 load testing. |
| **R-02** | Subtle Color Degradation in Prepress CMYK Images | Low | Medium | Mitigated in Sprint 2 PoC spike: inspect `/ColorSpace` and use `Pillow.ImageCms` with embedded ICC profiles rather than converting to RGB. |
| **R-03** | Orphaned S3 Objects on Worker Hard Crash | Low | Low | Mitigated in Sprint 7: Celery Beat active sweeper reconciles database records with S3 bucket keys every 10 minutes; S3 24-hour lifecycle rule acts as a backstop. |

---

## 5. Exact Sprint 1 Entry Criteria

Phase 2 implementation (Sprint 1) will commence only when the following criteria are formally satisfied:

* [x] **ADR-001 Revision 3 Approved:** All 10 engine selections, compression pipelines, and security mechanisms signed off.
* [x] **Implementation Plan Synchronized:** OpenAPI contracts, database schemas, and state machines established in `mvp-implementation-plan.md`.
* [x] **Audit Register Finalized:** All factual claims and research findings verified with confidence ratings in `evidence-register.md`.
* [x] **Dev Environment Prerequisites Verified:**
  * Local Docker daemon supporting Compose v2.
  * Node.js v20+ / pnpm for frontend workspace.
  * Python 3.12 with `uv` package manager.
  * MinIO, Redis, and PostgreSQL 16 container definitions ready in `infra/docker/docker-compose.yml`.
* [ ] **Formal User Approval Received:** Explicit authorization from project leadership to write code and initiate Sprint 1 scaffolding.

---

*This document marks the conclusion of Phase 1 Research & Architecture Validation.*  
*Ready for Sprint 1 initiation upon your command.*
