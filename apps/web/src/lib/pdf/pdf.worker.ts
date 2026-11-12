/**
 * Web Worker for Off-Thread In-Browser PDF Processing
 * Keeps the main UI thread at 60 FPS during large document operations.
 */

import {
  mergePdfDocuments,
  splitPdfDocument,
  rotatePdfDocument,
  reorderPdfDocument,
  removePdfDocument,
} from "./engine";
import {
  MergeOptions,
  SplitOptions,
  RotateOptions,
  ReorderOptions,
  RemoveOptions,
} from "./types";

self.onmessage = async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  const onProgress = (percent: number, status: string) => {
    self.postMessage({ id, type: "PROGRESS", percent, status });
  };

  try {
    let result;
    switch (type) {
      case "MERGE":
        result = await mergePdfDocuments(payload as MergeOptions, onProgress);
        break;
      case "SPLIT":
        result = await splitPdfDocument(payload as SplitOptions, onProgress);
        break;
      case "ROTATE":
        result = await rotatePdfDocument(payload as RotateOptions, onProgress);
        break;
      case "REORDER":
        result = await reorderPdfDocument(payload as ReorderOptions, onProgress);
        break;
      case "REMOVE":
        result = await removePdfDocument(payload as RemoveOptions, onProgress);
        break;
      default:
        throw new Error(`Unknown worker operation: ${type}`);
    }

    // Convert blob to ArrayBuffer for transferable postMessage
    const arrayBuffer = await result.blob.arrayBuffer();
    (self as unknown as { postMessage: (msg: unknown, transfer?: Transferable[]) => void }).postMessage(
      {
        id,
        type: "SUCCESS",
        payload: {
          id: result.id,
          buffer: arrayBuffer,
          filename: result.filename,
          fileSizeBytes: result.fileSizeBytes,
          mimeType: result.mimeType,
          pageCount: result.pageCount,
        },
      },
      [arrayBuffer]
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string })?.code || "WORKER_ERROR";
    (self as unknown as { postMessage: (msg: unknown) => void }).postMessage({
      id,
      type: "ERROR",
      error: { message, code },
    });
  }
};
