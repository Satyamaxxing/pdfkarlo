const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE_URL = process.env.BASE_URL || "https://pdfkarlo.pages.dev";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = "C:\\Users\\Satyam Kumar\\.gemini\\antigravity\\brain\\4111dda1-704d-4803-a0a3-f54ccc996e8e";
const FIXTURES_DIR = path.resolve(__dirname, "../../../test_fixtures_fidelity");

const FIXTURE_1 = path.join(FIXTURES_DIR, "annotations_links.pdf");
const FIXTURE_2 = path.join(FIXTURES_DIR, "bookmarks_outlines.pdf");

async function capturePostUploadWorkspaces() {
  console.log("=== CAPTURING POST-UPLOAD WORKSPACE STATE FOR ALL 5 TOOLS ===");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const tools = [
    { name: "merge", url: `${BASE_URL}/merge/`, multi: true },
    { name: "split", url: `${BASE_URL}/split/`, multi: false },
    { name: "rotate", url: `${BASE_URL}/rotate/`, multi: false },
    { name: "reorder", url: `${BASE_URL}/reorder/`, multi: false },
    { name: "remove", url: `${BASE_URL}/remove/`, multi: false },
  ];

  try {
    for (const tool of tools) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(tool.url, { waitUntil: "networkidle0" });

      const fileInput = await page.$("input[type=file]");
      if (fileInput) {
        if (tool.multi) {
          await fileInput.uploadFile(FIXTURE_1, FIXTURE_2);
        } else {
          await fileInput.uploadFile(FIXTURE_1);
        }
        await new Promise((r) => setTimeout(r, 1500));

        const screenshotPath = path.join(ARTIFACTS_DIR, `v1_post_upload_${tool.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Saved screenshot for ${tool.name}: ${screenshotPath}`);
      }
      await page.close();
    }
    console.log("=== ALL POST-UPLOAD SCREENSHOTS CAPTURED ===");
  } catch (err) {
    console.error("Capture error:", err);
  } finally {
    await browser.close();
  }
}

capturePostUploadWorkspaces();
