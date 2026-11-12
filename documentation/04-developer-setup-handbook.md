# Developer Setup Handbook

> **Document ID:** DOC-04-DEV-GUIDE  
> **Status:** Approved Baseline  
> **Version:** 1.0.0  
> **Date:** November 12, 2026  
> **Repository:** `E:\REA`

---

## 1. Prerequisites

Before setting up the PDFKarlo Platform locally, ensure the following tools are installed on your workstation:

| Requirement | Minimum Version | Verified Version | Notes |
| :--- | :--- | :--- | :--- |
| **Python** | 3.12+ | 3.15.2 (win32, x64) | Minimum base: 3.12.0; Active host runtime: 3.15.2 |
| **Node.js** | 20+ | v26.13.1 | Required for Next.js 15 Web Application |
| **npm** | 10+ | 11.20.0 | Frontend package manager |
| **Git** | 2.40+ | 2.47+ | Version control |
| **Docker** (Optional) | 24+ | Latest | Required only for full multi-container stack |

> [!NOTE]
> **Python Runtime Architecture Resolution:**
> The platform mandates **Python 3.12+** compatibility. The local workstation and virtual environment (`.venv`) execute on **Python 3.15.2**, while containerized production builds leverage `python:3.12-slim-bookworm` or `python:3.15-slim`. All backend source code strictly adheres to standard language features shared across Python 3.12 through 3.15.

---

## 2. Environment Configuration

Copy the example environment configuration to create your local `.env`:

```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```

### Key Environment Variables (`.env.example` Reference):
```ini
# Environment Mode
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO
APP_SECRET_KEY=change-me-to-a-secure-random-256-bit-key-in-production

# API Gateway
API_HOST=0.0.0.0
API_PORT=8000
API_V1_STR=/api/v1
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Database (PostgreSQL in Docker / SQLite in headless testing)
DATABASE_URL=postgresql+asyncpg://pdf_user:pdf_password_secure@localhost:5432/pdf_platform

# Redis (Task broker & leased token manager)
REDIS_URL=redis://localhost:6379/0

# Storage (MinIO S3)
S3_ENDPOINT_URL=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_RAW_BUCKET=pdf-raw-staging
S3_ARTIFACT_BUCKET=pdf-artifacts
S3_FORCE_PATH_STYLE=True

# Processing Quotas & Retention Deadlines
MAX_FILE_SIZE_BYTES=104857600
MAX_PAGE_COUNT=1000
DOWNLOAD_TOKEN_TTL_SECONDS=900
DOWNLOAD_LEASE_WINDOW_SECONDS=120
RETENTION_HOURS=2
```

---

## 3. Option A: Zero-Docker Local Mode (Fastest)

This workflow enables instant local development and testing without requiring Docker, PostgreSQL, or Redis to be running on the host system.

### Step 1: Create and Activate Virtual Environment
```bash
# Windows PowerShell:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate
```

### Step 2: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r apps/api/requirements.txt
pip install -r apps/worker/requirements.txt
pip install pytest pytest-asyncio pip-licenses
```

### Step 3: Run Automated Tests
```bash
pytest tests/ -v
```
*Note:* The test suite uses SQLite in-memory (`aiosqlite`) and built-in fallback storage/token mechanisms, requiring zero external infrastructure.

### Step 4: Run License Compliance Audit
```bash
python scripts/audit_licenses.py
```

### Step 5: Start the FastAPI API Gateway
```bash
uvicorn apps.api.src.main:app --reload --port 8000
```
- Interactive Swagger Documentation: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Component Health Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Step 6: Start the Next.js Frontend
In a new terminal window:
```bash
cd apps/web
npm install
npm run dev
```
- Access Web Interface: [http://localhost:3000](http://localhost:3000)

---

## 4. Option B: Docker Compose Full Stack

To boot the complete distributed platform including PostgreSQL 16, Redis 7, MinIO object storage, Celery worker cluster, and the Celery Beat active retention scheduler:

### Step 1: Launch Multi-Container Environment
```bash
docker compose -f infra/docker/docker-compose.yml up --build -d
```

### Step 2: Verify Running Services
```bash
docker compose -f infra/docker/docker-compose.yml ps
```

### Step 3: Access Platform Services
- **Next.js Web UI:** [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Docs:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **MinIO S3 Storage Console:** [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

### Step 4: Tail Celery Worker Logs
```bash
docker compose -f infra/docker/docker-compose.yml logs -f worker beat
```

---

## 5. Common Troubleshooting & Developer Pitfalls

### 1. `ModuleNotFoundError: No module named 'greenlet'`
- **Cause:** SQLAlchemy's `asyncio` extension requires the `greenlet` native extension on Python 3.12+.
- **Fix:** Ensure `greenlet>=3.1.0` is installed via `pip install greenlet`.

### 2. `RuntimeError: Form data requires "python-multipart" to be installed`
- **Cause:** FastAPI endpoints accepting `UploadFile` or form parameters require `python-multipart`.
- **Fix:** Run `pip install python-multipart`.

### 3. Next.js Build Error: `Incompatible React versions (19.3.1 vs 19.3.0)`
- **Cause:** Unpinned `^19.0.0` version ranges in `package.json` can cause `react` and `react-dom` to resolve to differing minor/patch releases.
- **Fix:** Explicitly pin `react`, `react-dom`, `@types/react`, and `@types/react-dom` to the exact same version (`19.2.0`).

### 4. `TypeError: can't compare offset-naive and offset-aware datetimes`
- **Cause:** SQLite stores timestamps as text and returns offset-naive datetimes, whereas PostgreSQL returns timezone-aware UTC timestamps.
- **Fix:** In database models and query logic, normalize datetime awareness:
  ```python
  job_expires = job.expires_at.replace(tzinfo=timezone.utc) if job.expires_at.tzinfo is None else job.expires_at
  ```
