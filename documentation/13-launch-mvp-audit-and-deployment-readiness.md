# Launch-First MVP: Deployment-Readiness Verification & Audit

> **Document ID:** DOC-13-LAUNCH-MVP-AUDIT  
> **Status:** Completed  
> **Date:** November 12, 2026  
> **Scope:** Launch-First MVP (Merge, Split, Rotate, Reorder, Remove)  
> **Repository:** `E:\REA`

---

## 1. Verified

- **Core PDF Engines (5/5 Complete):**
  - All 5 engines ([`merge.py`](file:///E:/REA/apps/worker/src/engine/merge.py), [`split.py`](file:///E:/REA/apps/worker/src/engine/split.py), [`rotate.py`](file:///E:/REA/apps/worker/src/engine/rotate.py), [`reorder.py`](file:///E:/REA/apps/worker/src/engine/reorder.py), [`remove.py`](file:///E:/REA/apps/worker/src/engine/remove.py)) operate purely via `pikepdf 10.18.0` and `QPDF 12.4.2` under the Apache-2.0 license.
  - Zero AGPL copyleft dependencies across all 55 scanned packages (`scripts/audit_licenses.py`).
- **Frontend Architecture & Usability:**
  - Next.js 15 standalone build verified with `output: 'standalone'` (`apps/web/.next/standalone` generated).
  - Main homepage grid ([`ToolGrid.tsx`](file:///E:/REA/apps/web/src/components/ToolGrid.tsx)) features strictly the five launch tools; unbuilt features (Protect, Unlock, Compress, JPG to PDF, PDF to JPG) moved to the post-launch roadmap.
  - Consistent layout, file drag-and-drop zones, progress polling, error banners, and download flows across all 5 tools.
- **Application Logic & In-Process Tests:**
  - 75 automated tests passing with 100% success rate across all 5 tools, input validation, leased tokens, and security primitives.
- **Production Hardening Added in Code:**
  - Added sliding-window IP rate limiting ([`apps/api/src/core/rate_limit.py`](file:///E:/REA/apps/api/src/core/rate_limit.py)) to throttle upload and download endpoints.
  - Added global error sanitization in [`apps/api/src/main.py`](file:///E:/REA/apps/api/src/main.py) to suppress internal tracebacks when `DEBUG=False`.
  - Added startup database table auto-creation in `apps/api/src/main.py` so tables are initialized on fresh PostgreSQL instances without requiring manual migrations.
  - Created `.dockerignore` to keep build contexts clean.
  - Created standalone smoke-test script ([`scripts/production_smoke_test.py`](file:///E:/REA/scripts/production_smoke_test.py)) to test all 5 tools against a live endpoint.

---

## 2. Not Verified

- **Live Container Execution on Host:**
  - Docker is not installed on this local Windows workstation (`docker` command not recognized; WSL has no installed distributions).
  - The multi-container stack in [`docker-compose.prod.yml`](file:///E:/REA/docker-compose.prod.yml) (Nginx, Web, API, Worker, Beat, Postgres, Redis, MinIO) has **not run locally**. It is structurally and syntactically configured, but unexecuted until deployed to a Docker-capable host.
- **Real Infrastructure Integration (PostgreSQL, Redis, MinIO):**
  - The 75 automated tests run under `ENVIRONMENT="test"` using **in-memory SQLite** and **mocked in-memory S3 storage**.
  - Local PostgreSQL 18 service on port 5432 rejected the hardcoded dev password; local Redis and MinIO were not running on the host.
  - Asynchronous Celery worker task dispatching via Redis broker was bypassed during test runs in favor of direct in-process async execution. Real Redis-to-Celery task message queuing has not been tested against a live Redis broker.

---

## 3. Blocking Deployment

1. **Host Without Docker / Container Runtime:**
   - Public deployment cannot occur on this local Windows machine without Docker Desktop, Podman, or a remote Linux host with Docker Engine installed.
2. **Missing Production Secrets:**
   - Production deployment requires creating `.env` from [`.env.production.example`](file:///E:/REA/.env.production.example) with strong randomly generated secrets (`APP_SECRET_KEY`, `POSTGRES_PASSWORD`, `S3_SECRET_ACCESS_KEY`).
3. **No Domain & TLS/SSL Certificate Configured:**
   - Public HTTPS requires binding a domain name to the server's public IP and configuring Let's Encrypt / Certbot in Nginx (or placing the host behind Cloudflare / AWS ALB).

---

## 4. Recommended Next Action

1. **Provision a Linux VPS (Target Hosting):**
   - Provision a modest Ubuntu 24.04 VPS (e.g. Hetzner Cloud CX22 at ~€4/mo, DigitalOcean Droplet at $12–$18/mo, or AWS EC2 `t4g.small`).
   - Install standard Docker Engine & Docker Compose plugin (`apt install docker.io docker-compose-plugin`).
2. **Deploy the Production Compose Stack:**
   - Clone repo, copy `.env.production.example` to `.env`, set random passwords, and run:
     ```bash
     docker compose -f docker-compose.prod.yml up -d --build
     ```
3. **Execute the Smoke Test Suite Against Live Deployment:**
   - Run the newly created verification script against the live deployment URL:
     ```bash
     python scripts/production_smoke_test.py http://<SERVER_IP>
     ```
   - This will perform live end-to-end testing of real PostgreSQL database writes, real Redis task brokering, real Celery worker execution, real MinIO S3 object storage, and real download token leases across all 5 PDF tools.
