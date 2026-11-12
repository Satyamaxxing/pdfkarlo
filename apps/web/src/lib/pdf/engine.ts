/**
 * Client-Side PDF Processing Engine
 * Implements Merge, Split, Rotate, Reorder, and Remove PDF operations
 * using pdf-lib and JSZip in-memory without uploading files to any server.
 */

import { PDFDocument, degrees } from "pdf-lib";
import JSZip from "jszip";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_PAGES,
  EncryptedPdfError,
  CorruptedPdfError,
  FileSizeLimitError,
  PageCountLimitError,
  InvalidOperationError,
  ProcessedOutput,
  ProgressCallback,
  MergeOptions,
  SplitOptions,
  RotateOptions,
  ReorderOptions,
  RemoveOptions,
  SplitRangeSpec,
} from "./types";

/**
 * Validates basic buffer safety (size and PDF magic bytes).
 */
export function validatePdfBuffer(name: string, buffer: ArrayBuffer): void {
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new FileSizeLimitError(name, buffer.byteLength, MAX_FILE_SIZE_BYTES);
  }

  if (buffer.byteLength < 5) {
    throw new CorruptedPdfError(name, "File size is too small to be a valid PDF document.");
  }

  const headerBytes = new Uint8Array(buffer.slice(0, 5));
  const headerStr = String.fromCharCode(...headerBytes);
  if (!headerStr.startsWith("%PDF-")) {
    throw new CorruptedPdfError(name, "File does not start with valid PDF header signature (%PDF-).");
  }
}

/**
 * Checks for encryption markers in the raw buffer.
 */
function hasEncryptionMarker(buffer: ArrayBuffer): boolean {
  try {
    // Quick trailer inspection: scan the trailing 4096 bytes or full buffer for /Encrypt
    const scanLength = Math.min(buffer.byteLength, 16384);
    const tailBytes = new Uint8Array(buffer.slice(buffer.byteLength - scanLength));
    let tailStr = "";
    for (let i = 0; i < tailBytes.length; i++) {
      tailStr += String.fromCharCode(tailBytes[i]);
    }
    return /\/Encrypt\s+\d+\s+\d+\s+R/i.test(tailStr);
  } catch {
    return false;
  }
}

/**
 * Safely loads a PDF document with strict encryption enforcement and corrupt file defense.
 * NEVER passes ignoreEncryption: true.
 */
export async function loadPdfSafely(buffer: ArrayBuffer, filename: string): Promise<PDFDocument> {
  validatePdfBuffer(filename, buffer);

  // Pre-check for encryption markers
  if (hasEncryptionMarker(buffer)) {
    throw new EncryptedPdfError(filename);
  }

  let pdfDoc: PDFDocument;
  try {
    // Note: ignoreEncryption is explicitly omitted (defaults to false)
    pdfDoc = await PDFDocument.load(buffer, { updateMetadata: false });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const lower = errorMsg.toLowerCase();
    if (lower.includes("encrypt") || lower.includes("password") || lower.includes("decrypt")) {
      throw new EncryptedPdfError(filename);
    }
    throw new CorruptedPdfError(filename, errorMsg);
  }

  // Double check document encryption flag if present
  if (pdfDoc.isEncrypted) {
    throw new EncryptedPdfError(filename);
  }

  const pageCount = pdfDoc.getPageCount();
  if (pageCount > MAX_TOTAL_PAGES) {
    throw new PageCountLimitError(pageCount, MAX_TOTAL_PAGES);
  }

  if (pageCount === 0) {
    throw new CorruptedPdfError(filename, "Document contains 0 valid pages.");
  }

  return pdfDoc;
}

/**
 * Parses user range strings (e.g. "1-3, 5, 7-10") into structured page bounds.
 */
export function parsePageRanges(rangesStr: string, totalPages: number): SplitRangeSpec[] {
  if (!rangesStr || !rangesStr.trim()) {
    throw new InvalidOperationError("Page range string cannot be empty.");
  }

  const parts = rangesStr.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new InvalidOperationError("No valid page ranges found.");
  }

  const specs: SplitRangeSpec[] = [];

  for (const part of parts) {
    if (part.includes("-")) {
      const sides = part.split("-").map((s) => s.trim());
      if (sides.length !== 2) {
        throw new InvalidOperationError(`Invalid range syntax: "${part}". Expected format: "1-5".`);
      }
      const start = parseInt(sides[0], 10);
      const end = parseInt(sides[1], 10);
      if (isNaN(start) || isNaN(end)) {
        throw new InvalidOperationError(`Non-numeric page range: "${part}".`);
      }
      if (start < 1 || end < 1) {
        throw new InvalidOperationError(`Page numbers must be 1 or greater. Found: "${part}".`);
      }
      if (start > totalPages || end > totalPages) {
        throw new InvalidOperationError(
          `Range "${part}" exceeds document total page count of ${totalPages}.`
        );
      }
      if (start > end) {
        throw new InvalidOperationError(
          `Invalid inverted range: "${part}". Start page must be less than or equal to end page.`
        );
      }
      specs.push({ start, end });
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        throw new InvalidOperationError(`Invalid page number: "${part}".`);
      }
      if (pageNum < 1 || pageNum > totalPages) {
        throw new InvalidOperationError(
          `Page ${pageNum} is out of bounds (document has ${totalPages} pages).`
        );
      }
      specs.push({ start: pageNum, end: pageNum });
    }
  }

  return specs;
}

