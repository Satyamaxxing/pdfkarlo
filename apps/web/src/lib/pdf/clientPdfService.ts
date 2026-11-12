/**
 * Unified Client-Side PDF Service
 * Provides high-level methods for React UI components, managing
 * buffer extraction, Web Worker offloading with main-thread fallback,
 * progress notifications, error normalization, and memory cleanup.
 */

import {
  mergePdfDocuments,
  splitPdfDocument,
  rotatePdfDocument,
  reorderPdfDocument,
  removePdfDocument,
  loadPdfSafely,
  validatePdfBuffer,
} from "./engine";
import {
  ProcessedOutput,
  ProgressCallback,
  SplitMode,
  EncryptedPdfError,
  CorruptedPdfError,
  FileSizeLimitError,
  PageCountLimitError,
  InvalidOperationError,
  MAX_FILE_SIZE_BYTES,
  MergeOptions,
  SplitOptions,
  RotateOptions,
  ReorderOptions,
  RemoveOptions,
} from "./types";

export interface DocumentInspection {
  pageCount: number;
  fileSizeBytes: number;
  filename: string;
}

/**
 * Executes a PDF operation in a Web Worker when supported,
 * with seamless fallback to main thread processing.
 */
function runWithWorkerOrFallback(
  type: "MERGE" | "SPLIT" | "ROTATE" | "REORDER" | "REMOVE",
  payload: MergeOptions | SplitOptions | RotateOptions | ReorderOptions | RemoveOptions,
  fallbackFn: () => Promise<ProcessedOutput>,
  onProgress?: ProgressCallback
): Promise<ProcessedOutput> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return fallbackFn();
  }

  return new Promise<ProcessedOutput>((resolve, reject) => {
    let worker: Worker | null = null;
    let fallbackInvoked = false;

    const doFallback = (reason?: unknown) => {
      if (fallbackInvoked) return;
      fallbackInvoked = true;
      console.log(`[PDF Engine] Executing ${type} via Main Thread (Fallback reason:`, reason ?? "none", ")");
      if (worker) {
        try {
          worker.terminate();
        } catch {
          // ignore
        }
      }
      fallbackFn().then(resolve, reject);
    };

    try {
      worker = new Worker(new URL("./pdf.worker.ts", import.meta.url));
      const messageId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      worker.onmessage = (event: MessageEvent) => {
        const { id, type: msgType, percent, status, payload: resPayload, error } = event.data;
        if (id !== messageId) return;

        if (msgType === "PROGRESS") {
          onProgress?.(percent, status);
        } else if (msgType === "SUCCESS") {
          console.log(`[PDF Engine] ${type} successfully completed via Web Worker`);
          worker?.terminate();
          const blob = new Blob([new Uint8Array(resPayload.buffer)], { type: resPayload.mimeType });
          resolve({
            id: resPayload.id,
            blob,
            filename: resPayload.filename,
            fileSizeBytes: resPayload.fileSizeBytes,
            mimeType: resPayload.mimeType,
            pageCount: resPayload.pageCount,
          });
        } else if (msgType === "ERROR") {
          worker?.terminate();
          if (error?.code === "ENCRYPTED_PDF") {
            reject(new EncryptedPdfError(error.message));
          } else if (error?.code === "CORRUPTED_PDF") {
            reject(new CorruptedPdfError(undefined, error.message));
          } else {
            reject(new Error(error?.message || "PDF operation failed."));
          }
        }
      };

      worker.onerror = (err) => {
        console.warn("Worker error, switching to main thread execution:", err);
        doFallback();
      };

      worker.postMessage({ id: messageId, type, payload });
    } catch (err) {
      console.warn("Failed to instantiate Web Worker, executing in main thread:", err);
      doFallback();
    }
  });
}

