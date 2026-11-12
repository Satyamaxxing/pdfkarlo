# API & Database Technical Reference

> **Document ID:** DOC-05-API-DB-REF  
> **Status:** Approved Baseline  
> **Version:** 1.0.0  
> **Date:** November 12, 2026  
> **Repository:** `E:\REA`

---

## 1. REST API Specification

All platform endpoints adhere to REST conventions with OpenAPI v3 compatibility. The API is served under the versioned prefix `/api/v1`.

### 1.1 Root Platform Discovery
- **Endpoint:** `GET /`
- **Description:** Returns service name, current version, and documentation links.
- **Response (200 OK):**
```json
{
  "name": "PDF Processing Platform API",
  "version": "0.1.0",
  "status": "operational",
  "docs_url": "/api/v1/docs",
  "health_url": "/api/v1/health"
}
```

---

### 1.2 Health Monitoring Endpoints

#### `GET /api/v1/health`
- **Description:** Deep connectivity inspection across PostgreSQL, Redis, and S3/MinIO.
- **Response (200 OK / 503 Degraded):**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2026-11-12T07:15:00.000000Z",
  "components": {
    "database": {
      "status": "healthy",
      "latency_ms": 1.25,
      "details": "Connected"
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 0.85,
      "details": "Connected"
    },
    "storage": {
      "status": "healthy",
      "latency_ms": 2.10,
      "details": "Connected"
    }
  }
}
```

#### `GET /api/v1/health/liveness`
- **Description:** Lightweight probe for Kubernetes / container orchestrators.
- **Response (200 OK):**
```json
{
  "status": "alive"
}
```

#### `GET /api/v1/health/readiness`
- **Description:** Verifies database availability before routing ingress traffic.
- **Response (200 OK / 503 Unready):**
```json
{
  "status": "ready"
}
```

---

### 1.3 Job Management Endpoints

#### `POST /api/v1/jobs`
- **Description:** Ingests input files, performs magic-byte validation, streams bytes to `pdf-raw-staging`, and creates an asynchronous processing job.
- **Content-Type:** `multipart/form-data`
- **Request Parameters:**
  - `operation` (string, required): One of `merge`, `split`, `rotate`, `reorder`, `remove`, `compress`, `jpg_to_pdf`, `pdf_to_jpg`, `protect`, `unlock`.
  - `options` (string / JSON, optional): Operation parameters:
    - For `merge`: `{"file_order": ["file1.pdf", "file2.pdf"], "output_filename": "merged.pdf"}`
    - For `split`: `{"mode": "range" | "extract" | "burst", "ranges": "1-3, 4-6", "pages": "1, 3, 5"}`
    - For `rotate`: `{"angle": 90 | 180 | 270, "pages": "1, 3"}` or `{"page_rotations": {"1": 90, "2": 180}}`
    - For `reorder`: `{"sequence": [2, 1, 3]}` (1-indexed full permutation)
    - For `remove`: `{"pages": [2, 4], "output_filename": "cleaned.pdf"}` (1-indexed page deletion list)
  - `files` (binary file array, required): One or more uploaded document or image files (`split`, `rotate`, `reorder`, and `remove` require exactly 1 file; `merge` requires 2+ files).
- **Validation Rules:**
  - File signature must match expected magic bytes (`%PDF-` or image SOI).
  - Maximum upload size: 100MB per file.
  - Operation-specific file count checks (`merge` >= 2, `split` == 1, `rotate` == 1, `reorder` == 1, `remove` == 1).
- **Response (201 Created):**
```json
{
  "job_id": "691eeb47-c5c8-4778-9ddf-5188c3c2068a",
  "operation": "merge",
  "status": "PENDING",
  "created_at": "2026-11-12T07:00:00.000000Z",
  "expires_at": "2026-11-12T09:00:00.000000Z"
}
```
- **Error Responses:**
  - `400 Bad Request`: Magic byte signature mismatch or invalid options JSON.
  - `413 Payload Too Large`: Upload exceeds `MAX_FILE_SIZE_BYTES`.

---

#### `GET /api/v1/jobs/{job_id}`
- **Description:** Retrieves real-time status, progress percentage, error states, and download tokens.
- **Path Parameter:** `job_id` (UUIDv4)
- **Response (200 OK):**
```json
{
  "job_id": "691eeb47-c5c8-4778-9ddf-5188c3c2068a",
  "operation": "merge",
  "status": "COMPLETED",
  "progress_percent": 100,
  "created_at": "2026-11-12T07:00:00.000000Z",
  "started_at": "2026-11-12T07:00:01.000000Z",
  "completed_at": "2026-11-12T07:00:03.000000Z",
  "expires_at": "2026-11-12T09:00:00.000000Z",
  "error_code": null,
  "error_message": null,
  "download_token": "dl_9qF3nLk8_vM2xZ7aB1cP4wR6yT0e",
  "download_url": "/api/v1/downloads/dl_9qF3nLk8_vM2xZ7aB1cP4wR6yT0e",
  "output_files": [
    {
      "id": "93a1c8f2-1d54-46b0-9b38-23f4c6e789a1",
      "file_role": "OUTPUT",
      "filename_original": "merged_document.pdf",
      "file_size_bytes": 1048576,
      "mime_type": "application/pdf",
      "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "created_at": "2026-11-12T07:00:03.000000Z",
      "download_token": "dl_9qF3nLk8_vM2xZ7aB1cP4wR6yT0e",
      "download_url": "/api/v1/downloads/dl_9qF3nLk8_vM2xZ7aB1cP4wR6yT0e"
    }
  ]
}
```

---

### 1.4 Download & Streaming Endpoints

#### `GET /api/v1/downloads/{token}`
- **Description:** Redeems a leased download token and streams the processed artifact. Supports HTTP `Range` headers for resumed and chunked transfers.
- **Path Parameter:** `token` (string, required)
- **Request Headers (Optional):**
  - `Range: bytes=0-1048575`
- **Response Headers:**
  - `Accept-Ranges: bytes`
  - `Content-Disposition: attachment; filename="document.pdf"`
  - `Cache-Control: private, no-store, no-cache, must-revalidate`
  - `X-Download-Attempts-Remaining: 2`
- **Response Status Codes:**
  - `200 OK`: Full file stream.
  - `206 Partial Content`: Byte range stream satisfying `Range` header.
  - `404 Not Found`: Invalid or non-existent token.
  - `410 Gone`: Token expired or retention deadline elapsed.
  - `403 Forbidden`: Maximum retry limit reached (3 attempts exhausted).

---

## 2. Database Schema & Tables

The relational database is implemented using SQLAlchemy 2.0 ORM models in [`apps/api/src/db/models.py`](file:///E:/REA/apps/api/src/db/models.py).

### 2.1 Table: `jobs`
Maintains operational state and lifecycle deadlines for each requested manipulation.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID / CHAR(36)` | No | Primary Key | Unique job identifier |
| `operation` | `VARCHAR(50)` | No | Indexed | Operation name (`merge`, `split`, etc.) |
| `status` | `VARCHAR(30)` | No | Indexed, Default: `'PENDING'` | State (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `EXPIRED`) |
| `client_ip_hash` | `VARCHAR(64)` | Yes | | Pseudonymized salted SHA-256 client IP |
| `options_json` | `JSON` | Yes | Default: `{}` | Serialized user parameters |
| `error_code` | `VARCHAR(64)` | Yes | | Standardized error string |
| `error_message` | `TEXT` | Yes | | Technical failure description |
| `created_at` | `TIMESTAMPTZ` | No | Indexed, Default: `NOW()` | Submission timestamp |
| `started_at` | `TIMESTAMPTZ` | Yes | | Worker processing start timestamp |
| `completed_at` | `TIMESTAMPTZ` | Yes | | Finalization timestamp |
| `expires_at` | `TIMESTAMPTZ` | No | Indexed | Ephemeral retention deadline ($T_0 + 2\text{h}$) |