/**
 * 1. MERGE PDF
 * Combines multiple PDF buffers into a single PDF document in the specified order.
 */
export async function mergePdfDocuments(
  options: MergeOptions,
  onProgress?: ProgressCallback
): Promise<ProcessedOutput> {
  const { files, outputFilename = "merged_document.pdf" } = options;

  if (!files || files.length < 2) {
    throw new InvalidOperationError("At least two PDF files are required to perform a merge.");
  }

  onProgress?.(10, "Initializing merge workspace...");
  const mergedDoc = await PDFDocument.create();

  let totalPagesAccumulated = 0;
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const stepProgress = 10 + Math.floor(((i + 0.5) / totalFiles) * 75);
    onProgress?.(stepProgress, `Reading "${file.name}" (${i + 1}/${totalFiles})...`);

    const srcDoc = await loadPdfSafely(file.buffer, file.name);
    const count = srcDoc.getPageCount();
    totalPagesAccumulated += count;

    if (totalPagesAccumulated > MAX_TOTAL_PAGES) {
      throw new PageCountLimitError(totalPagesAccumulated, MAX_TOTAL_PAGES);
    }

    const indices = Array.from({ length: count }, (_, idx) => idx);
    const copiedPages = await mergedDoc.copyPages(srcDoc, indices);
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  onProgress?.(90, "Compiling and finalizing merged PDF...");
  const mergedBytes = await mergedDoc.save();
  onProgress?.(100, "Merge complete!");

  // Use a copy of the Uint8Array buffer to prevent detachment issues
  const blob = new Blob([new Uint8Array(mergedBytes)], { type: "application/pdf" });

  return {
    id: `merge-${Date.now()}`,
    blob,
    filename: outputFilename.endsWith(".pdf") ? outputFilename : `${outputFilename}.pdf`,
    fileSizeBytes: blob.size,
    mimeType: "application/pdf",
    pageCount: totalPagesAccumulated,
  };
}

/**
 * 2. SPLIT PDF
 * Supports Split by Ranges, Extract Selected Pages, or Burst every page to a ZIP archive.
 */
