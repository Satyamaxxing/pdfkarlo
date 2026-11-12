# Evidence Register: Verification Audit & Source Registry

**Document Type:** Formal Audit Register & Fact Verification Ledger  
**Project:** Independently Engineered PDF Processing Platform  
**Target Reference:** [iLovePDF (ilovepdf.com)](https://www.ilovepdf.com/)  
**Audit Date:** November 2026  
**Auditor:** Senior Product Analyst & Software Architect  
**Architecture Decision Record:** [`research/architecture-decision-record.md`](file:///e:/REA/research/architecture-decision-record.md)  

---

## 1. Verification Audit Framework

Every factual claim in the research documentation is evaluated against four criteria:
1. **Primary Ground Truth:** Directly observed through REA browser inspection of live production web pages or official API documentation.
2. **Confidence Level:** Rated as **High** (direct primary observation), **Medium** (secondary documentation or multi-source agreement), or **Low** (inferred or unverified).
3. **Verification Status:**
   * **VERIFIED:** Proven by direct official documentation, live network inspection, or observed UI state.
   * **PARTIALLY VERIFIED:** Core claim confirmed, but specific edge-case details or marketing vs. technical bounds diverge.
   * **UNVERIFIED:** Plausible industry assumption, heuristic, or estimate lacking published empirical data. Must be removed from architectural baselines.

---

## 2. Comprehensive Claim-by-Claim Audit Ledger

| ID | Exact Claim | Source URL / Instrument | Supporting Evidence | Date Accessed | Confidence | Verification Status | Architectural Disposition |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **CL-01** | Platform offers 33 distinct tools across 7 functional categories + 1 workflow engine. | `https://www.ilovepdf.com/` (REA Browser Inspection via Chrome CDP) | Live accessibility tree and DOM inspection reveals 31 dedicated homepage tool cards + 2 dedicated sub-routes (`/remove-pages`, `/extract-pages`) + `/user/workflows`. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as verified product scope baseline. |
| **CL-02** | Header top navigation bar prioritizes Merge, Split, Compress, and Convert. | `https://www.ilovepdf.com/` (REA Browser Inspection) | Live banner navigation list: `link "Merge PDF"` (`/merge_pdf`), `link "Split PDF"` (`/split_pdf`), `link "Compress PDF"` (`/compress_pdf`), `listitem: Convert PDF`. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as verified navigation priority. |
| **CL-03** | Free plan limits file processing size to 15–100 MB and batch processing to small numbers; Premium permits up to 4 GB. | `https://www.ilovepdf.com/pricing` & `/help/faq` | `/pricing` comparison table lists "Filesize per task: Limited (Basic) vs Unlimited (Premium)". Technical FAQ specifies 15–100 MB free caps and 4 GB practical ceiling for Premium. | Nov 12, 2026 | **High** | **VERIFIED** (with distinction between marketing "Unlimited" and technical 4 GB cap) | Retained with explicit marketing vs technical limit distinction. |
| **CL-04** | Premium subscription is priced at $9/month (monthly) or $5/month ($60/year) billed annually (-42% discount). Regional pricing in India is ₹242/mo (₹2,900/yr). | `https://www.ilovepdf.com/pricing` (REA Browser Inspection) | Observed live on `/pricing`: "Yearly Billing -42%", ₹242 / month (₹2,900 Billed annually), global pricing $9/mo or $5/mo. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as baseline commercial pricing structure. |
| **CL-05** | Standard files are permanently deleted within 2 hours of processing. | `https://www.ilovepdf.com/help/faq`, `/help/security` | Public FAQ states all processed files are irreversibly deleted from servers after 2 hours. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as non-negotiable security baseline for independent platform. |
| **CL-06** | Manual immediate file deletion is available on the download screen. | `https://www.ilovepdf.com/help/security` & download workflow docs | Download screen provides a manual trash icon allowing immediate server deletion before the 2-hour TTL expires. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as mandatory download hub feature. |
| **CL-07** | Signed legal documents are retained for up to 5 years. | `https://www.ilovepdf.com/help/security` | Documented legal exception to the 2-hour rule for eIDAS and electronic signature audit trails. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as legal compliance consideration for Phase 3. |
| **CL-08** | Developer REST API grants 2,500 free credits/month with per-task consumption ranging from 5 to 80 credits. | `https://www.iloveapi.com/pricing`, `/docs` | Official developer portal documents 2,500 monthly free tier credits; Task costs: Merge/Split = 5, Compress/Office = 10, OCR = 5/pg, AI = 30/pg, Sign = 80. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as exact reference for independent API economy. |
| **CL-09** | "Merge, Split, Rotate & Organize accounts for >50% of casual web utility traffic." | None (Heuristic extrapolation) | No public server telemetry or independent analytics available to prove exact 50%+ figure. | Nov 12, 2026 | **Low** | **UNVERIFIED (REMOVED)** | **Corrected:** Removed specific percentage claim. Replaced with verified observation: "Merge, Split, and Compress receive top-level visual priority in the global navbar, indicating high user demand." |
| **CL-10** | PDF format is a "Turing-complete specification". | Technical Literature / ISO 32000 | PDF is a declarative page description language (object graph), NOT inherently Turing-complete. Only embedded scripting (Acrobat JavaScript, PostScript Type 4 calculator functions) executes code. | Nov 12, 2026 | **Low** | **TECHNICALLY INACCURATE (CORRECTED)** | **Corrected:** Clarified that standard PDF is declarative, but vulnerabilities stem from embedded ECMAScript interpreters, Type 4 calculation functions, and parser CVEs. |
| **CL-11** | Using Ghostscript or LibreOffice in a web backend automatically triggers viral AGPL copyleft obligations. | GNU AGPL-3.0 Section 13, MPL-2.0 License Text | • LibreOffice is licensed under MPL-2.0 / LGPLv3+, NOT AGPL; it does NOT contain a network interaction copyleft clause.<br/>• Ghostscript is AGPL-3.0, but invoking an unmodified CLI binary via subprocess does not automatically make the SaaS backend a derivative work, though Artifex enforces aggressively. | Nov 12, 2026 | **High** | **CORRECTED & QUALIFIED** | **Corrected:** Separated LibreOffice (MPL-2.0, completely safe for backend microservices) from Ghostscript (AGPL-3.0, legal risk from aggressive vendor enforcement; prefer QPDF Apache 2.0). |
| **CL-12** | PDF decompression bombs are "zip bombs". | File Format Specification | PDF uses Deflate (`FlateDecode`), not PKZIP format. The proper terminology is "Flate decompression bomb". | Nov 12, 2026 | **High** | **CORRECTED** | **Corrected:** Replaced "zip bombs" with "Flate decompression bombs". |
| **CL-13** | QPDF is licensed under Apache 2.0. | `https://github.com/qpdf/qpdf` (official license) | QPDF shifted from Artistic 2.0 to Apache License 2.0 starting with QPDF 11. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as core engine recommendation. |
| **CL-14** | Gotenberg is licensed under MIT. | `https://github.com/gotenberg/gotenberg` | Official LICENSE file in upstream repository is MIT. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as headless microservice recommendation. |
| **CL-15** | OCRmyPDF is licensed under Mozilla Public License 2.0 (MPL-2.0). | `https://github.com/ocrmypdf/OCRmyPDF` | Official LICENSE file in upstream repository is MPL-2.0 (weak copyleft; safe to use as independent CLI/worker). | Nov 12, 2026 | **High** | **VERIFIED** | Retained as OCR pipeline candidate. |
| **CL-16** | Primary brand color is crimson red (`#E5322D`) with clean neutral white/gray staging canvas. | Live Browser Inspection (`ilovepdf.com/merge_pdf`) | Direct inspection of DOM styles and computed CSS on live buttons. | Nov 12, 2026 | **High** | **VERIFIED** | Retained as verified UI pattern. |
| **CL-17** | QPDF alone provides complete PDF compression. | Technical Engine Inspection / ISO 32000 | QPDF performs structural optimization (`/ObjStm`, `/XRef`, unreferenced object GC, Flate normalization). It does **NOT** downsample or recompress raster images, which account for 80-95% of real-world file size. | Nov 12, 2026 | **High** | **AUDITED & EXPANDED** | **Resolved in ADR-001:** Adopted dual-pass pipeline: `Pillow` for raster image downsampling + `QPDF` for structural object stream compaction. |
| **CL-18** | Option B (Unified Python FastAPI + Celery) outperforms Option A (Node.js API + Python Workers) for operational MVP maintainability. | ADR-001 Evaluation | Eliminates dual-language schema drift (Pydantic shared models); native async multipart file streaming via Starlette; single production runtime. | Nov 12, 2026 | **High** | **ARCHITECTURAL DECISION (ADR-001)** | Formalized as core architectural decision. |
| **CL-19** | Presigned S3 URLs are single-use. | S3 Protocol Specification | Presigned URLs are standard HTTP bearer tokens valid until `ExpiresIn`. Anyone with the URL can fetch multiple times. | Nov 12, 2026 | **High** | **CORRECTED IN ADR-001 REV 3** | Replaced with leased token architecture: 15-minute token + 120-second lease window activated on first download + atomic Redis Lua script. |
| **CL-20** | S3 bucket lifecycle expiration provides an exact 2-hour deletion guarantee. | Cloud Object Storage Specs (AWS / MinIO) | Lifecycle policies are batch jobs running periodically (e.g. daily on AWS). | Nov 12, 2026 | **High** | **CORRECTED IN ADR-001 REV 3** | Reconciled 3-tier cleanup architecture: worker `try...finally` + Celery Beat 10-minute active sweeper + 24-hour S3 lifecycle backstop. Max delay bounded at $T_0 + 135\text{ min}$. |
| **CL-21** | Blanket stripping of `/URI`, `/OpenAction`, and `/EmbeddedFiles` is safe. | PDF ISO 32000-1 / Invoicing Standards (ZUGFeRD) | Blanket stripping breaks valid document hyperlinks, viewing settings, and electronic invoice XML attachments. | Nov 12, 2026 | **High** | **CORRECTED IN ADR-001 REV 3** | Replaced with operation-specific sanitization matrix. |

---

## 3. Physical Evidence Artifacts Captured via REA

The following ground-truth inspection artifacts were captured directly in this session using Chrome via REA's `capture_browser_scenario` MCP tool:

| Artifact Path | Format | Verification Purpose |
| :--- | :--- | :--- |
| [`e:\REA\research\ilovepdf_home_screenshot.png`](file:///e:/REA/research/ilovepdf_home_screenshot.png) | Image (PNG, 1280x720) | Visual proof of desktop homepage layout, top navigation, tool card grid, and banner links. |
| [`e:\REA\research\ilovepdf_home_a11y.txt`](file:///e:/REA/research/ilovepdf_home_a11y.txt) | Text (Accessibility Tree) | Full structural hierarchy of the homepage, verifying all 31 homepage tool links, URLs, and labels. |
| [`e:\REA\research\ilovepdf_pricing_screenshot.png`](file:///e:/REA/research/ilovepdf_pricing_screenshot.png) | Image (PNG, 1280x720) | Visual proof of `/pricing` plan comparison table, Monthly vs. Yearly toggle (-42%), and feature tiers. |
| [`e:\REA\research\ilovepdf_pricing_a11y.txt`](file:///e:/REA/research/ilovepdf_pricing_a11y.txt) | Text (Accessibility Tree) | Exact text content of pricing tiers (Basic, Premium, Business), limits, and feature comparisons. |
| [`e:\REA\research\ilovepdf_merge_screenshot.png`](file:///e:/REA/research/ilovepdf_merge_screenshot.png) | Image (PNG, 1280x720) | Visual proof of individual tool staging layout: red action CTA, drag-drop zone, and cloud buttons. |
| [`e:\REA\research\ilovepdf_merge_a11y.txt`](file:///e:/REA/research/ilovepdf_merge_a11y.txt) | Text (Accessibility Tree) | Structural verification of upload controls (`Select PDF files`, `Choose File`, `drop PDFs here`). |
| [`e:\REA\research\ilovepdf_mobile_screenshot.png`](file:///e:/REA/research/ilovepdf_mobile_screenshot.png) | Image (PNG, 390x844) | Visual proof of mobile viewport responsive behavior: hamburger menu, vertical card stack. |
| [`e:\REA\research\ilovepdf_mobile_a11y.txt`](file:///e:/REA/research/ilovepdf_mobile_a11y.txt) | Text (Accessibility Tree) | Accessibility hierarchy under mobile responsive constraints. |

---

## 4. Remaining Unresolved Technical Decisions

1. **Client-Side WASM Feasibility:** Evaluating whether simple operations (Merge, Rotate, Split) should execute client-side via `qpdf.wasm` or `pdf-lib` to reduce server bandwidth. This is scheduled for benchmarking after the server-side MVP is deployed.
2. **MinIO vs. S3 Cloud Storage:** Development will use local MinIO; production will switch to S3/Cloudflare R2 via environment variables.
3. **High-Fidelity PDF-to-Word Layout Preservation:** Deferred to Phase 3; open-source layout models (e.g., LayoutLMv3, PaddleOCR) will be evaluated against proprietary commercial benchmarks.
