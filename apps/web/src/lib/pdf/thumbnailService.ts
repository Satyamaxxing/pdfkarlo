/**
 * In-Browser PDF Thumbnail & Preview Rendering Service
 * Powered by Mozilla pdfjs-dist via local Web Worker.
 *
 * Features:
 * - 100% Client-side HTML5 Canvas rendering (0 bytes uploaded).
 * - Bounded LRU cache to prevent browser memory exhaustion.
 * - Explicit canvas and page cleanup to release GPU and RAM resources.
 * - Queue-based concurrency limiter (max 2 parallel renders) for smooth 60fps UI.
 * - Graceful fallback on password-protected or corrupted documents.
 */

let pdfjsModule: typeof import("pdfjs-dist") | null = null;
let isWorkerConfigured = false;

async function getPdfJs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist");
  }
  if (!isWorkerConfigured && typeof window !== "undefined") {
    // Point directly to locally hosted worker in public folder
    pdfjsModule.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    isWorkerConfigured = true;
  }
  return pdfjsModule;
}

// Bounded LRU Cache for rendered thumbnail data URLs
const MAX_CACHE_ENTRIES = 150;
const thumbnailCache = new Map<string, string>();

function getCacheKey(docId: string, pageNumber: number, width: number): string {
  return `${docId}_p${pageNumber}_w${width}`;
}

function addToCache(key: string, dataUrl: string) {
  if (thumbnailCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = thumbnailCache.keys().next().value;
    if (oldestKey) {
      thumbnailCache.delete(oldestKey);
    }
  }
  thumbnailCache.set(key, dataUrl);
}

// Concurrency Queue to prevent CPU spikes
class RenderQueue {
  private activeCount = 0;
  private queue: Array<() => Promise<void>> = [];
  private readonly maxConcurrent = 2;

  public async run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.activeCount++;
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.activeCount--;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            next?.();
          }
        }
      };

      if (this.activeCount < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

const renderQueue = new RenderQueue();

// Document proxy cache so multiple pages don't re-parse the raw PDF buffer
const activeDocumentProxies = new Map<string, { proxy: any; refCount: number }>();

export class PdfThumbnailService {
  /**
   * Loads a PDF Document Proxy from an ArrayBuffer and caches it under a docId.
   */
  public static async loadDocument(docId: string, buffer: ArrayBuffer): Promise<any> {
    if (activeDocumentProxies.has(docId)) {
      const entry = activeDocumentProxies.get(docId)!;
      entry.refCount++;
      return entry.proxy;
    }

    const pdfjs = await getPdfJs();
    // Copy buffer to prevent detached ArrayBuffer issues across workers
    const dataCopy = new Uint8Array(buffer.slice(0));

    const loadingTask = pdfjs.getDocument({
      data: dataCopy,
      useSystemFonts: true,
      stopAtErrors: false,
    });

    const proxy = await loadingTask.promise;
    activeDocumentProxies.set(docId, { proxy, refCount: 1 });
    return proxy;
  }

  /**
   * Releases document proxy when a workspace is closed or reset.
   */
  public static async releaseDocument(docId: string): Promise<void> {
    const entry = activeDocumentProxies.get(docId);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      try {
        await entry.proxy.destroy();
      } catch {
        // ignore
      }
      activeDocumentProxies.delete(docId);
    }
  }

  /**
   * Renders a real page thumbnail for a given document and page number.
   * Returns a base64 Data URL (image/webp or image/jpeg).
   */
  public static async getPageThumbnail(
    docId: string,
    buffer: ArrayBuffer,
    pageNumber: number,
    targetWidth: number = 200
  ): Promise<string | null> {
    const cacheKey = getCacheKey(docId, pageNumber, targetWidth);
    if (thumbnailCache.has(cacheKey)) {
      return thumbnailCache.get(cacheKey)!;
    }

    return renderQueue.run(async () => {
      // Re-check cache in case another queued task already rendered it
      if (thumbnailCache.has(cacheKey)) {
        return thumbnailCache.get(cacheKey)!;
      }

      try {
        const docProxy = await PdfThumbnailService.loadDocument(docId, buffer);
        const page = await docProxy.getPage(pageNumber);

        const initialViewport = page.getViewport({ scale: 1 });
        const scale = Math.max(0.1, targetWidth / initialViewport.width);
        const viewport = page.getViewport({ scale });

        // Offscreen canvas
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          page.cleanup();
          return null;
        }

        // Draw solid background to handle transparent PDFs
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        // Try webp first, fall back to jpeg
        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL("image/webp", 0.85);
        } catch {
          dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        }

        // Bounded memory cleanup
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();

        addToCache(cacheKey, dataUrl);
        return dataUrl;
      } catch (err) {
        console.warn(`[ThumbnailService] Failed to render page ${pageNumber} of ${docId}:`, err);
        return null;
      }
    });
  }

  /**
   * Pre-renders high-resolution image for zoom modal.
   */
  public static async getHighResPage(
    docId: string,
    buffer: ArrayBuffer,
    pageNumber: number
  ): Promise<string | null> {
    return this.getPageThumbnail(docId, buffer, pageNumber, 1000);
  }

  /**
   * Clears cache for a document.
   */
  public static clearDocumentCache(docId: string): void {
    for (const key of Array.from(thumbnailCache.keys())) {
      if (key.startsWith(`${docId}_`)) {
        thumbnailCache.delete(key);
      }
    }
  }
}