export async function splitPdfDocument(
  options: SplitOptions,
  onProgress?: ProgressCallback
): Promise<ProcessedOutput> {
  const { file, mode, ranges, selectedPages, outputFilename } = options;

  onProgress?.(10, `Reading "${file.name}"...`);
  const srcDoc = await loadPdfSafely(file.buffer, file.name);
  const totalPages = srcDoc.getPageCount();

  if (mode === "range") {
    if (!ranges) {
      throw new InvalidOperationError("No page ranges provided for range split mode.");
    }
    onProgress?.(30, "Parsing and validating ranges...");
    const specs = parsePageRanges(ranges, totalPages);

    // Extract pages matching specs
    const targetDoc = await PDFDocument.create();
    const pageIndicesToCopy: number[] = [];
    for (const spec of specs) {
      for (let p = spec.start; p <= spec.end; p++) {
        pageIndicesToCopy.push(p - 1); // 0-based
      }
    }

    onProgress?.(60, `Extracting ${pageIndicesToCopy.length} pages...`);
    const copiedPages = await targetDoc.copyPages(srcDoc, pageIndicesToCopy);
    for (const page of copiedPages) {
      targetDoc.addPage(page);
    }

    onProgress?.(90, "Finalizing split PDF...");
    const outBytes = await targetDoc.save();
    onProgress?.(100, "Split complete!");

    const finalName = outputFilename || `${file.name.replace(/\.pdf$/i, "")}_split.pdf`;
    const blob = new Blob([new Uint8Array(outBytes)], { type: "application/pdf" });
    return {
      id: `split-${Date.now()}`,
      blob,
      filename: finalName.endsWith(".pdf") ? finalName : `${finalName}.pdf`,
      fileSizeBytes: blob.size,
      mimeType: "application/pdf",
      pageCount: pageIndicesToCopy.length,
    };
  }

  if (mode === "extract") {
    if (!selectedPages || selectedPages.length === 0) {
      throw new InvalidOperationError("At least one page must be selected for extraction.");
    }

    onProgress?.(30, "Validating selected pages...");
    const zeroBasedIndices: number[] = [];
    for (const p of selectedPages) {
      if (p < 1 || p > totalPages) {
        throw new InvalidOperationError(`Selected page ${p} is out of bounds (1-${totalPages}).`);
      }
      zeroBasedIndices.push(p - 1);
    }

    onProgress?.(60, `Extracting ${zeroBasedIndices.length} pages...`);
    const targetDoc = await PDFDocument.create();
    const copiedPages = await targetDoc.copyPages(srcDoc, zeroBasedIndices);
    for (const page of copiedPages) {
      targetDoc.addPage(page);
    }

    onProgress?.(90, "Finalizing extracted PDF...");
    const outBytes = await targetDoc.save();
    onProgress?.(100, "Extraction complete!");

    const finalName = outputFilename || `${file.name.replace(/\.pdf$/i, "")}_extracted.pdf`;
    const blob = new Blob([new Uint8Array(outBytes)], { type: "application/pdf" });
    return {
      id: `extract-${Date.now()}`,
      blob,
      filename: finalName.endsWith(".pdf") ? finalName : `${finalName}.pdf`,
      fileSizeBytes: blob.size,
      mimeType: "application/pdf",
      pageCount: zeroBasedIndices.length,
    };
  }

  if (mode === "burst") {
    onProgress?.(20, "Burst mode: preparing individual page files...");
    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, "");
    const padLength = Math.max(3, String(totalPages).length);

    for (let i = 0; i < totalPages; i++) {
      const percent = 20 + Math.floor(((i + 1) / totalPages) * 60);
      onProgress?.(percent, `Generating page ${i + 1} of ${totalPages}...`);

      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copiedPage);

      const singleBytes = await singleDoc.save();
      const pageIndexStr = String(i + 1).padStart(padLength, "0");
      const pageFileName = `${baseName}_page_${pageIndexStr}.pdf`;
      zip.file(pageFileName, new Uint8Array(singleBytes));
    }

    onProgress?.(85, "Compressing pages into ZIP archive...");
    const zipBlob = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
      (metadata) => {
        const zipPercent = 85 + Math.floor(metadata.percent * 0.14);
        onProgress?.(zipPercent, `Compressing ZIP archive (${metadata.percent.toFixed(0)}%)...`);
      }
    );

    onProgress?.(100, "Burst extraction complete!");
    const finalZipName = outputFilename || `${baseName}_all_pages.zip`;

    return {
      id: `burst-${Date.now()}`,
      blob: zipBlob,
      filename: finalZipName.endsWith(".zip") ? finalZipName : `${finalZipName}.zip`,
      fileSizeBytes: zipBlob.size,
      mimeType: "application/zip",
      pageCount: totalPages,
    };
  }

  throw new InvalidOperationError(`Unsupported split mode: "${mode}".`);
}

/**
 * 3. ROTATE PDF
 * Rotates specified pages by 90, 180, or 270 degrees clockwise.
 * Correctly adds to existing page rotation without vector loss.
 */
export async function rotatePdfDocument(
  options: RotateOptions,
  onProgress?: ProgressCallback
): Promise<ProcessedOutput> {
  const { file, pageRotations, outputFilename } = options;

  onProgress?.(15, `Reading "${file.name}"...`);
  const pdfDoc = await loadPdfSafely(file.buffer, file.name);
  const totalPages = pdfDoc.getPageCount();

  onProgress?.(40, "Applying page rotation metadata...");
  const pages = pdfDoc.getPages();

  let modifiedCount = 0;
  for (const [pageNumStr, deltaAngle] of Object.entries(pageRotations)) {
    const pageNum = parseInt(pageNumStr, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      continue;
    }

    // Normalise delta angle to 0, 90, 180, 270
    const normalizedDelta = ((deltaAngle % 360) + 360) % 360;
    if (normalizedDelta === 0) continue;

    const page = pages[pageNum - 1];
    const existingAngle = page.getRotation().angle;
    const finalAngle = (existingAngle + normalizedDelta) % 360;

    page.setRotation(degrees(finalAngle));
    modifiedCount++;
  }

  onProgress?.(80, "Saving rotated document...");
  const outBytes = await pdfDoc.save();
  onProgress?.(100, "Rotation complete!");

  const finalName = outputFilename || `${file.name.replace(/\.pdf$/i, "")}_rotated.pdf`;
  const blob = new Blob([new Uint8Array(outBytes)], { type: "application/pdf" });

  return {
    id: `rotate-${Date.now()}`,
    blob,
    filename: finalName.endsWith(".pdf") ? finalName : `${finalName}.pdf`,
    fileSizeBytes: blob.size,
    mimeType: "application/pdf",
    pageCount: totalPages,
  };
}