---

### 2.2 Table: `job_files`
Tracks raw user uploads, intermediate working files, and output artifacts.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID / CHAR(36)` | No | Primary Key | Unique file identifier |
| `job_id` | `UUID / CHAR(36)` | No | Foreign Key (`jobs.id`, CASCADE), Indexed | Parent job reference |
| `file_role` | `VARCHAR(30)` | No | | Role (`INPUT`, `OUTPUT`, `INTERMEDIATE`) |
| `s3_bucket` | `VARCHAR(128)`| No | | Storage bucket name |
| `s3_key` | `VARCHAR(512)`| No | | Object key path in S3 |
| `filename_original`| `VARCHAR(255)`| No | | Uploaded file name |
| `file_size_bytes` | `BIGINT` | No | | Binary size in bytes |
| `mime_type` | `VARCHAR(100)`| No | | Verified MIME type |
| `sha256_hash` | `VARCHAR(64)` | No | | Cryptographic checksum |
| `created_at` | `TIMESTAMPTZ` | No | Default: `NOW()` | Ingestion timestamp |

---

### 2.3 Table: `job_artifacts`
Tracks auxiliary outputs such as page thumbnails, preview images, and page maps.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID / CHAR(36)` | No | Primary Key | Unique artifact identifier |
| `job_id` | `UUID / CHAR(36)` | No | Foreign Key (`jobs.id`, CASCADE), Indexed | Parent job reference |
| `artifact_type` | `VARCHAR(64)` | No | | Type (`THUMBNAIL`, `PREVIEW`, `PAGE_MAP`) |
| `s3_bucket` | `VARCHAR(128)`| No | | Target bucket |
| `s3_key` | `VARCHAR(512)`| No | | Storage key path |
| `created_at` | `TIMESTAMPTZ` | No | Default: `NOW()` | Generation timestamp |

---

### 2.4 Table: `download_tokens`
Manages single-session leased authorization tokens for file retrieval.

| Column | Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID / CHAR(36)` | No | Primary Key | Token identifier |
| `token` | `VARCHAR(64)` | No | Unique, Indexed | Cryptographic URL-safe token string |
| `job_id` | `UUID / CHAR(36)` | No | Foreign Key (`jobs.id`, CASCADE), Indexed | Associated job |
| `file_id` | `UUID / CHAR(36)` | Yes | Foreign Key (`job_files.id`, CASCADE) | Associated output file |
| `created_at` | `TIMESTAMPTZ` | No | Default: `NOW()` | Generation timestamp |
| `expires_at` | `TIMESTAMPTZ` | No | Indexed | Hard token expiration (15 minutes) |
| `lease_expires_at`| `TIMESTAMPTZ` | Yes | | Dynamic lease expiration (120 seconds post-redemption) |
| `retry_count` | `INTEGER` | No | Default: `0` | Number of download attempts made |
| `max_retries` | `INTEGER` | No | Default: `3` | Maximum permitted download attempts |
| `is_revoked` | `BOOLEAN` | No | Default: `FALSE` | Manual revocation flag |
