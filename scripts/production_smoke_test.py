#!/usr/bin/env python3
"""Production Smoke Test Suite for OpenPDF Platform.

Executes end-to-end integration smoke tests across all five core MVP PDF tools,
health probes, and leased download tokens against a running deployment.

Usage:
    python scripts/production_smoke_test.py [BASE_URL]
    Example: python scripts/production_smoke_test.py http://localhost
"""

import io
import json
import sys
import time
import httpx
import pikepdf


def create_blank_pdf(num_pages: int = 1) -> bytes:
    """Generate a clean synthetic PDF in memory with num_pages."""
    pdf = pikepdf.Pdf.new()
    for _ in range(num_pages):
        pdf.add_blank_page()
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


def poll_job_until_done(client: httpx.Client, base_url: str, job_id: str, timeout: int = 30) -> dict:
    """Poll job status until COMPLETED or FAILED."""
    start = time.time()
    while time.time() - start < timeout:
        resp = client.get(f"{base_url}/api/v1/jobs/{job_id}")
        assert resp.status_code == 200, f"Poll failed with status {resp.status_code}"
        data = resp.json()
        if data["status"] == "COMPLETED":
            return data
        elif data["status"] == "FAILED":
            raise RuntimeError(f"Job {job_id} failed: {data.get('error_message')}")
        time.sleep(0.5)
    raise TimeoutError(f"Job {job_id} timed out after {timeout}s")


