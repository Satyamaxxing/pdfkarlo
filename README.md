# PDFKarlo — Privacy-First Browser-Based PDF Toolkit

[![Production](https://img.shields.io/badge/Production-Live%20on%20Cloudflare%20Pages-22c55e?style=flat-square)](https://pdfkarlo.pages.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![pdf--lib](https://img.shields.io/badge/Engine-pdf--lib-red?style=flat-square)](https://pdf-lib.js.org/)
[![PDF.js](https://img.shields.io/badge/Preview-PDF.js%204.10-orange?style=flat-square)](https://mozilla.github.io/pdf.js/)

> **PDFKarlo** is a fast, free, and privacy-first PDF utility suite engineered to process documents entirely in the user's browser. PDF documents and thumbnails never leave your device.

- **Live Production URL:** [https://pdfkarlo.pages.dev](https://pdfkarlo.pages.dev)
- **Deployment Platform:** Cloudflare Pages Free Tier
- **Processing Architecture:** 100% Client-Side Web Workers (`pdf-lib` + `pdfjs-dist`)

---

## 1. Five Browser-Based PDF Tools

All five tools execute completely within the client browser using Web Workers and HTML5 Canvas:

| Tool | Route | Capabilities |
| :--- | :--- | :--- |
| **Merge PDF** | [`/merge`](https://pdfkarlo.pages.dev/merge) | Combine multiple PDF files into one document. Features multi-document page previews, drag-and-drop document reordering, and a Unified Sequence view showing every page across all uploaded files. |
| **Split PDF** | [`/split`](https://pdfkarlo.pages.dev/split) | Split documents using 3 modes: **Split by Ranges** (with real-time colored part badges), **Extract Pages** (visual page selection), and **Burst Mode** (extracts every page as standalone PDFs in a ZIP archive). |
| **Rotate PDF** | [`/rotate`](https://pdfkarlo.pages.dev/rotate) | Rotate pages visually with instant orientation preview. Dedicated bidirectional rotation buttons (CW +90°, CCW -90°) on every card, bulk rotate actions, and full-page high-resolution zoom modal. |
| **Reorder PDF** | [`/reorder`](https://pdfkarlo.pages.dev/reorder) | Visually rearrange pages with HTML5 drag-and-drop or position buttons (start, left, right, end). Includes "Reverse Order", "Reset to Original", and live moved indicators. |
| **Remove PDF** | [`/remove`](https://pdfkarlo.pages.dev/remove) | Delete unwanted or blank pages. Features click-to-delete toggles with red overlay and grayscale preview, quick range selection (e.g. `2-4`), and a zero-page deletion safeguard. |

---

## 2. Privacy-First Architecture

Unlike traditional cloud PDF services that upload your confidential documents to external servers:

1. **Zero Server Uploads:** PDF binary data is read via `FileReader` / `ArrayBuffer` and processed directly in browser memory using `pdf-lib`. No PDF bytes or metadata are transmitted to any server.
2. **Local Worker Rasterization:** Real page previews are rendered locally using `pdfjs-dist` (v4.10.38) via a dedicated Web Worker (`/pdf.worker.min.mjs`) rendering to HTML5 `<canvas>`.
3. **Memory Safeguards:** A bounded LRU cache (150 entries max), concurrency limiter (2 concurrent renders), and explicit canvas cleanup (`canvas.width = 0; canvas.height = 0`) prevent browser tab crashes.
4. **Encryption Safety:** Password-protected PDFs are detected during client inspection and cleanly rejected with clear messaging—never bypassing encryption or compromising security.

```
+-------------------------------------------------------------------------+
|                           User Web Browser                              |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                   Next.js 15 UI / Workspace                       |  |
|  |  - WorkspaceHeader, PdfPageGrid, PdfThumbnailCard, ZoomModal      |  |
|  +-------------------------------------------------------------------+  |
|               |                                         |               |
|      [Local ArrayBuffer]                       [ArrayBuffer Slice]      |
|               v                                         v               |
|  +-------------------------+               +-------------------------+  |
|  |   pdf-lib Manipulation  |               |    pdfjs-dist Worker    |  |
|  | - Merge, Split, Rotate  |               | - In-memory Rasterizer  |  |
|  | - Reorder, Remove Pages |               | - Bounded LRU Cache     |  |
|  | - JSZip Output Bundler  |               | - HTML5 Canvas Cleanup  |  |
|  +-------------------------+               +-------------------------+  |
|               |                                         |               |
|       [Instant Download]                       [Local View Only]        |
|                                                                         |
|       *** ZERO NETWORK REQUESTS FOR PDF DATA PROCESSING ***             |
+-------------------------------------------------------------------------+
```

---

## 3. Technology Stack

- **Frontend (`apps/web`):**
  - **Framework:** Next.js 15 (App Router, Static HTML Export)
  - **UI Library:** React 19, Tailwind CSS, Lucide Icons
  - **PDF Manipulation Engine:** `pdf-lib` (v1.17.1)
  - **PDF Preview Engine:** `pdfjs-dist` (v4.10.38)
  - **Archive Bundling:** `jszip` (v3.10.1)
  - **Hosting:** Cloudflare Pages Free Tier
- **Preserved Backend (`apps/api`, `apps/worker`):**
  - **API Gateway:** FastAPI, Python 3.12+, Uvicorn
  - **Distributed Worker:** Celery, Redis
  - **PDF Processing Libraries:** pikepdf (QPDF 11+), pypdfium2 (Google PDFium), Pillow
  - **Database & Storage:** PostgreSQL 16, MinIO / AWS S3
  - **Test Suite:** 75 automated integration & unit tests passing (`pytest`)

---

## 4. Repository Structure

```
├── .github/workflows/             # CI workflow configurations
├── apps/
│   ├── web/                       # Next.js 15 Browser-Based PDF Application
│   │   ├── public/                # Static assets & pdf.worker.min.mjs
│   │   ├── src/
│   │   │   ├── app/               # Routes: /, /merge, /split, /rotate, /reorder, /remove
│   │   │   ├── components/        # FileUploadZone, JobProgressBar, workspace components
│   │   │   │   └── workspace/     # WorkspaceHeader, PdfPageGrid, PdfThumbnailCard, PagePreviewModal
│   │   │   └── lib/pdf/           # clientPdfService, thumbnailService, types
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                       # Preserved FastAPI REST Backend
│   │   ├── src/                   # Endpoints, schemas, database models
│   │   └── requirements.txt
│   └── worker/                    # Preserved Celery Worker Cluster
│       ├── src/                   # Tasks and cleanup sweeper
│       └── requirements.txt
├── documentation/                 # Technical documentation & sprint reports
├── infra/                         # Docker & Nginx configurations
├── scripts/                       # Verification & utility scripts
├── test_fixtures_fidelity/        # Sample PDFs for testing
├── tests/                         # Pytest test suite for Python backend (75 tests)
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git exclusions
├── FINAL-LAUNCH-STATUS.md         # Latest production deployment status
└── pytest.ini                     # Pytest configuration
```

---

## 5. Local Development

### Prerequisites
- Node.js 20+ and npm 10+
- Optional: Python 3.12+ (for running the backend test suite)

### Running the Frontend Locally

```bash
# Navigate to web application directory
cd apps/web

# Install dependencies
npm install

# Start local Next.js development server
npm run dev
```

Visit `http://localhost:3000` to test the tools locally.

### Building for Static Export

```bash
cd apps/web
npm run build
```

The static HTML/JS/CSS output will be generated in `apps/web/out/`.

### Running Python Backend Tests

```bash
# Activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .\.venv\Scripts\activate

# Install dependencies
pip install -r apps/api/requirements.txt
pip install -r apps/worker/requirements.txt
pip install pytest pytest-asyncio

# Execute test suite
pytest tests/ -v
```

All 75 unit and integration tests will execute against the backend engine.

---

## 6. License

PDFKarlo is released as open-source software under the MIT License. Built entirely with permissive open-source libraries with zero AGPL copyleft exposure.