/**
 * 4. REORDER PDF
 * Permutes pages according to the exact submitted 1-based order.
 */
export async function reorderPdfDocument(
  options: ReorderOptions,
  onProgress?: ProgressCallback
): Promise<ProcessedOutput> {
  const { file, newPageOrder, outputFilename } = options;

  onProgress?.(15, `Reading "${file.name}"...`);
  const srcDoc = await loadPdfSafely(file.buffer, file.name);
  const totalPages = srcDoc.getPageCount();

  // Validate permutation completeness
  if (!newPageOrder || newPageOrder.length !== totalPages) {
    throw new InvalidOperationError(
      `Permutation length (${newPageOrder?.length || 0}) does not match document page count (${totalPages}).`
    );
  }

  const seen = new Set<number>();
  for (const p of newPageOrder) {
    if (p < 1 || p > totalPages) {
      throw new InvalidOperationError(`Invalid page index ${p} in reorder sequence (must be 1-${totalPages}).`);
    }
    if (seen.has(p)) {
      throw new InvalidOperationError(`Duplicate page index ${p} in reorder permutation.`);
    }
    seen.add(p);
  }

  onProgress?.(45, "Reordering pages...");
  const targetDoc = await PDFDocument.create();
  const zeroBasedIndices = newPageOrder.map((p) => p - 1);

  const copiedPages = await targetDoc.copyPages(srcDoc, zeroBasedIndices);
  for (const page of copiedPages) {
    targetDoc.addPage(page);
  }

  onProgress?.(85, "Saving reordered document...");
  const outBytes = await targetDoc.save();
  onProgress?.(100, "Reorder complete!");

  const finalName = outputFilename || `${file.name.replace(/\.pdf$/i, "")}_reordered.pdf`;
  const blob = new Blob([new Uint8Array(outBytes)], { type: "application/pdf" });

  return {
    id: `reorder-${Date.now()}`,
    blob,
    filename: finalName.endsWith(".pdf") ? finalName : `${finalName}.pdf`,
    fileSizeBytes: blob.size,
    mimeType: "application/pdf",
    pageCount: totalPages,
  };
}

/**
 * 5. REMOVE PDF
 * Deletes specified pages from the PDF document.
 * Prevents removal of all pages.
 */
export async function removePdfDocument(
  options: RemoveOptions,
  onProgress?: ProgressCallback
): Promise<ProcessedOutput> {
  const { file, pagesToRemove, outputFilename } = options;

  onProgress?.(15, `Reading "${file.name}"...`);
  const srcDoc = await loadPdfSafely(file.buffer, file.name);
  const totalPages = srcDoc.getPageCount();

  if (!pagesToRemove || pagesToRemove.length === 0) {
    throw new InvalidOperationError("No pages selected for removal.");
  }

  const removeSet = new Set(pagesToRemove);
  for (const p of removeSet) {
    if (p < 1 || p > totalPages) {
      throw new InvalidOperationError(`Page index ${p} is out of bounds (1-${totalPages}).`);
    }
  }

  const retainedIndices: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (!removeSet.has(i)) {
      retainedIndices.push(i - 1); // 0-based
    }
  }

  if (retainedIndices.length === 0) {
    throw new InvalidOperationError(
      "Cannot remove all pages from the document. At least one page must remain."
    );
  }

  onProgress?.(50, `Preserving ${retainedIndices.length} remaining pages...`);
  const targetDoc = await PDFDocument.create();
  const copiedPages = await targetDoc.copyPages(srcDoc, retainedIndices);
  for (const page of copiedPages) {
    targetDoc.addPage(page);
  }

  onProgress?.(85, "Compiling final document...");
  const outBytes = await targetDoc.save();
  onProgress?.(100, "Removal complete!");

  const finalName = outputFilename || `${file.name.replace(/\.pdf$/i, "")}_filtered.pdf`;
  const blob = new Blob([new Uint8Array(outBytes)], { type: "application/pdf" });

  return {
    id: `remove-${Date.now()}`,
    blob,
    filename: finalName.endsWith(".pdf") ? finalName : `${finalName}.pdf`,
    fileSizeBytes: blob.size,
    mimeType: "application/pdf",
    pageCount: retainedIndices.length,
  };
}
