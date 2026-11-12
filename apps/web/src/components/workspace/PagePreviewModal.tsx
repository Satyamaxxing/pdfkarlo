"use client";

import React, { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2, ZoomIn, ShieldCheck } from "lucide-react";
import { PdfThumbnailService } from "@/lib/pdf/thumbnailService";

interface PagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageNumber: number;
  totalPages: number;
  docId: string;
  buffer: ArrayBuffer | null;
  rotation?: number;
  onNavigate?: (newPage: number) => void;
}

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  isOpen,
  onClose,
  pageNumber,
  totalPages,
  docId,
  buffer,
  rotation = 0,
  onNavigate,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onNavigate && pageNumber > 1) {
        onNavigate(pageNumber - 1);
      }
      if (e.key === "ArrowRight" && onNavigate && pageNumber < totalPages) {
        onNavigate(pageNumber + 1);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose, onNavigate, pageNumber, totalPages]);

  // Load high-resolution preview
  useEffect(() => {
    if (!isOpen || !buffer || !docId) return;

    let isMounted = true;
    setLoading(true);

    PdfThumbnailService.getHighResPage(docId, buffer, pageNumber)
      .then((src) => {
        if (isMounted) {
          setImageSrc(src);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, docId, buffer, pageNumber]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 id="preview-title" className="text-sm font-bold text-slate-900 dark:text-white">
              Page {pageNumber} of {totalPages}
            </h3>
            {rotation !== 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300">
                +{rotation}°
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Rendered locally
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close preview modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Canvas/Image Preview */}
        <div className="flex-1 min-h-[300px] max-h-[72vh] overflow-auto p-6 flex items-center justify-center bg-slate-100 dark:bg-slate-950/60">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold">Rendering high-resolution page...</span>
            </div>
          ) : imageSrc ? (
            <div className="relative shadow-lg border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={`Page ${pageNumber} high-res preview`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease-in-out",
                  maxHeight: "65vh",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                className="block"
              />
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400">
              Preview unavailable for this page.
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          <button
            type="button"
            disabled={pageNumber <= 1 || !onNavigate}
            onClick={() => onNavigate && onNavigate(pageNumber - 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-slate-400 text-[11px] font-medium">
            Use &larr; / &rarr; keys or Esc to close
          </span>

          <button
            type="button"
            disabled={pageNumber >= totalPages || !onNavigate}
            onClick={() => onNavigate && onNavigate(pageNumber + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
