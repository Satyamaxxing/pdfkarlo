const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const PROD_URL = "https://openpdf-1z7.pages.dev";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FIXTURES_DIR = path.resolve(__dirname, "../../../test_fixtures_fidelity");

const FIXTURE_1 = path.join(FIXTURES_DIR, "annotations_links.pdf");
const FIXTURE_2 = path.join(FIXTURES_DIR, "bookmarks_outlines.pdf");

async function checkStatusCodes() {
  const routes = ["", "merge/", "split/", "rotate/", "reorder/", "remove/", "pdf.worker.min.mjs"];
  const statusResults = {};

  for (const r of routes) {
    const u = `${PROD_URL}/${r}`;
    try {
      const res = await fetch(u, { method: "HEAD" });
      statusResults[r || "home"] = res.status;
    } catch (e) {
      statusResults[r || "home"] = e.message;
    }
  }
  return statusResults;
}

async function runLiveSmokeTests() {
  console.log("=== CHECKING PRODUCTION STATUS CODES ===");
  const statusCodes = await checkStatusCodes();
  console.log("Status codes:", statusCodes);

  console.log("\n=== RUNNING LIVE BROWSER SMOKE TESTS ON https://openpdf-1z7.pages.dev ===");
  const report = {
    url: PROD_URL,
    statusCodes,
    tools: {},
    mobile: null,
    overflow: null,
    networkPrivacyConfirmed: true,
    externalUploadsLogged: [],
  };

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // 1. Homepage & Overflow
    console.log("Testing Homepage...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(`${PROD_URL}/`, { waitUntil: "networkidle0" });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      report.overflow = !overflow;
      console.log(`Homepage loaded. Horizontal overflow detected: ${overflow}`);
      await page.close();
    }

    // 2. Mobile navigation & layout (375px)
    console.log("Testing Mobile navigation (375px)...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
      await page.goto(`${PROD_URL}/`, { waitUntil: "networkidle0" });

      const menuBtn = await page.$("button[aria-label='Toggle menu']");
      if (menuBtn) {
        await menuBtn.click();
        await new Promise((r) => setTimeout(r, 400));
        const menuVisible = await page.evaluate(() => document.body.innerText.includes("Merge PDF"));
        report.mobile = { menuWorking: menuVisible };
        console.log(`Mobile menu opened: ${menuVisible}`);
      }
      await page.close();
    }

    // Monitor external requests for PDF leak check
    const setupPrivacyMonitor = (page) => {
      page.on("request", (req) => {
        const u = req.url();
        const postData = req.postData();
        // Check if PDF bytes or non-Cloudflare/local requests occur
        if (req.method() === "POST" && !u.startsWith(PROD_URL)) {
          report.networkPrivacyConfirmed = false;
          report.externalUploadsLogged.push({ url: u, method: req.method() });
        }
      });
    };

    // 3. Tool 1: Rotate PDF
    console.log("Testing Tool 1: Rotate PDF live...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      setupPrivacyMonitor(page);
      await page.goto(`${PROD_URL}/rotate/`, { waitUntil: "networkidle0" });

      const fileInput = await page.$("input[type=file]");
      await fileInput.uploadFile(FIXTURE_1);

      await page.waitForSelector("img[alt*='Thumbnail']", { timeout: 20000 });
      console.log("Live Rotate: Real thumbnails rendered via PDF.js worker.");

      const cwBtn = await page.$("button[title*='Rotate +90']");
      if (cwBtn) await cwBtn.click();
      await new Promise((r) => setTimeout(r, 300));

      const applyBtn = await page.waitForSelector("button::-p-text(Apply Rotation & Save PDF)");
      await applyBtn.click();

      await page.waitForFunction(() => document.body.innerText.includes("Rotated Successfully"), { timeout: 20000 });
      console.log("Live Rotate: Processing succeeded!");
      report.tools.rotate = "PASS";
      await page.close();
    }

    // 4. Tool 2: Reorder PDF
    console.log("Testing Tool 2: Reorder PDF live...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      setupPrivacyMonitor(page);
      await page.goto(`${PROD_URL}/reorder/`, { waitUntil: "networkidle0" });

      const fileInput = await page.$("input[type=file]");
      await fileInput.uploadFile(FIXTURE_1);

      await page.waitForSelector("img[alt*='Thumbnail']", { timeout: 20000 });
      console.log("Live Reorder: Real thumbnails rendered.");

      const revBtn = await page.waitForSelector("button::-p-text(Reverse Order)");
      await revBtn.click();
      await new Promise((r) => setTimeout(r, 400));

      const applyBtn = await page.waitForSelector("button::-p-text(Apply Reorder & Save PDF)");
      await applyBtn.click();

      await page.waitForFunction(() => document.body.innerText.includes("Reordered Successfully"), { timeout: 20000 });
      console.log("Live Reorder: Processing succeeded!");
      report.tools.reorder = "PASS";
      await page.close();
    }

    // 5. Tool 3: Remove PDF
    console.log("Testing Tool 3: Remove PDF live...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      setupPrivacyMonitor(page);
      await page.goto(`${PROD_URL}/remove/`, { waitUntil: "networkidle0" });

      const fileInput = await page.$("input[type=file]");
      await fileInput.uploadFile(FIXTURE_1);

      await page.waitForSelector("img[alt*='Thumbnail']", { timeout: 20000 });
      console.log("Live Remove: Real thumbnails rendered.");

      const removeBtns = await page.$$("button::-p-text(Mark for Removal)");
      if (removeBtns.length > 1) {
        await removeBtns[1].click();
        await new Promise((r) => setTimeout(r, 400));
      }

      const applyBtn = await page.waitForSelector("button::-p-text(Remove 1 Page)");
      await applyBtn.click();

      await page.waitForFunction(() => document.body.innerText.includes("Removed Successfully"), { timeout: 20000 });
      console.log("Live Remove: Processing succeeded!");
      report.tools.remove = "PASS";
      await page.close();
    }

    // 6. Tool 4: Split PDF
    console.log("Testing Tool 4: Split PDF live...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      setupPrivacyMonitor(page);
      await page.goto(`${PROD_URL}/split/`, { waitUntil: "networkidle0" });

      const fileInput = await page.$("input[type=file]");
      await fileInput.uploadFile(FIXTURE_1);

      await page.waitForSelector("img[alt*='Thumbnail']", { timeout: 20000 });
      console.log("Live Split: Real thumbnails rendered.");

      const burstTab = await page.waitForSelector("button::-p-text(Extract Every Page (Burst))");
      await burstTab.click();
      await new Promise((r) => setTimeout(r, 400));

      const applyBtn = await page.waitForSelector("button::-p-text(Extract Every Page (ZIP))");
      await applyBtn.click();

      await page.waitForFunction(() => document.body.innerText.includes("Split Successfully"), { timeout: 20000 });
      console.log("Live Split: Burst ZIP processing succeeded!");
      report.tools.split = "PASS";
      await page.close();
    }

    // 7. Tool 5: Merge PDF
    console.log("Testing Tool 5: Merge PDF live...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      setupPrivacyMonitor(page);
      await page.goto(`${PROD_URL}/merge/`, { waitUntil: "networkidle0" });

      const fileInput = await page.$("input[type=file]");
      await fileInput.uploadFile(FIXTURE_1, FIXTURE_2);

      await page.waitForSelector("img[alt*='Thumbnail']", { timeout: 25000 });
      console.log("Live Merge: Real thumbnails from all uploaded documents rendered.");

      // Check Unified Sequence contains Doc #1 and Doc #2
      const multiDocPages = await page.waitForFunction(
        () => document.body.innerText.includes("Doc #1") && document.body.innerText.includes("Doc #2"),
        { timeout: 10000 }
      );
      console.log("Live Merge: Verified pages from EVERY uploaded document appear in workspace!");

      const applyBtn = await page.waitForSelector("button::-p-text(Merge 2 PDFs)");
      await applyBtn.click();

      await page.waitForFunction(() => document.body.innerText.includes("Merged Successfully"), { timeout: 20000 });
      console.log("Live Merge: Processing succeeded!");
      report.tools.merge = "PASS";
      await page.close();
    }

    console.log("\n=== FINAL SMOKE TEST SUMMARY ===");
    console.log(JSON.stringify(report, null, 2));

    fs.writeFileSync(
      path.resolve(__dirname, "../../../FINAL_LIVE_SMOKE_REPORT.json"),
      JSON.stringify(report, null, 2)
    );
  } catch (err) {
    console.error("Live test failure:", err);
    report.error = err.message;
  } finally {
    await browser.close();
  }
}

runLiveSmokeTests();
