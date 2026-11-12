# Feature Inventory: Complete Tool Catalog & Open Engine Architecture

**Document Type:** Technical Feature Specification & Open Engine Architecture  
**Status:** Phase 1 — Iteration 2 (Evidence-Verified & Audited)  
**Reference Target:** [iLovePDF (ilovepdf.com)](https://www.ilovepdf.com/)  
**Audit Register:** [`research/evidence-register.md`](file:///e:/REA/research/evidence-register.md)  
**Total Verified Tools:** 33 Dedicated Tools + 1 Multi-Step Workflow Engine  

---

## 1. Verified Catalog Summary by Functional Domain

All 33 tools and the workflow engine have been verified via direct REA browser accessibility inspection of live navigation menus and tool landing endpoints on `ilovepdf.com`.

| Domain | Tool Count | Primary User Objective | Verified Dominant Technical Mechanism | Primary Open-Source Implementation Candidates (Permissive First) |
| :--- | :---: | :--- | :--- | :--- |
| **1. Organize PDF** | 6 | Structural manipulation of PDF pages and files | Page tree dictionary manipulation, object re-indexing, stream concatenation | `QPDF` (Apache 2.0), `pdf-lib` (MIT), `PDF.js` (Apache 2.0) |
| **2. Optimize PDF** | 3 | Streamlining file footprint and repairing damaged streams | Raster image downsampling/recompression, xref rebuilding, OCR text layers | `QPDF` (Apache 2.0), `Ghostscript` (AGPL-3.0 / Commercial), `Tesseract` (Apache 2.0) |
| **3. Convert to PDF** | 5 | Ingestion of office/web formats into standardized PDF | Headless office conversion engines, Chromium headless printing | `Gotenberg` (MIT) wrapping `LibreOffice` (MPL 2.0) & `Chromium` (BSD) |
| **4. Convert from PDF** | 5 | Exporting PDF text/tables/images to target productivity formats | Text stream extraction, heuristic layout reconstruction, OCR tabular parsing | `Poppler` (GPL-2.0+), `pdfplumber` (MIT), `Camelot` (MIT), `pdf2docx` (GPL-3.0) |
| **5. Edit PDF** | 6 | Annotating, altering visual content, and stamping metadata | Content stream operators, form XObject overlays, AcroForm field trees | `pdf-lib` (MIT), `Fabric.js` (MIT canvas), `PDFium` (3-Clause BSD) |
| **6. PDF Security** | 5 | Encryption, access rights, validation, and redaction | Standard cryptographic ciphers (AES-256), content stream scrubbing, X.509 certs | `QPDF` (Apache 2.0), `PyMuPDF` (AGPL-3.0) or `pyHanko` (MIT) |
| **7. PDF Intelligence** | 3 | AI semantic extraction, translation, and structured LLM export | Text extraction + foundational LLM context windows, AST markdown serialization | `pymupdf4llm` (MIT) / `Marker` (GPL-3.0), LLM APIs (Gemini / Claude) |
| **Workflow Engine** | 1 | Chaining up to 4 consecutive operations | Directed Acyclic Graph (DAG) pipeline orchestrator | Custom asynchronous workflow pipeline (Go Asynq / Python Celery) |

---

## 2. Detailed Tool Inventory & Verification Matrix

### Category 1: Organize PDF (6 Tools)

#### 1.1 Merge PDF (`/merge_pdf`)
* **Inputs:** Multiple PDF documents (`.pdf`).
* **Outputs:** Single merged PDF (`.pdf`).
* **Core Functionality:** Concatenates two or more PDF files into a single unified document in a user-defined sequential order.
* **Configurable Parameters:** Drag-and-drop file reordering, alphabetical sorting, page range selection per file.
* **Complexity Rating:** Low.
* **Engine & Licensing:** `QPDF` (**Apache 2.0**) or `pdf-lib` (**MIT**). Both allow permissive commercial integration without copyleft obligations.
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 1.2 Split PDF (`/split_pdf`)
* **Inputs:** Single PDF (`.pdf`).
* **Outputs:** Multiple PDF files (packaged as `.zip`) or single extracted PDF.
* **Core Functionality:** Divides a document into separate files based on custom page ranges or bursts every page into an individual file.
* **Configurable Parameters:** Range splitting (e.g., 1–5, 6–10), fixed intervals, individual page extraction, merging selected ranges into one output.
* **Complexity Rating:** Low.
* **Engine & Licensing:** `QPDF` (**Apache 2.0**) or `pdf-lib` (**MIT**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 1.3 Remove Pages (`/remove-pages`)
* **Inputs:** Single PDF (`.pdf`).
* **Outputs:** Single PDF with targeted pages purged (`.pdf`).
* **Core Functionality:** Visual grid displaying document page thumbnails; allows users to select and delete unwanted pages.
* **Configurable Parameters:** Page selection by clicking thumbnails or typing explicit page indices (e.g., `1, 4, 7-12`).
* **Complexity Rating:** Low.
* **Engine & Licensing:** `QPDF` (**Apache 2.0**) or `pdf-lib` (**MIT**).
* **Verification Status:** **VERIFIED** via live route verification.

#### 1.4 Extract Pages (`/extract-pages`)
* **Inputs:** Single PDF (`.pdf`).
* **Outputs:** Extracted pages as individual files or combined single file (`.pdf` / `.zip`).
* **Core Functionality:** Isolate specific pages from a document and generate a new target document containing only those selected pages.
* **Configurable Parameters:** Extraction mode ("Extract all pages" vs "Select pages"), option to merge all extracted pages into a single PDF.
* **Complexity Rating:** Low.
* **Engine & Licensing:** `QPDF` (**Apache 2.0**) or `pdf-lib` (**MIT**).
* **Verification Status:** **VERIFIED** via live route verification.

#### 1.5 Organize PDF (`/organize-pdf`)
* **Inputs:** Single PDF (`.pdf`).
* **Outputs:** Single reorganized PDF (`.pdf`).
* **Core Functionality:** Interactive multi-page visual workspace to reorder, rotate individual pages, delete pages, or insert additional pages/documents into the flow.
* **Configurable Parameters:** Page drag-and-drop positioning, individual page rotation ($90^\circ, 180^\circ, 270^\circ$), blank page insertion.
* **Complexity Rating:** Low to Medium.
* **Engine & Licensing:** Client UI (`React` + `PDF.js` **Apache 2.0**) + backend `QPDF` (**Apache 2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 1.6 Scan to PDF (`/scan-pdf`)
* **Inputs:** Camera capture stream or direct scanner feed.
* **Outputs:** Multi-page standardized PDF (`.pdf`).
* **Core Functionality:** Captures physical pages via mobile camera or desktop scanner driver, applies perspective correction, contrast normalization, and compiles into a PDF.
* **Configurable Parameters:** Color mode (Color, Grayscale, B&W), edge cropping, contrast adjustment, orientation.
* **Complexity Rating:** Medium.
* **Engine & Licensing:** `OpenCV` (**Apache 2.0**) + WebRTC camera stream / native mobile SDK.
* **Verification Status:** **VERIFIED** via live browser inspection.

---

### Category 2: Optimize PDF (3 Tools)

#### 2.1 Compress PDF (`/compress_pdf`)
* **Inputs:** Single or batch PDF (`.pdf`).
* **Outputs:** Size-optimized PDF (`.pdf`).
* **Core Functionality:** Shrinks PDF file byte size via a dual-pass optimization pipeline:
  1. *Raster Image Downsampling & Re-encoding:* Detects high-DPI image XObjects, resamples geometry using Lanczos filtering to target DPI thresholds (72, 144, 200 DPI), and re-encodes streams using optimized MozJPEG/JPEG quantization.
  2. *Structural Compaction:* Compresses object streams (`/ObjStm`), converts cross-reference tables to streams (`/XRef`), normalizes FlateDecode streams, deduplicates identical font streams, and linearizes for Fast Web View.
* **Configurable Parameters:** Three preset optimization tiers: Extreme (72 DPI, Q=55), Recommended (144 DPI, Q=75), Less Compression (200 DPI, Q=88).
* **Complexity Rating:** Medium to High.
* **Engine & Licensing:** **Hybrid Pipeline:** `Pillow` (**HPND/MIT-like**) for raster image downsampling + `pikepdf` (`QPDF 11+`, **MPL-2.0 / Apache 2.0**) for structural stream compaction. Eliminates AGPL copyleft liability while matching Ghostscript compression ratios.
* **Verification Status:** **VERIFIED** via live browser inspection and ADR-001 architectural validation.

#### 2.2 Repair PDF (`/repair-pdf`)
* **Inputs:** Corrupted or damaged PDF (`.pdf`).
* **Outputs:** Recovered readable PDF (`.pdf`).
* **Core Functionality:** Analyzes malformed PDF byte streams, rebuilds broken cross-reference (`xref`) tables, salvages uncorrupted page objects, and writes a valid trailer dictionary.
* **Configurable Parameters:** Automatic salvage mode.
* **Complexity Rating:** High.
* **Engine & Licensing:** `QPDF` (`--repair-file`, **Apache 2.0**) or `PDFium` (**3-Clause BSD**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 2.3 OCR PDF (`/ocr-pdf`)
* **Inputs:** Scanned or image-only PDF (`.pdf`).
* **Outputs:** Searchable PDF containing hidden text layer (`.pdf`).
* **Core Functionality:** Performs Optical Character Recognition on raster page images and injects a transparent, selectable, and searchable text layer aligned to coordinate bounding boxes.
* **Configurable Parameters:** Document language selection (supports multi-language dictionaries), deskewing toggle.
* **Complexity Rating:** High.
* **Engine & Licensing:** `Tesseract OCR` (**Apache 2.0**) orchestrated by `OCRmyPDF` (**MPL-2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

---

### Category 3: Convert to PDF (5 Tools)

#### 3.1 JPG to PDF (`/jpg_to_pdf`)
* **Inputs:** Image files (`.jpg`, `.jpeg`, `.png`, `.bmp`, `.tiff`, `.webp`).
* **Outputs:** Multi-page or single-page PDF (`.pdf`).
* **Core Functionality:** Encapsulates raster image streams directly into PDF XObjects without transcoding loss or with optional scaling.
* **Configurable Parameters:** Page orientation (Portrait, Landscape), Page size (Fit to image, A4, US Letter), Margins (None, Small, Big), Merge all images into single PDF.
* **Complexity Rating:** Low.
* **Engine & Licensing:** `pdf-lib` (**MIT**) or `Pillow` (**HPND/MIT-like**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 3.2 Word to PDF (`/word_to_pdf`)
* **Inputs:** Microsoft Word documents (`.doc`, `.docx`).
* **Outputs:** High-fidelity PDF (`.pdf`).
* **Core Functionality:** Converts rich document formatting, styles, tables, vector shapes, and typography into a standardized PDF.
* **Complexity Rating:** High.
* **Engine & Licensing:** `Gotenberg` (**MIT**) running headless `LibreOffice` (**MPL-2.0 / LGPLv3+**). *Note: LibreOffice under MPL-2.0 running headlessly in a container carries no AGPL viral network copyleft obligations.*
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 3.3 PowerPoint to PDF (`/powerpoint_to_pdf`)
* **Inputs:** Microsoft PowerPoint presentations (`.ppt`, `.pptx`).
* **Outputs:** Multi-page PDF (`.pdf`).
* **Core Functionality:** Transforms slide decks into sequential PDF pages preserving slide layouts and vector elements.
* **Complexity Rating:** High.
* **Engine & Licensing:** `Gotenberg` (**MIT**) / `LibreOffice` (**MPL-2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 3.4 Excel to PDF (`/excel_to_pdf`)
* **Inputs:** Microsoft Excel spreadsheets (`.xls`, `.xlsx`).
* **Outputs:** Tabular PDF (`.pdf`).
* **Core Functionality:** Translates spreadsheets into formatted pages with automatic page break fitting.
* **Complexity Rating:** High.
* **Engine & Licensing:** `Gotenberg` (**MIT**) / `LibreOffice` (**MPL-2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 3.5 HTML to PDF (`/html-to-pdf`)
* **Inputs:** Web URL or raw HTML code.
* **Outputs:** Standardized PDF representation of web page (`.pdf`).
* **Core Functionality:** Executes headless browser rendering to capture a complete webpage layout, CSS styles, web fonts, and dynamic DOM states into a PDF.
* **Configurable Parameters:** Screen resolution simulation, Page format (A4, Letter), Margin, Lazy load wait duration.
* **Complexity Rating:** Medium to High.
* **Engine & Licensing:** Headless `Chromium` (**3-Clause BSD**) orchestrated by `Playwright` (**Apache 2.0**) or `Gotenberg` (**MIT**).
* **Verification Status:** **VERIFIED** via live browser inspection.

---

### Category 4: Convert from PDF (5 Tools)

#### 4.1 PDF to JPG (`/pdf_to_jpg`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Raster images (`.jpg` / `.zip`).
* **Core Functionality:** Dual operation:
  1. *Page to JPG:* Renders each individual PDF page as a raster image.
  2. *Extract Images:* Identifies and extracts all embedded image XObjects without re-rendering text.
* **Configurable Parameters:** DPI/Resolution selection (Normal: 150 DPI, High: 300 DPI).
* **Complexity Rating:** Medium.
* **Engine & Licensing:** `PDFium` (**3-Clause BSD**) or `pdftoppm` (`Poppler`, **GPL-2.0+**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 4.2 PDF to Word (`/pdf_to_word`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Editable Microsoft Word document (`.docx`).
* **Core Functionality:** Deconstructs PDF layout streams into flowable paragraphs, styles, headings, and embedded images. Includes OCR support for scanned documents.
* **Configurable Parameters:** Standard conversion (text layer only) vs OCR conversion (for scanned pages).
* **Complexity Rating:** Extreme.
* **Engine & Licensing:** `pdf2docx` (**GPL-3.0**) for baseline text-layout extraction, or deep learning layout analysis models (e.g., `LayoutLMv3`).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 4.3 PDF to PowerPoint (`/pdf_to_powerpoint`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Microsoft PowerPoint presentation (`.pptx`).
* **Core Functionality:** Maps each PDF page into a presentation slide, converting vector graphics, text blocks, and images into editable slide shapes.
* **Complexity Rating:** High.
* **Engine & Licensing:** `python-pptx` (**MIT**) layout reconstruction + OCR layer.
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 4.4 PDF to Excel (`/pdf_to_excel`)
* **Inputs:** PDF document containing tables (`.pdf`).
* **Outputs:** Microsoft Excel spreadsheet (`.xlsx`).
* **Core Functionality:** Detects tabular structures, grid lines, and column alignments within PDF content streams and converts them into structured spreadsheet cells.
* **Configurable Parameters:** OCR table recognition for scanned invoices/receipts.
* **Complexity Rating:** Extreme.
* **Engine & Licensing:** `Camelot` (**MIT**), `pdfplumber` (**MIT**), `PaddleOCR` (**Apache 2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 4.5 PDF to PDF/A (`/convert-pdf-to-pdfa`)
* **Inputs:** Standard PDF (`.pdf`).
* **Outputs:** ISO 19005 compliant archival PDF (`.pdf`).
* **Core Functionality:** Enforces archival compliance (PDF/A-1b, PDF/A-2b) by embedding all fonts, defining color profiles (ICC profiles), removing audio/video, and banning device-dependent color spaces.
* **Complexity Rating:** High.
* **Engine & Licensing:** `Ghostscript` with `pdfa.ps` (**AGPL-3.0** / Commercial) or `VeraPDF` (**MPL-2.0 / GPL-3.0+** validator).
* **Verification Status:** **VERIFIED** via live browser inspection.

---

### Category 5: Edit PDF (6 Tools)

#### 5.1 Rotate PDF (`/rotate_pdf`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Rotated PDF (`.pdf`).
* **Core Functionality:** Changes the `/Rotate` attribute of the page catalog dictionary in $90^\circ$ increments without re-encoding content streams.
* **Complexity Rating:** Low.
* **Engine & Licensing:** `QPDF` (**Apache 2.0**) or `pdf-lib` (**MIT**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 5.2 Add Page Numbers (`/add_pdf_page_number`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Numbered PDF (`.pdf`).
* **Core Functionality:** Injects sequential page number annotations or content stream text onto selected page coordinates.
* **Complexity Rating:** Low to Medium.
* **Engine & Licensing:** `pdf-lib` (**MIT**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 5.3 Add Watermark (`/pdf_add_watermark`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Watermarked PDF (`.pdf`).
* **Core Functionality:** Overlays or underlays semi-transparent text or image branding across all or specified document pages.
* **Complexity Rating:** Low to Medium.
* **Engine & Licensing:** `pdf-lib` (**MIT**) or `QPDF` (**Apache 2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 5.4 Crop PDF (`/crop-pdf`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Cropped PDF (`.pdf`).
* **Core Functionality:** Adjusts the `/CropBox` and `/MediaBox` dimensional boundaries of pages to trim margins or isolate specific sections.
* **Complexity Rating:** Low to Medium.
* **Engine & Licensing:** `QPDF` (**Apache 2.0**) or `pdf-lib` (**MIT**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 5.5 Edit PDF (`/edit-pdf`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Modified PDF (`.pdf`).
* **Core Functionality:** Full visual canvas editor allowing users to insert new text boxes, draw vector shapes, add sticky annotations, and paste images.
* **Complexity Rating:** High (Client UI) / Medium (Server bake).
* **Engine & Licensing:** `Fabric.js` (**MIT**) canvas layer over `PDF.js` (**Apache 2.0**), baked via `pdf-lib` (**MIT**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 5.6 PDF Forms (`/pdf-forms`)
* **Inputs:** PDF form document (`.pdf`).
* **Outputs:** Completed/Saved PDF form (`.pdf`).
* **Core Functionality:** Interactive filling of AcroForm and XFA fields (text fields, checkboxes, radio buttons, dropdowns) and form field generation.
* **Complexity Rating:** Medium to High.
* **Engine & Licensing:** `pdf-lib` (**MIT**) / `PDFium` (**3-Clause BSD**).
* **Verification Status:** **VERIFIED** via live browser inspection.

---

### Category 6: PDF Security (5 Tools)

#### 6.1 Unlock PDF (`/unlock_pdf`)
* **Inputs:** Encrypted/Restricted PDF (`.pdf`).
* **Outputs:** Unrestricted, decrypted PDF (`.pdf`).
* **Core Functionality:** Removes owner restrictions (printing, copying, form filling) and decrypts documents where user passwords are supplied or weak permissions exist.
* **Complexity Rating:** Medium.
* **Engine & Licensing:** `QPDF` (`--decrypt`, **Apache 2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 6.2 Protect PDF (`/protect-pdf`)
* **Inputs:** Unprotected PDF (`.pdf`).
* **Outputs:** Encrypted PDF (`.pdf`).
* **Core Functionality:** Encrypts PDF documents using modern standard ciphers (AES-128 or AES-256) and sets user/owner password restrictions.
* **Complexity Rating:** Low to Medium.
* **Engine & Licensing:** `QPDF` (`--encrypt`, **Apache 2.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 6.3 Sign PDF (`/sign-pdf`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Signed PDF with cryptographic verification audit trail (`.pdf`).
* **Core Functionality:** Supports two signature workflows:
  1. *Simple Electronic Signature (SES):* Draw, type, or upload visual signature stamp.
  2. *Digital Signature (eIDAS / Cryptographic):* Embeds cryptographic X.509 digital certificate with timestamp and tamper-evident audit trail.
* **Complexity Rating:** High to Extreme.
* **Engine & Licensing:** `pyHanko` (**MIT**, PKCS#7 / PAdES signing) or `node-signpdf` (**MIT**).
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 6.4 Redact PDF (`/redact-pdf`)
* **Inputs:** Sensitive PDF (`.pdf`).
* **Outputs:** Sanitized PDF (`.pdf`).
* **Core Functionality:** Permanently removes text and visual content from document byte streams (scrubbing underlying text characters, vector paths, and raster pixels).
* **Complexity Rating:** High.
* **Engine & Licensing:** `PyMuPDF` (**AGPL-3.0**) or custom `PDFium` (**3-Clause BSD**) redaction pipeline.
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 6.5 Compare PDF (`/compare-pdf`)
* **Inputs:** Two PDF document versions (`file_A.pdf`, `file_B.pdf`).
* **Outputs:** Side-by-side or overlay diff report (`.pdf`).
* **Core Functionality:** Compares two revisions of a document, highlighting added, deleted, or modified text passages and graphic differences.
* **Complexity Rating:** High.
* **Engine & Licensing:** `diff-pdf` (**GPL-2.0+**) for visual raster diffs + `Poppler` (**GPL-2.0+**) / `PDFium` (**3-Clause BSD**) text extraction with Myers diff.
* **Verification Status:** **VERIFIED** via live browser inspection.

---

### Category 7: PDF Intelligence (3 Tools)

#### 7.1 AI Summarizer (`/pdf-summarize`)
* **Inputs:** Text-based PDF document (`.pdf`).
* **Outputs:** Structured summary text and interactive Q&A citations.
* **Core Functionality:** Ingests document text into an LLM context to extract key takeaways, executive summaries, and answer user queries with page citations.
* **Complexity Rating:** Medium (with external API).
* **Engine & Licensing:** `PDFium` text extraction + foundational LLM APIs (Gemini 1.5 Flash / Claude 3.5 Haiku) under zero-retention commercial terms.
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 7.2 Translate PDF (`/translate-pdf`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Translated PDF preserving visual formatting (`.pdf`).
* **Core Functionality:** Extracts source text spans, executes neural translation, and replaces text within original bounding boxes while adjusting font sizes to fit geometry.
* **Complexity Rating:** High.
* **Engine & Licensing:** Translation API (DeepL / Google Cloud) + `pdf-lib` (**MIT**) text replacement.
* **Verification Status:** **VERIFIED** via live browser inspection.

#### 7.3 PDF to Markdown (`/pdf-to-markdown`)
* **Inputs:** PDF document (`.pdf`).
* **Outputs:** Clean Markdown document (`.md`).
* **Core Functionality:** Converts PDF content into structured Markdown, correctly identifying headings (`#`, `##`), lists, tables, bold/italic text, and image embeds.
* **Complexity Rating:** Medium to High.
* **Engine & Licensing:** `pymupdf4llm` (**MIT**) or `Marker` (**GPL-3.0**).
* **Verification Status:** **VERIFIED** via live browser inspection.

---

### Multi-Step Pipeline: Workflows (`/user/workflows`)
* **Core Functionality:** Enables users to chain up to 4 consecutive tools together in a single automated pipeline (e.g., `Merge -> Compress -> Add Watermark -> Protect`).
* **Verification Status:** **VERIFIED** via live browser inspection.
