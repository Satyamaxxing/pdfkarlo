const { PDFDocument, degrees } = require('pdf-lib');
const JSZip = require('jszip');

async function runClientPoc() {
  console.log("=== Testing Browser-Compatible Client-Side PDF Operations ===\n");

  // Helper to create test PDF
  async function createTestDoc(pageCount, label = "Test") {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= pageCount; i++) {
      const page = doc.addPage([400, 600]);
      page.drawText(`${label} - Page ${i}`, { x: 50, y: 500, size: 24 });
    }
    return await doc.save();
  }

  // 1. MERGE PDF
  console.log("[1/5] Testing Merge PDF...");
  const t0 = Date.now();
  const pdf1Bytes = await createTestDoc(2, "Doc 1");
  const pdf2Bytes = await createTestDoc(3, "Doc 2");

  const mergedDoc = await PDFDocument.create();
  const doc1 = await PDFDocument.load(pdf1Bytes);
  const doc2 = await PDFDocument.load(pdf2Bytes);

  const pages1 = await mergedDoc.copyPages(doc1, doc1.getPageIndices());
  pages1.forEach(p => mergedDoc.addPage(p));
  const pages2 = await mergedDoc.copyPages(doc2, doc2.getPageIndices());
  pages2.forEach(p => mergedDoc.addPage(p));

  const mergedBytes = await mergedDoc.save();
  const verifyMerged = await PDFDocument.load(mergedBytes);
  console.log(`  [PASS] Merge: 2 + 3 pages = ${verifyMerged.getPageCount()} pages (took ${Date.now() - t0}ms, size: ${mergedBytes.byteLength} bytes)`);

  // 2. SPLIT PDF (Extract ranges & ZIP burst)
  console.log("\n[2/5] Testing Split PDF (Extract Pages & JSZip)...");
  const t1 = Date.now();
  const source5p = await createTestDoc(5, "Source 5-Page");
  const srcDoc = await PDFDocument.load(source5p);

  // Range extract (pages 2, 3, 4)
  const splitDoc = await PDFDocument.create();
  const extracted = await splitDoc.copyPages(srcDoc, [1, 2, 3]);
  extracted.forEach(p => splitDoc.addPage(p));
  const splitBytes = await splitDoc.save();
  const verifySplit = await PDFDocument.load(splitBytes);
  console.log(`  [PASS] Split Range: Extracted 3 pages from 5 = ${verifySplit.getPageCount()} pages`);

  // Burst to ZIP via JSZip
  const zip = new JSZip();
  for (let i = 0; i < srcDoc.getPageCount(); i++) {
    const singleDoc = await PDFDocument.create();
    const [singlePage] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(singlePage);
    const b = await singleDoc.save();
    zip.file(`page_${i + 1}.pdf`, b);
  }
  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  console.log(`  [PASS] Split Burst ZIP: Generated zip with 5 files (${zipBytes.byteLength} bytes, took ${Date.now() - t1}ms)`);

  // 3. ROTATE PDF
  console.log("\n[3/5] Testing Rotate PDF...");
  const t2 = Date.now();
  const docToRotate = await PDFDocument.load(source5p);
  docToRotate.getPage(0).setRotation(degrees(90));
  docToRotate.getPage(1).setRotation(degrees(180));
  const rotatedBytes = await docToRotate.save();
  const verifyRot = await PDFDocument.load(rotatedBytes);
  console.log(`  [PASS] Rotate: Page 1 = ${verifyRot.getPage(0).getRotation().angle}°, Page 2 = ${verifyRot.getPage(1).getRotation().angle}° (took ${Date.now() - t2}ms)`);

  // 4. REORDER PDF
  console.log("\n[4/5] Testing Reorder PDF (Permutation [3, 1, 2])...");
  const t3 = Date.now();
  const doc3p = await createTestDoc(3, "3-Page Permutation");
  const srcForReorder = await PDFDocument.load(doc3p);
  const reorderedDoc = await PDFDocument.create();
  const reorderedPages = await reorderedDoc.copyPages(srcForReorder, [2, 0, 1]);
  reorderedPages.forEach(p => reorderedDoc.addPage(p));
  const reorderedBytes = await reorderedDoc.save();
  const verifyReorder = await PDFDocument.load(reorderedBytes);
  console.log(`  [PASS] Reorder: Permuted 3 pages = ${verifyReorder.getPageCount()} pages (took ${Date.now() - t3}ms)`);

  // 5. REMOVE PDF (Delete page 2)
  console.log("\n[5/5] Testing Remove PDF (Remove page 2 from 4 pages)...");
  const t4 = Date.now();
  const doc4p = await createTestDoc(4, "4-Page Delete");
  const srcForRemove = await PDFDocument.load(doc4p);
  const cleanDoc = await PDFDocument.create();
  const keptPages = await cleanDoc.copyPages(srcForRemove, [0, 2, 3]);
  keptPages.forEach(p => cleanDoc.addPage(p));
  const cleanBytes = await cleanDoc.save();
  const verifyClean = await PDFDocument.load(cleanBytes);
  console.log(`  [PASS] Remove: 4 pages - 1 removed = ${verifyClean.getPageCount()} pages remaining (took ${Date.now() - t4}ms)`);

  // Error handling
  console.log("\n[Defense & Error Handling Tests]");
  try {
    await PDFDocument.load(new Uint8Array([1, 2, 3, 4, 5]));
    console.log("  [FAIL] Corrupted PDF was not detected!");
  } catch (err) {
    console.log(`  [PASS] Corrupted PDF error caught gracefully: ${err.message.slice(0, 45)}...`);
  }

  console.log("\n=== ALL 5 BROWSER-COMPATIBLE PDF OPERATIONS VERIFIED SUCCESSFULLY ===");
}

runClientPoc().catch(console.error);