export class ClientPdfService {
  /**
   * Inspects a PDF file immediately upon selection.
   * Accurately extracts page count and detects encryption / corruption.
   */
  public static async inspectFile(file: File): Promise<DocumentInspection> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeLimitError(file.name, file.size, MAX_FILE_SIZE_BYTES);
    }

    const buffer = await file.arrayBuffer();
    const pdfDoc = await loadPdfSafely(buffer, file.name);

    return {
      pageCount: pdfDoc.getPageCount(),
      fileSizeBytes: file.size,
      filename: file.name,
    };
  }

  /**
   * 1. Merge multiple PDF files in user-specified order.
   */
  public static async merge(
    files: File[],
    outputFilename: string = "merged_document.pdf",
    onProgress?: ProgressCallback
  ): Promise<ProcessedOutput> {
    if (files.length < 2) {
      throw new InvalidOperationError("Please select at least 2 PDF files to merge.");
    }

    onProgress?.(5, "Reading input documents...");
    const fileEntries: Array<{ name: string; buffer: ArrayBuffer }> = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > MAX_FILE_SIZE_BYTES) {
        throw new FileSizeLimitError(f.name, f.size);
      }
      const buffer = await f.arrayBuffer();
      validatePdfBuffer(f.name, buffer);
      fileEntries.push({ name: f.name, buffer });
    }

    const options: MergeOptions = { files: fileEntries, outputFilename };

    return runWithWorkerOrFallback(
      "MERGE",
      options,
      () => mergePdfDocuments(options, onProgress),
      onProgress
    );
  }

  /**
   * 2. Split PDF by range, extract specific pages, or burst all pages.
   */
  public static async split(
    file: File,
    mode: SplitMode,
    options: {
      ranges?: string;
      selectedPages?: number[];
      outputFilename?: string;
    },
    onProgress?: ProgressCallback
  ): Promise<ProcessedOutput> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeLimitError(file.name, file.size);
    }

    const buffer = await file.arrayBuffer();
    validatePdfBuffer(file.name, buffer);

    const splitOpts: SplitOptions = {
      file: { name: file.name, buffer },
      mode,
      ranges: options.ranges,
      selectedPages: options.selectedPages,
      outputFilename: options.outputFilename,
    };

    return runWithWorkerOrFallback(
      "SPLIT",
      splitOpts,
      () => splitPdfDocument(splitOpts, onProgress),
      onProgress
    );
  }

  /**
   * 3. Rotate selected or all pages by given degrees.
   */
  public static async rotate(
    file: File,
    pageRotations: Record<number, number>,
    outputFilename?: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedOutput> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeLimitError(file.name, file.size);
    }

    const buffer = await file.arrayBuffer();
    validatePdfBuffer(file.name, buffer);

    const rotateOpts: RotateOptions = {
      file: { name: file.name, buffer },
      pageRotations,
      outputFilename,
    };

    return runWithWorkerOrFallback(
      "ROTATE",
      rotateOpts,
      () => rotatePdfDocument(rotateOpts, onProgress),
      onProgress
    );
  }

  /**
   * 4. Reorder PDF pages to match permutation.
   */
  public static async reorder(
    file: File,
    newPageOrder: number[],
    outputFilename?: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedOutput> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeLimitError(file.name, file.size);
    }

    const buffer = await file.arrayBuffer();
    validatePdfBuffer(file.name, buffer);

    const reorderOpts: ReorderOptions = {
      file: { name: file.name, buffer },
      newPageOrder,
      outputFilename,
    };

    return runWithWorkerOrFallback(
      "REORDER",
      reorderOpts,
      () => reorderPdfDocument(reorderOpts, onProgress),
      onProgress
    );
  }

  /**
   * 5. Remove selected pages from PDF.
   */
  public static async remove(
    file: File,
    pagesToRemove: number[],
    outputFilename?: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedOutput> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new FileSizeLimitError(file.name, file.size);
    }

    const buffer = await file.arrayBuffer();
    validatePdfBuffer(file.name, buffer);

    const removeOpts: RemoveOptions = {
      file: { name: file.name, buffer },
      pagesToRemove,
      outputFilename,
    };

    return runWithWorkerOrFallback(
      "REMOVE",
      removeOpts,
      () => removePdfDocument(removeOpts, onProgress),
      onProgress
    );
  }

  /**
   * Helper to trigger a direct browser file download for a processed output blob.
   */
  public static triggerDownload(output: ProcessedOutput): void {
    const url = URL.createObjectURL(output.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = output.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  }
}

export {
  EncryptedPdfError,
  CorruptedPdfError,
  FileSizeLimitError,
  PageCountLimitError,
  InvalidOperationError,
};
