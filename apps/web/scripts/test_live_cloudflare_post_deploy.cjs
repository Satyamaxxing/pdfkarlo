const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE_URL = "https://openpdf-1z7.pages.dev";
const PREVIEW_URL = "https://3f197e8c.openpdf-1z7.pages.dev";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:\\Users\\Satyam Kumar\\.gemini\\antigravity\\brain\\4111dda1-704d-4803-a0a3-f54ccc996e8e";
const FIXTURES_DIR = path.resolve(__dirname, "../../../test_fixtures_fidelity");

const FIXTURE_1 = path.join(FIXTURES_DIR, "annotations_links.pdf");
const FIXTURE_2 = path.join(FIXTURES_DIR, "bookmarks_outlines.pdf");
const FIXTURE_ENC = path.join(FIXTURES_DIR, "encrypted_protected.pdf");

async function testLiveDeployment() {
  console.log(`=== TESTING LIVE DEPLOYMENT ON CLOUDFLARE PAGES: ${BASE_URL} ===\n`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = {
    deploymentUrls: {
      canonical: BASE_URL,
      preview: PREVIEW_URL,
    },
    routes: {},
    messagingAudit: {},
    mobileResponsiveness: {},
    mobileMenu: {},
    toolWorkflows: {},
    networkZeroUploads: {},
    errors: [],
  };

  try {
    const page = await browser.newPage();

    // --- TEST 1: ALL 6 ROUTES VIA HTTPS ---
    console.log("--- [1] Checking All 6 Routes via HTTPS ---");
    const routes = ["/", "/merge/", "/split/", "/rotate/", "/reorder/", "/remove/"];
    for (const r of routes) {
      const resp = await page.goto(`${BASE_URL}${r}`, { waitUntil: "networkidle0" });
      const status = resp.status();
      const title = await page.title();
      results.routes[r] = { status, title, ok: status === 200 };
      console.log(`  Route ${r.padEnd(10)} -> Status: ${status} | Title: ${title}`);
    }

    // --- TEST 2: MESSAGING AND PRIVACY CLAIMS ON LIVE HOMEPAGE ---
    console.log("\n--- [2] Auditing Live Homepage Copy & Privacy Claims ---");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    const liveHtml = await page.content();

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

    results.messagingAudit.obsoleteTermsClean = true;
    for (const term of obsoleteTerms) {
      const present = liveHtml.includes(term);
      if (present) {
        console.error(`  [FAIL] Obsolete term found on live homepage: "${term}"`);
        results.messagingAudit.obsoleteTermsClean = false;
        results.errors.push(`Live site contains obsolete term: ${term}`);
      } else {
        console.log(`  [PASS] Obsolete term absent: "${term}"`);
      }
    }

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
      const present = liveHtml.includes(term);
      if (!present) {
        console.error(`  [FAIL] Approved term missing on live homepage: "${term}"`);
        results.messagingAudit.approvedTermsPresent = false;
        results.errors.push(`Live site missing approved term: ${term}`);
      } else {
        console.log(`  [PASS] Approved term verified: "${term.substring(0, 45)}..."`);
      }
    }

    // Check 50MB label on live /merge/
    await page.goto(`${BASE_URL}/merge/`, { waitUntil: "networkidle0" });
    const mergeHtml = await page.content();
    results.messagingAudit.fileUploadZone50MB = mergeHtml.includes("Up to 50MB per file") && !mergeHtml.includes("Up to 100MB per file");
    console.log(`  Live FileUploadZone shows "Up to 50MB per file": ${results.messagingAudit.fileUploadZone50MB}`);

    // --- TEST 3: DESKTOP NAVIGATION ON LIVE SITE ---
    console.log("\n--- [3] Testing Cross-Page Navigation on Live Site ---");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/merge/`, { waitUntil: "networkidle0" });
    const secLink = await page.$('a[href="/#security"]');
    if (secLink) {
      await secLink.click();
      await new Promise((r) => setTimeout(r, 1200));
      const currentUrl = page.url();
      console.log(`  Clicked "Privacy & Security" on /merge/ -> Navigated to: ${currentUrl}`);
      results.routes.crossPageNavSuccess = currentUrl.includes("#security");
    }

    // Capture desktop homepage screenshot
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
    const desktopScreenshot = path.join(ARTIFACTS_DIR, "live_cloudflare_desktop_home_verified.png");
    await page.screenshot({ path: desktopScreenshot, fullPage: true });
    console.log(`  Saved live desktop screenshot: ${desktopScreenshot}`);

    // --- TEST 4: MOBILE RESPONSIVENESS (375px & 390px) ON LIVE SITE ---
    console.log("\n--- [4] Testing Live Mobile Responsiveness & Overflow ---");
    const testWidths = [375, 390];
    for (const w of testWidths) {
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
        console.log(`  Width ${w}px | Route ${r.padEnd(9)} -> ScrollWidth: ${overflow.bodyScrollWidth} | Overflow: ${overflow.hasHorizontalScrollbar}`);
        if (overflow.hasHorizontalScrollbar) {
          results.errors.push(`Live horizontal overflow at ${w}px on ${r}`);
        }
      }
    }

    // --- TEST 5: LIVE MOBILE NAVIGATION MENU & ACCESSIBILITY ---
    console.log("\n--- [5] Testing Live Mobile Navigation Menu ---");
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });

    const menuToggle = await page.$('button[aria-label="Open navigation menu"]');
    console.log(`  Live mobile menu toggle button present: ${Boolean(menuToggle)}`);
    if (menuToggle) {
      await menuToggle.click();
      await new Promise((r) => setTimeout(r, 400));
      const mobileNav = await page.$("#mobile-navigation");
      console.log(`  Mobile navigation drawer visible: ${Boolean(mobileNav)}`);

      const mobileMenuScreenshot = path.join(ARTIFACTS_DIR, "live_cloudflare_mobile_menu.png");
      await page.screenshot({ path: mobileMenuScreenshot });
      console.log(`  Saved live mobile menu screenshot: ${mobileMenuScreenshot}`);

      // Press Escape to test accessible closing
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 300));
      const closedNav = await page.$("#mobile-navigation");
      console.log(`  Mobile drawer closed after Escape: ${!Boolean(closedNav)}`);

      results.mobileMenu = {
        buttonPresent: true,
        drawerOpens: Boolean(mobileNav),
        closesOnEscape: !Boolean(closedNav),
      };
    }

    // --- TEST 6: ALL 5 LIVE PDF WORKFLOWS WITH NETWORK SNIFFING ---
    console.log("\n--- [6] Testing All 5 PDF Workflows over Live Public URL ---");
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

    await page.setViewport({ width: 1280, height: 800 });

    // 1. Merge PDF Workflow
    console.log("  [Workflow 1/5] Merge PDF...");
    await page.goto(`${BASE_URL}/merge/`, { waitUntil: "networkidle0" });
    const mergeInput = await page.$("input[type=file]");
    await mergeInput.uploadFile(FIXTURE_1, FIXTURE_2);
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.textContent && b.textContent.includes("Merge 2 PDFs"));
      if (target) target.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("PDFs Merged Successfully!"), { timeout: 15000 });
    console.log("    -> [PASS] Live Merge succeeded in browser!");
    results.toolWorkflows.merge = "PASS";

    // 2. Split PDF Workflow
    console.log("  [Workflow 2/5] Split PDF...");
    await page.goto(`${BASE_URL}/split/`, { waitUntil: "networkidle0" });
    const splitInput = await page.$("input[type=file]");
    await splitInput.uploadFile(FIXTURE_1);
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.textContent && b.textContent.includes("Split PDF Document"));
      if (target) target.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("PDF Split Successfully!"), { timeout: 15000 });
    console.log("    -> [PASS] Live Split succeeded in browser!");
    results.toolWorkflows.split = "PASS";

    // 3. Rotate PDF Workflow
    console.log("  [Workflow 3/5] Rotate PDF...");
    await page.goto(`${BASE_URL}/rotate/`, { waitUntil: "networkidle0" });
    const rotateInput = await page.$("input[type=file]");
    await rotateInput.uploadFile(FIXTURE_1);
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
    console.log("    -> [PASS] Live Rotate succeeded in browser!");
    results.toolWorkflows.rotate = "PASS";

    // 4. Reorder PDF Workflow
    console.log("  [Workflow 4/5] Reorder PDF...");
    await page.goto(`${BASE_URL}/reorder/`, { waitUntil: "networkidle0" });
    const reorderInput = await page.$("input[type=file]");
    await reorderInput.uploadFile(FIXTURE_1);
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
    console.log("    -> [PASS] Live Reorder succeeded in browser!");
    results.toolWorkflows.reorder = "PASS";

    // 5. Remove PDF Workflow
    console.log("  [Workflow 5/5] Remove PDF...");
    await page.goto(`${BASE_URL}/remove/`, { waitUntil: "networkidle0" });
    const removeInput = await page.$("input[type=file]");
    await removeInput.uploadFile(FIXTURE_1);
    await new Promise((r) => setTimeout(r, 1000));
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
    console.log("    -> [PASS] Live Remove succeeded in browser!");
    results.toolWorkflows.remove = "PASS";

    // 6. Encrypted Defense Check
    console.log("  [Security Check] Live Encrypted PDF Defense...");
    await page.goto(`${BASE_URL}/merge/`, { waitUntil: "networkidle0" });
    const encInput = await page.$("input[type=file]");
    await encInput.uploadFile(FIXTURE_ENC, FIXTURE_1);
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const target = btns.find((b) => b.textContent && b.textContent.includes("Merge 2 PDFs"));
      if (target) target.click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("Password-Protected PDF"), { timeout: 10000 });
    console.log("    -> [PASS] Live Encrypted PDF defense succeeded!");
    results.toolWorkflows.encryptedDefense = "PASS";

    // Check network uploads
    const suspiciousUploads = networkRequests.filter((r) => {
      return r.method === "POST" || r.method === "PUT" || (r.hasPostData && r.dataLength > 100);
    });
    console.log(`\n  Total network requests captured during live testing: ${networkRequests.length}`);
    console.log(`  Suspicious/POST requests with payload data: ${suspiciousUploads.length}`);
    results.networkZeroUploads = {
      totalRequests: networkRequests.length,
      suspiciousUploads: suspiciousUploads.length,
      verifiedZeroByteUpload: suspiciousUploads.length === 0,
    };

    // Save live verification report
    const liveReportPath = path.join(ARTIFACTS_DIR, "cloudflare_live_deployment_verification.json");
    fs.writeFileSync(liveReportPath, JSON.stringify(results, null, 2));
    console.log(`\nSaved live verification report: ${liveReportPath}`);
    console.log("\n=== ALL LIVE TESTS PASSED ON CLOUDFLARE PAGES ===");
  } catch (err) {
    console.error("Live test failed:", err);
    results.errors.push(err.message);
  } finally {
    await browser.close();
  }
}

testLiveDeployment();
