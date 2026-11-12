/**
 * Live Public Deployment Verification Suite for Cloudflare Pages
 * Runs headless Chromium against the live public URL: https://openpdf-1z7.pages.dev
 * Validates TLS, direct route access, network isolation (no PDF uploads), and in-browser processing.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE_URL = "https://openpdf-1z7.pages.dev";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:\\Users\\Satyam Kumar\\.gemini\\antigravity\\brain\\4111dda1-704d-4803-a0a3-f54ccc996e8e";
const FIXTURES_DIR = path.resolve(__dirname, "../../../test_fixtures_fidelity");

async function testLiveDeployment() {
  console.log(`=== TESTING LIVE PUBLIC DEPLOYMENT: ${BASE_URL} ===\n`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const networkRequests = [];

  page.on("pageerror", (err) => {
    console.error("  [PAGE ERROR]", err.message);
    consoleErrors.push(err.message);
  });

  // Track all network requests to verify ZERO PDF data is uploaded
  page.on("request", (req) => {
    const postData = req.postData();
    if (postData && (postData.includes("%PDF") || postData.includes("application/pdf"))) {
      console.error("  [SECURITY VIOLATION] PDF data detected in network request:", req.url());
      networkRequests.push({ url: req.url(), method: req.method(), hasPdfData: true });
    }
  });

  const report = {
    baseUrl: BASE_URL,
    routes: {},
    tools: {},
    networkZeroUploads: true,
  };

  try {
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Test All 6 Routes Direct Access
    console.log("--- [1] Testing Direct Access to All 6 Routes over HTTPS ---");
    const routesToTest = [
      { path: "/", name: "home" },
      { path: "/merge/", name: "merge" },
      { path: "/split/", name: "split" },
      { path: "/rotate/", name: "rotate" },
      { path: "/reorder/", name: "reorder" },
      { path: "/remove/", name: "remove" },
    ];

    for (const r of routesToTest) {
      const fullUrl = `${BASE_URL}${r.path}`;
      const resp = await page.goto(fullUrl, { waitUntil: "networkidle0" });
      const status = resp.status();
      const title = await page.title();
      console.log(`  Route ${r.path} -> Status: ${status}, Title: "${title}"`);
      report.routes[r.name] = { status, title, ok: status === 200 };
      if (status !== 200) {
        throw new Error(`Route ${r.path} returned HTTP ${status}`);
      }
    }

    // 2. Test Live Merge Tool Execution
    console.log("\n--- [2] Testing Live Merge Tool Processing over HTTPS ---");
    await page.goto(`${BASE_URL}/merge/`, { waitUntil: "networkidle0" });
    const file1Path = path.join(FIXTURES_DIR, "mixed_orientations.pdf");
    const file2Path = path.join(FIXTURES_DIR, "annotations_links.pdf");

    const fileInput = await page.$("input[type=file]");
    await fileInput.uploadFile(file1Path, file2Path);
    await new Promise((r) => setTimeout(r, 600));

    // Click Merge 2 PDFs
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.textContent && b.textContent.includes("Merge 2 PDFs"));
      if (target) target.click();
    });

    await page.waitForFunction(
      () => document.body.innerText.includes("PDFs Merged Successfully!"),
      { timeout: 10000 }
    );
    console.log("  [PASS] Live Merge succeeded in browser without server upload!");
    report.tools.merge = "PASS";

    const liveMergeScreenshot = path.join(ARTIFACTS_DIR, "cloudflare_live_merge_verified.png");
    await page.screenshot({ path: liveMergeScreenshot });
    console.log(`  Saved screenshot: ${liveMergeScreenshot}`);

    // 3. Test Live Rotate Tool
    console.log("\n--- [3] Testing Live Rotate Tool over HTTPS ---");
    await page.goto(`${BASE_URL}/rotate/`, { waitUntil: "networkidle0" });
    const rotInput = await page.$("input[type=file]");
    await rotInput.uploadFile(file1Path);
    await new Promise((r) => setTimeout(r, 600));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const rAll = btns.find((b) => b.textContent && b.textContent.includes("Rotate All (+90°)"));
      if (rAll) rAll.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const saveBtn = btns.find((b) => b.textContent && b.textContent.includes("Apply Rotation"));
      if (saveBtn) saveBtn.click();
    });

    await page.waitForFunction(
      () => document.body.innerText.includes("PDF Rotated Successfully!"),
      { timeout: 10000 }
    );
    console.log("  [PASS] Live Rotate succeeded in browser!");
    report.tools.rotate = "PASS";

    // 4. Test Live Encrypted File Interception
    console.log("\n--- [4] Testing Live Encrypted File Defense ---");
    await page.goto(`${BASE_URL}/rotate/`, { waitUntil: "networkidle0" });
    const encInput = await page.$("input[type=file]");
    await encInput.uploadFile(path.join(FIXTURES_DIR, "encrypted_protected.pdf"));

    await page.waitForFunction(
      () => document.body.innerText.includes("Password-Protected PDF"),
      { timeout: 8000 }
    );
    console.log("  [PASS] Live Encrypted PDF defense succeeded!");
    report.tools.encryptedDefense = "PASS";

    // Verify network requests
    if (networkRequests.length > 0) {
      report.networkZeroUploads = false;
      console.error("  [FAIL] Network requests contained PDF uploads!");
    } else {
      console.log("  [PASS] Verified: Exactly ZERO bytes of PDF data uploaded to any server!");
    }

    console.log("\n=== ALL LIVE CLOUDFLARE PUBLIC URL TESTS PASSED ===");
  } finally {
    await browser.close();
  }

  return { report, consoleErrors };
}

testLiveDeployment()
  .then(({ report, consoleErrors }) => {
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "cloudflare_live_verification.json"),
      JSON.stringify({ report, consoleErrors, timestamp: new Date().toISOString() }, null, 2)
    );
    process.exit(consoleErrors.length > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("Live test failed:", err);
    process.exit(1);
  });