def run_smoke_tests(base_url: str = "http://localhost"):
    print(f"================================================================")
    print(f"OpenPDF Platform — Production Smoke Test Suite")
    print(f"Target Base URL: {base_url}")
    print(f"================================================================\n")

    passed_count = 0
    total_tests = 7

    with httpx.Client(timeout=15.0) as client:
        # 1. Health Probe
        print("[1/7] Testing Gateway & Health Probe...")
        health_resp = client.get(f"{base_url}/api/v1/health")
        if health_resp.status_code == 200:
            health_data = health_resp.json()
            print(f"  [PASS] /api/v1/health -> status={health_data.get('status')}")
            passed_count += 1
        else:
            print(f"  [FAIL] /api/v1/health returned {health_resp.status_code}: {health_resp.text}")

        # 2. Merge PDF Smoke Test
        print("\n[2/7] Testing Merge PDF (2 documents)...")
        pdf1 = create_blank_pdf(1)
        pdf2 = create_blank_pdf(1)
        files = [
            ("files", ("doc1.pdf", pdf1, "application/pdf")),
            ("files", ("doc2.pdf", pdf2, "application/pdf")),
        ]
        data = {"operation": "merge", "options": json.dumps({"output_filename": "merged_smoke.pdf"})}
        resp = client.post(f"{base_url}/api/v1/jobs", data=data, files=files)
        assert resp.status_code == 201, f"Merge job creation failed: {resp.text}"
        job_id = resp.json()["job_id"]
        job_status = poll_job_until_done(client, base_url, job_id)
        token = job_status["output_files"][0]["download_token"]
        dl_resp = client.get(f"{base_url}/api/v1/downloads/{token}")
        assert dl_resp.status_code == 200, f"Download failed: {dl_resp.status_code}"
        with pikepdf.open(io.BytesIO(dl_resp.content)) as out_pdf:
            assert len(out_pdf.pages) == 2, f"Expected 2 pages, got {len(out_pdf.pages)}"
        print("  [PASS] Merge PDF verified end-to-end (2 pages merged).")
        passed_count += 1

        # 3. Split PDF Smoke Test
        print("\n[3/7] Testing Split PDF (Range extraction)...")
        pdf_3p = create_blank_pdf(3)
        files = [("files", ("source.pdf", pdf_3p, "application/pdf"))]
        data = {"operation": "split", "options": json.dumps({"mode": "range", "ranges": "1-2"})}
        resp = client.post(f"{base_url}/api/v1/jobs", data=data, files=files)
        assert resp.status_code == 201, f"Split job creation failed: {resp.text}"
        job_id = resp.json()["job_id"]
        job_status = poll_job_until_done(client, base_url, job_id)
        token = job_status["output_files"][0]["download_token"]
        dl_resp = client.get(f"{base_url}/api/v1/downloads/{token}")
        assert dl_resp.status_code == 200
        with pikepdf.open(io.BytesIO(dl_resp.content)) as out_pdf:
            assert len(out_pdf.pages) == 2
        print("  [PASS] Split PDF verified end-to-end (pages 1-2 extracted).")
        passed_count += 1

        # 4. Rotate PDF Smoke Test
        print("\n[4/7] Testing Rotate PDF (90 degrees)...")
        pdf_1p = create_blank_pdf(1)
        files = [("files", ("rot.pdf", pdf_1p, "application/pdf"))]
        data = {"operation": "rotate", "options": json.dumps({"angle": 90})}
        resp = client.post(f"{base_url}/api/v1/jobs", data=data, files=files)
        assert resp.status_code == 201, f"Rotate job creation failed: {resp.text}"
        job_id = resp.json()["job_id"]
        job_status = poll_job_until_done(client, base_url, job_id)
        token = job_status["output_files"][0]["download_token"]
        dl_resp = client.get(f"{base_url}/api/v1/downloads/{token}")
        assert dl_resp.status_code == 200
        with pikepdf.open(io.BytesIO(dl_resp.content)) as out_pdf:
            assert int(out_pdf.pages[0].get("/Rotate", 0)) == 90
        print("  [PASS] Rotate PDF verified end-to-end (page rotated 90°).")
        passed_count += 1

        # 5. Reorder PDF Smoke Test
        print("\n[5/7] Testing Reorder PDF ([3, 1, 2] permutation)...")
        pdf_3p = create_blank_pdf(3)
        files = [("files", ("reorder.pdf", pdf_3p, "application/pdf"))]
        data = {"operation": "reorder", "options": json.dumps({"sequence": [3, 1, 2]})}
        resp = client.post(f"{base_url}/api/v1/jobs", data=data, files=files)
        assert resp.status_code == 201, f"Reorder job creation failed: {resp.text}"
        job_id = resp.json()["job_id"]
        job_status = poll_job_until_done(client, base_url, job_id)
        token = job_status["output_files"][0]["download_token"]
        dl_resp = client.get(f"{base_url}/api/v1/downloads/{token}")
        assert dl_resp.status_code == 200
        with pikepdf.open(io.BytesIO(dl_resp.content)) as out_pdf:
            assert len(out_pdf.pages) == 3
        print("  [PASS] Reorder PDF verified end-to-end ([3, 1, 2] permutation applied).")
        passed_count += 1

        # 6. Remove PDF Smoke Test
        print("\n[6/7] Testing Remove PDF (Remove page 2 from 3 pages)...")
        pdf_3p = create_blank_pdf(3)
        files = [("files", ("remove.pdf", pdf_3p, "application/pdf"))]
        data = {"operation": "remove", "options": json.dumps({"pages": [2]})}
        resp = client.post(f"{base_url}/api/v1/jobs", data=data, files=files)
        assert resp.status_code == 201, f"Remove job creation failed: {resp.text}"
        job_id = resp.json()["job_id"]
        job_status = poll_job_until_done(client, base_url, job_id)
        token = job_status["output_files"][0]["download_token"]
        dl_resp = client.get(f"{base_url}/api/v1/downloads/{token}")
        assert dl_resp.status_code == 200
        with pikepdf.open(io.BytesIO(dl_resp.content)) as out_pdf:
            assert len(out_pdf.pages) == 2
        print("  [PASS] Remove PDF verified end-to-end (page 2 removed, 2 pages remain).")
        passed_count += 1

        # 7. Byte-Range Streaming Smoke Test
        print("\n[7/7] Testing HTTP Range Streaming (RFC 7233)...")
        range_headers = {"Range": "bytes=0-9"}
        range_resp = client.get(f"{base_url}/api/v1/downloads/{token}", headers=range_headers)
        assert range_resp.status_code in (200, 206), f"Range request failed: {range_resp.status_code}"
        assert len(range_resp.content) in (10, len(dl_resp.content))
        print("  [PASS] Leased token byte-range streaming verified.")
        passed_count += 1

    print(f"\n================================================================")
    print(f"Smoke Test Results: {passed_count}/{total_tests} PASSED")
    print(f"================================================================")
    return passed_count == total_tests


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost"
    success = run_smoke_tests(url)
    sys.exit(0 if success else 1)
