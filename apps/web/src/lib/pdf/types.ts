/**
 * Types and Error Definitions for In-Browser PDF Processing Engine
 */

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB safeguard per file
export const MAX_TOTAL_PAGES = 500; // Safeguard against memory exhaustion on mobile/desktop browsers

export class PdfEngineError extends Error {
  public readonly code: string;
  constructor(message: string, code: string = "PDF_ENGINE_ERROR") {
    super(message);
    this.name = "PdfEngineError";
    this.code = code;
  }
}

export class EncryptedPdfError extends PdfEngineError {
  constructor(filename?: string) {
    super(
      filename
        ? `"${filename}" is password-protected or encrypted. Please remove password protection before processing.`
        : "The selected PDF is password-protected or encrypted. Please remove password protection before processing.",
      "ENCRYPTED_PDF"
    );
    this.name = "EncryptedPdfError";
  }
}

export class CorruptedPdfError extends PdfEngineError {
  constructor(filename?: string, details?: string) {
    super(
      filename
        ? `"${filename}" appears to be corrupted or invalid PDF format.${details ? ` Details: ${details}` : ""}`
        : `The file appears to be corrupted or invalid PDF format.${details ? ` Details: ${details}` : ""}`,
      "CORRUPTED_PDF"
    );
    this.name = "CorruptedPdfError";
  }
}

export class FileSizeLimitError extends PdfEngineError {
  constructor(filename: string, sizeBytes: number, limitBytes: number = MAX_FILE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    const limitMb = (limitBytes / (1024 * 1024)).toFixed(0);
    super(
      `"${filename}" (${sizeMb} MB) exceeds the maximum safe browser memory limit of ${limitMb} MB. Please use a smaller file to avoid browser crashes.`,
      "FILE_SIZE_LIMIT_EXCEEDED"
    );
    this.name = "FileSizeLimitError";
  }
}

export class PageCountLimitError extends PdfEngineError {
  constructor(pageCount: number, limitPages: number = MAX_TOTAL_PAGES) {
    super(
      `The document contains ${pageCount} pages, which exceeds the browser safety cap of ${limitPages} pages.`,
      "PAGE_COUNT_LIMIT_EXCEEDED"
    );
    this.name = "PageCountLimitError";
  }
}

export class InvalidOperationError extends PdfEngineError {
  constructor(message: string) {
    super(message, "INVALID_OPERATION");
    this.name = "InvalidOperationError";
  }
}

export interface ProcessedOutput {
  id: string;
  blob: Blob;
  filename: string;
  fileSizeBytes: number;
  mimeType: string;
  pageCount?: number;
}

export interface ProgressCallback {
  (progressPercent: number, statusText: string): void;
}

export type SplitMode = "range" | "extract" | "burst";

export interface SplitRangeSpec {
  start: number; // 1-based index
  end: number;   // 1-based index inclusive
}

export interface MergeOptions {
  files: Array<{ name: string; buffer: ArrayBuffer }>;
  outputFilename?: string;
}

export interface SplitOptions {
  file: { name: string; buffer: ArrayBuffer };
  mode: SplitMode;
  ranges?: string;            // e.g. "1-3, 5-8"
  selectedPages?: number[];   // 1-based page numbers
  outputFilename?: string;
}

export interface RotateOptions {
  file: { name: string; buffer: ArrayBuffer };
  pageRotations: Record<number, number>; // 1-based page number -> degrees to add (90, 180, 270)
  outputFilename?: string;
}

export interface ReorderOptions {
  file: { name: string; buffer: ArrayBuffer };
  newPageOrder: number[]; // 1-based page permutation array, e.g. [3, 1, 2]
  outputFilename?: string;
}

export interface RemoveOptions {
  file: { name: string; buffer: ArrayBuffer };
  pagesToRemove: number[]; // 1-based page numbers to delete
  outputFilename?: string;
}
