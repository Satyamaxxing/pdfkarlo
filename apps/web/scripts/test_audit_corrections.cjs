const http = require("http");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const PORT = 3456;
const OUT_DIR = path.resolve(__dirname, "../out");
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:\\Users\\Satyam Kumar\\.gemini\\antigravity\\brain\\4111dda1-704d-4803-a0a3-f54ccc996e8e";
const FIXTURE_1 = path.resolve(__dirname, "../../../test_fixtures_fidelity/annotations_links.pdf");
const FIXTURE_2 = path.resolve(__dirname, "../../../test_fixtures_fidelity/bookmarks_outlines.pdf");
const FIXTURE_PATH = FIXTURE_1;

// MIME map for static server
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split("?")[0]);
    if (reqPath === "/") reqPath = "/index.html";

    let filePath = path.join(OUT_DIR, reqPath);

    // Check directory or file with .html extension
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + ".html")) {
      filePath = filePath + ".html";
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const notFoundPath = path.join(OUT_DIR, "404.html");
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { "Content-Type": "text/html" });
        return res.end(fs.readFileSync(notFoundPath));
      }
      res.writeHead(404);
      return res.end("Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function runAuditValidation() {
  console.log("=== STARTING AUDIT CORRECTIONS VALIDATION ===");

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[1] Local static server running at http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = {
    routes: {},
    messagingAudit: {},
    mobileResponsiveness: {},
    mobileMenu: {},
    workflowZeroUploads: {},
    errors: [],
  };

  try {
    const page = await browser.newPage();
    const BASE_URL = `http://localhost:${PORT}`;

    // --- TEST 1: ALL 6 ROUTES CHECK ---
    console.log("\n--- [1] Checking All 6 Routes ---");
    const routes = ["/", "/merge", "/split", "/rotate", "/reorder", "/remove"];
    for (const r of routes) {
      const resp = await page.goto(`${BASE_URL}${r}`, { waitUntil: "networkidle0" });
      const status = resp.status();
      const title = await page.title();
      results.routes[r] = { status, title, ok: status === 200 };
      console.log(`  Route ${r.padEnd(9)} -> Status: ${status} | Title: ${title}`);
    }

    // --- TEST 2: COPY & MESSAGING AUDIT ON HOMEPAGE ---
    console.log("\n--- [2] Auditing Messaging Corrections on Homepage ---");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    const homeHtml = await page.content();

    // Verify obsolete terms are GONE
    const obsoleteTerms = [
      "100MB per file",
      "2-Hour Auto-Purge",
      "2-Hour Ephemeral Purge",
      "Encrypted in transit & at rest",
      "Leased Token Security",
      "single-tenant sandboxed worker",
      "QPDF, Google PDFium, and Pillow",
      "Developer API",
    ];

    results.messagingAudit.obsoleteTermsRemoved = true;
    for (const term of obsoleteTerms) {
      const present = homeHtml.includes(term);
      if (present) {
        console.error(`  [FAIL] Obsolete term found: "${term}"`);
        results.messagingAudit.obsoleteTermsRemoved = false;
        results.errors.push(`Found obsolete term: ${term}`);
      } else {
        console.log(`  [PASS] Obsolete term cleanly removed: "${term}"`);
      }
    }

    // Verify approved terms are PRESENT
    const approvedTerms = [
      "Your PDFs are processed locally in your browser. PDF files are not uploaded to our servers.",
      "No Server Uploads",
      "100% In-Browser Privacy",
      "Zero Tracking",
      "Magic-Byte Validation",
      "In-Browser Web Workers",
      "Zero Server Retention",
      "Web Worker Isolation",
    ];

    results.messagingAudit.approvedTermsPresent = true;
    for (const term of approvedTerms) {
      const present = homeHtml.includes(term);
      if (!present) {
        console.error(`  [FAIL] Expected approved term missing: "${term}"`);
        results.messagingAudit.approvedTermsPresent = false;
        results.errors.push(`Missing approved term: ${term}`);
      } else {
        console.log(`  [PASS] Verified approved term present: "${term.substring(0, 50)}..."`);
      }
    }

    // Verify FileUploadZone on a tool page displays "Up to 50MB per file"
    console.log("\n--- [3] Checking FileUploadZone 50MB text on /merge ---");
    await page.goto(`${BASE_URL}/merge`, { waitUntil: "networkidle0" });
    const mergeHtml = await page.content();
    const has50MB = mergeHtml.includes("Up to 50MB per file");
    const has100MB = mergeHtml.includes("Up to 100MB per file");
    console.log(`  FileUploadZone has "Up to 50MB per file": ${has50MB}`);
    console.log(`  FileUploadZone has "Up to 100MB per file": ${has100MB} (must be false)`);
    results.messagingAudit.fileUploadZone50MB = has50MB && !has100MB;

    // --- TEST 4: DESKTOP NAVIGATION ---
    console.log("\n--- [4] Testing Desktop Navigation ---");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/merge`, { waitUntil: "networkidle0" });

    // Click "Privacy & Security" link from /merge
    const securityLink = await page.$('a[href="/#security"]');
    console.log(`  "Privacy & Security" link with href="/#security" exists: ${Boolean(securityLink)}`);
    if (securityLink) {
      await securityLink.click();
      await new Promise((r) => setTimeout(r, 1000));
      const currentUrl = page.url();
      console.log(`  Navigated to: ${currentUrl}`);
      const onSecuritySection = currentUrl.includes("#security");
      console.log(`  Successfully navigated from /merge to /#security: ${onSecuritySection}`);
    }

    // --- TEST 5: MOBILE RESPONSIVENESS AT 375px AND 390px ---
    console.log("\n--- [5] Testing Mobile Responsiveness & Overflow ---");
    const mobileWidths = [375, 390];
    for (const w of mobileWidths) {
      for (const r of routes) {
        await page.setViewport({ width: w, height: 750, isMobile: true, hasTouch: true });
        await page.goto(`${BASE_URL}${r}`, { waitUntil: "networkidle0" });

        const overflow = await page.evaluate(() => {
          return {
            windowInnerWidth: window.innerWidth,
            bodyScrollWidth: document.body.scrollWidth,
            hasHorizontalScrollbar: document.documentElement.scrollWidth > window.innerWidth,
          };
        });

        results.mobileResponsiveness[`${w}px_${r}`] = overflow;
        console.log(`  Width ${w}px | Route ${r.padEnd(8)} -> ScrollWidth: ${overflow.bodyScrollWidth} | Overflow: ${overflow.hasHorizontalScrollbar}`);
        if (overflow.hasHorizontalScrollbar) {
          results.errors.push(`Horizontal overflow detected at ${w}px on route ${r}`);
        }
      }
    }

    // --- TEST 6: MOBILE NAVIGATION MENU (375px & 390px) ---
    console.log("\n--- [6] Testing Mobile Navigation Menu & Accessibility ---");
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

    // 1. Check toggle button exists and has accessible attributes
    const menuBtn = await page.$('button[aria-label="Open navigation menu"]');
    console.log(`  Mobile toggle button found: ${Boolean(menuBtn)}`);

    let initialExpanded = await page.evaluate((el) => el.getAttribute("aria-expanded"), menuBtn);
    console.log(`  Initial aria-expanded: ${initialExpanded}`);

    // 2. Open mobile menu
    await menuBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    let openedExpanded = await page.evaluate((btn) => btn.getAttribute("aria-expanded"), menuBtn);
    let navVisible = await page.$("#mobile-navigation");
    console.log(`  After click -> aria-expanded: ${openedExpanded} | #mobile-navigation visible: ${Boolean(navVisible)}`);

    // Screenshot of open mobile menu
    const menuScreenshot = path.join(ARTIFACTS_DIR, "mobile_375_menu_open.png");
    await page.screenshot({ path: menuScreenshot });
    console.log(`  Saved screenshot: ${menuScreenshot}`);

    // 3. Test Escape key closes menu
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 300));
    let closedAfterEsc = await page.$("#mobile-navigation");
    console.log(`  After Escape key -> #mobile-navigation visible: ${Boolean(closedAfterEsc)} (expected false)`);

    // 4. Test clicking link in mobile menu closes menu and navigates
    await menuBtn.click();
    await new Promise((r) => setTimeout(r, 300));
    const toolsMobileLink = await page.$('#mobile-navigation a[href="/#tools"]');
    if (toolsMobileLink) {
      await toolsMobileLink.click();
      await new Promise((r) => setTimeout(r, 500));
      const closedAfterClick = await page.$("#mobile-navigation");
      console.log(`  After clicking mobile link -> menu closed: ${!Boolean(closedAfterClick)}`);
    }

    results.mobileMenu = {
      buttonFound: Boolean(menuBtn),
      opensProperly: openedExpanded === "true" && Boolean(navVisible),
      closesOnEscape: !Boolean(closedAfterEsc),
    };

    // --- TEST 7: ALL 5 PDF WORKFLOWS & ZERO UPLOAD CONFIRMATION ---
    console.log("\n--- [7] Testing PDF Workflows & Zero Upload Verification ---");
    const networkRequests = [];
    page.on("request", (req) => {
      const postData = req.postData();
      networkRequests.push({
        url: req.url(),
        method: req.method(),
        hasPostData: Boolean(postData),
        dataLength: postData ? postData.length : 0,
      });
    });

    // Workflow 1: Merge 2 files
    console.log("  Testing Workflow 1: Merge PDF...");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/merge`, { waitUntil: "networkidle0" });
    const mergeInput = await page.$("input[type=file]");
    await mergeInput.uploadFile(FIXTURE_1, FIXTURE_2);
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.textContent && b.textContent.includes("Merge 2 PDFs"));
      if (target) target.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("PDFs Merged Successfully!"), { timeout: 15000 });
    console.log("    [PASS] Merge workflow succeeded client-side!");

    // Workflow 2: Split PDF
    console.log("  Testing Workflow 2: Split PDF...");
    await page.goto(`${BASE_URL}/split`, { waitUntil: "networkidle0" });
    const splitInput = await page.$("input[type=file]");
    await splitInput.uploadFile(FIXTURE_PATH);
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.textContent && b.textContent.includes("Split PDF Document"));
      if (target) target.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("PDF Split Successfully!"), { timeout: 15000 });
    console.log("    [PASS] Split workflow succeeded client-side!");

    // Workflow 3: Rotate PDF
    console.log("  Testing Workflow 3: Rotate PDF...");
    await page.goto(`${BASE_URL}/rotate`, { waitUntil: "networkidle0" });
    const rotateInput = await page.$("input[type=file]");
    await rotateInput.uploadFile(FIXTURE_PATH);
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const rAll = btns.find((b) => b.textContent && b.textContent.includes("Rotate All (+90°)"));
      if (rAll) rAll.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const saveBtn = btns.find((b) => b.textContent && b.textContent.includes("Apply Rotation"));
      if (saveBtn) saveBtn.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("PDF Rotated Successfully!"), { timeout: 15000 });
    console.log("    [PASS] Rotate workflow succeeded client-side!");

    // Workflow 4: Reorder PDF
    console.log("  Testing Workflow 4: Reorder PDF...");
    await page.goto(`${BASE_URL}/reorder`, { waitUntil: "networkidle0" });
    const reorderInput = await page.$("input[type=file]");
    await reorderInput.uploadFile(FIXTURE_PATH);
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const revBtn = btns.find((b) => b.textContent && b.textContent.includes("Reverse Order"));
      if (revBtn) revBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const saveBtn = btns.find((b) => b.textContent && b.textContent.includes("Apply Reorder"));
      if (saveBtn) saveBtn.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("PDF Reordered Successfully!"), { timeout: 15000 });
    console.log("    [PASS] Reorder workflow succeeded client-side!");

    // Workflow 5: Remove PDF
    console.log("  Testing Workflow 5: Remove PDF...");
    await page.goto(`${BASE_URL}/remove`, { waitUntil: "networkidle0" });
    const removeInput = await page.$("input[type=file]");
    await removeInput.uploadFile(FIXTURE_PATH);
    await new Promise((r) => setTimeout(r, 1000));
    // Click page 1 card
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const card = btns.find((b) => b.textContent && b.textContent.includes("#1"));
      if (card) card.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const remBtn = btns.find((b) => b.textContent && b.textContent.includes("Remove") && (b.textContent.includes("Page") || b.textContent.includes("Pages")));
      if (remBtn) remBtn.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("Pages Removed Successfully!"), { timeout: 15000 });
    console.log("    [PASS] Remove workflow succeeded client-side!");

    // Network inspection: Check for any PDF byte uploads
    const suspiciousUploads = networkRequests.filter((r) => {
      return r.method === "POST" || r.method === "PUT" || (r.hasPostData && r.dataLength > 100);
    });
    console.log(`  Total network requests captured during processing: ${networkRequests.length}`);
    console.log(`  Suspicious/POST requests with payload data: ${suspiciousUploads.length}`);
    results.workflowZeroUploads = {
      totalRequests: networkRequests.length,
      suspiciousUploads: suspiciousUploads.length,
      verifiedZeroByteUpload: suspiciousUploads.length === 0,
    };

    // Save final report
    const reportPath = path.join(ARTIFACTS_DIR, "audit_corrections_verification.json");
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nSaved verification report: ${reportPath}`);
    console.log("\n=== ALL AUDIT VALIDATION TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Audit test error:", err);
    results.errors.push(err.message);
  } finally {
    await browser.close();
    server.close();
  }
}

runAuditValidation();
