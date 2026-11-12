/**
 * Empirical Fidelity & Performance Test Runner for In-Browser PDF Engine
 */

const fs = require("fs");
const path = require("path");
const { PDFDocument, degrees } = require("pdf-lib");
const JSZip = require("jszip");

const FIXTURES_DIR = path.resolve(__dirname, "../../../test_fixtures_fidelity");
const OUTPUT_DIR = path.join(FIXTURES_DIR, "client_outputs");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runFidelityTests() {
  console.log("=== RUNNING FIDELITY & LIMITATION TESTS ===");
  const results = {};

  // 1. MERGE: Multiple inputs (Annots + Mixed orientations)
  console.log("\n[1/8] Testing Merge with Annotations & Mixed Orientations...");
  const t0 = Date.now();
  const annotsBuf = fs.readFileSync(path.join(FIXTURES_DIR, "annotations_links.pdf"));
  const mixedBuf = fs.readFileSync(path.join(FIXTURES_DIR, "mixed_orientations.pdf"));

  const docAnnots = await PDFDocument.load(annotsBuf);
  const docMixed = await PDFDocument.load(mixedBuf);

  const mergedDoc = await PDFDocument.create();
  const pages1 = await mergedDoc.copyPages(docAnnots, [0, 1, 2]);
  pages1.forEach((p) => mergedDoc.addPage(p));
  const pages2 = await mergedDoc.copyPages(docMixed, [0, 1, 2, 3]);
  pages2.forEach((p) => mergedDoc.addPage(p));

  const mergeBytes = await mergedDoc.save();
  fs.writeFileSync(path.join(OUTPUT_DIR, "merged_output.pdf"), mergeBytes);
  const mergeDuration = Date.now() - t0;
  console.log(`  Merge completed in ${mergeDuration}ms. Output: ${mergeBytes.length} bytes.`);
  results.merge = { timeMs: mergeDuration, bytes: mergeBytes.length };

  // 2. SPLIT: Annotations PDF range 1-2
  console.log("\n[2/8] Testing Split (Range 1-2 from 3 pages)...");
  const t1 = Date.now();
  const splitDoc = await PDFDocument.create();
  const splitPages = await splitDoc.copyPages(docAnnots, [0, 1]);
  splitPages.forEach((p) => splitDoc.addPage(p));
  const splitBytes = await splitDoc.save();
  fs.writeFileSync(path.join(OUTPUT_DIR, "split_output.pdf"), splitBytes);
  const splitDuration = Date.now() - t1;
  console.log(`  Split completed in ${splitDuration}ms. Output: ${splitBytes.length} bytes.`);
  results.split = { timeMs: splitDuration, bytes: splitBytes.length };

  // 3. ROTATE: Mixed Orientations PDF (add 90 to each)
  console.log("\n[3/8] Testing Rotate on Mixed Orientations...");
  const t2 = Date.now();
  const rotateDoc = await PDFDocument.load(mixedBuf);
  rotateDoc.getPages().forEach((p) => {
    const cur = p.getRotation().angle;
    p.setRotation(degrees((cur + 90) % 360));
  });
  const rotateBytes = await rotateDoc.save();
  fs.writeFileSync(path.join(OUTPUT_DIR, "rotate_output.pdf"), rotateBytes);
  const rotateDuration = Date.now() - t2;
  console.log(`  Rotate completed in ${rotateDuration}ms. Output: ${rotateBytes.length} bytes.`);
  results.rotate = { timeMs: rotateDuration, bytes: rotateBytes.length };

  // 4. REORDER: Permute [3, 1, 2] (0-based [2, 0, 1])
  console.log("\n[4/8] Testing Reorder on Annotations PDF...");
  const t3 = Date.now();
  const reorderDoc = await PDFDocument.create();
  const reorderPages = await reorderDoc.copyPages(docAnnots, [2, 0, 1]);
  reorderPages.forEach((p) => reorderDoc.addPage(p));
  const reorderBytes = await reorderDoc.save();
  fs.writeFileSync(path.join(OUTPUT_DIR, "reorder_output.pdf"), reorderBytes);
  const reorderDuration = Date.now() - t3;
  console.log(`  Reorder completed in ${reorderDuration}ms. Output: ${reorderBytes.length} bytes.`);
  results.reorder = { timeMs: reorderDuration, bytes: reorderBytes.length };

  // 5. REMOVE: Remove page 2 (keep 1 and 3)
  console.log("\n[5/8] Testing Remove (Remove page 2 from 3 pages)...");
  const t4 = Date.now();
  const removeDoc = await PDFDocument.create();
  const removePages = await removeDoc.copyPages(docAnnots, [0, 2]);
  removePages.forEach((p) => removeDoc.addPage(p));
  const removeBytes = await removeDoc.save();
  fs.writeFileSync(path.join(OUTPUT_DIR, "remove_output.pdf"), removeBytes);
  const removeDuration = Date.now() - t4;
  console.log(`  Remove completed in ${removeDuration}ms. Output: ${removeBytes.length} bytes.`);
  results.remove = { timeMs: removeDuration, bytes: removeBytes.length };

  // 6. ENCRYPTION REJECTION TEST
  console.log("\n[6/8] Testing Encrypted PDF Detection & Rejection...");
  const encBuf = fs.readFileSync(path.join(FIXTURES_DIR, "encrypted_protected.pdf"));
  let encryptionBlocked = false;
  try {
    // Note: NEVER pass ignoreEncryption: true
    await PDFDocument.load(encBuf);
  } catch (err) {
    if (err.message.toLowerCase().includes("encrypt") || err.message.toLowerCase().includes("password")) {
      encryptionBlocked = true;
      console.log(`  [PASS] Encrypted PDF caught cleanly: "${err.message.substring(0, 60)}..."`);
    } else {
      console.log(`  [WARNING] Unexpected error: ${err.message}`);
    }
  }
  results.encryptionBlocked = encryptionBlocked;

  // 7. CORRUPTED PDF DEFENSE TEST
  console.log("\n[7/8] Testing Corrupted PDF Defense...");
  const corruptBuf = fs.readFileSync(path.join(FIXTURES_DIR, "corrupted.pdf"));
  let corruptionCaught = false;
  try {
    await PDFDocument.load(corruptBuf);
  } catch (err) {
    corruptionCaught = true;
    console.log(`  [PASS] Corrupted file rejected cleanly: "${err.message.substring(0, 60)}..."`);
  }
  results.corruptionCaught = corruptionCaught;

  // 8. LARGE MULTI-PAGE BENCHMARK (60 pages)
  console.log("\n[8/8] Testing Large Document Handling (60 pages)...");
  const largeBuf = fs.readFileSync(path.join(FIXTURES_DIR, "large_60pages.pdf"));
  const t5 = Date.now();
  const largeDoc = await PDFDocument.load(largeBuf);
  console.log(`  Loaded 60 pages in ${Date.now() - t5}ms`);
  const t6 = Date.now();
  // Rotate all 60 pages
  largeDoc.getPages().forEach((p) => p.setRotation(degrees(90)));
  const largeRotBytes = await largeDoc.save();
  const largeDuration = Date.now() - t6;
  console.log(`  Rotated and saved 60 pages in ${largeDuration}ms (Size: ${largeRotBytes.length} bytes).`);
  results.largeFile = { pages: 60, timeMs: largeDuration, bytes: largeRotBytes.length };

  fs.writeFileSync(path.join(OUTPUT_DIR, "fidelity_results.json"), JSON.stringify(results, null, 2));
  console.log("\nAll fidelity executions completed successfully!");
}

runFidelityTests().catch((err) => {
  console.error("Fidelity run failed:", err);
  process.exit(1);
});
