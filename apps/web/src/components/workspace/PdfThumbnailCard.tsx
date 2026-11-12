"use client";

import React, { useState, useEffect, useRef } from "react";
import { ZoomIn, Loader2, GripVertical, Check } from "lucide-react";
import { PdfThumbnailService } from "@/lib/pdf/thumbnailService";

export interface PdfThumbnailCardProps {
  docId: string;
  buffer: ArrayBuffer | null;
  pageNumber: number; // 1-indexed original page
  displayIndex?: number; // 1-indexed visual position (e.g. in reorder)
  rotation?: number; // Visual rotation degrees (0, 90, 180, 270)
  isSelected?: boolean;
  isMarkedForRemoval?: boolean;
  isDragOverTarget?: boolean;
  isDragging?: boolean;
  isDraggable?: boolean;
  onClick?: () => void;
  onOpenZoom?: (pageNumber: number) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  actionsSlot?: React.ReactNode;
  badgeSlot?: React.ReactNode;
  dragIndex?: number;
}

export const PdfThumbnailCard: React.FC<PdfThumbnailCardProps> = ({
  docId,
  buffer,
  pageNumber,
  displayIndex,
  rotation = 0,
  isSelected = false,
  isMarkedForRemoval = false,
  isDragOverTarget = false,
  isDragging = false,
  isDraggable = false,
  onClick,
  onOpenZoom,
  onDragStart,
  onDragOver,
  onDragEnd,
  actionsSlot,
  badgeSlot,
  dragIndex,
}) => {
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Lazy render using IntersectionObserver
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch thumbnail when in view
  useEffect(() => {
    if (!isInView || !buffer || !docId) return;

    let isMounted = true;
    PdfThumbnailService.getPageThumbnail(docId, buffer, pageNumber, 220)
      .then((src) => {
        if (isMounted) {
          setThumbSrc(src);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isInView, docId, buffer, pageNumber]);

  return (
    <div
      ref={cardRef}
      draggable={isDraggable}
      onDragStart={(e) => {
        if (isDraggable && onDragStart && dragIndex !== undefined) {
          onDragStart(e, dragIndex);
        }
      }}
      onDragOver={(e) => {
        if (isDraggable && onDragOver && dragIndex !== undefined) {
          e.preventDefault();
          onDragOver(e, dragIndex);
        }
      }}
      onDragEnd={() => {
        if (isDraggable && onDragEnd) onDragEnd();
      }}
      onClick={onClick}
      className={`group relative rounded-2xl border-2 p-2.5 flex flex-col justify-between transition-all select-none ${
        onClick ? "cursor-pointer" : ""
      } ${
        isDragging
          ? "opacity-30 scale-95 border-dashed border-emerald-500 bg-emerald-50/20"
          : isDragOverTarget
          ? "border-emerald-500 ring-4 ring-emerald-500/20 scale-[1.03] bg-emerald-50/30 dark:bg-emerald-950/40"
          : isMarkedForRemoval
          ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20"
          : isSelected
          ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
      }`}
    >
      {/* Top Header Row: Index + Badges + Zoom */}
      <div className="w-full flex items-center justify-between gap-1 mb-2 text-[11px] font-bold">
        <div className="flex items-center gap-1.5 min-w-0">
          {isDraggable && (
            <span
              className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="text-slate-600 dark:text-slate-300 truncate">
            {displayIndex !== undefined ? `#${displayIndex}` : `P.${pageNumber}`}
          </span>
          {displayIndex !== undefined && displayIndex !== pageNumber && (
            <span className="text-[9px] font-normal text-slate-400">
              (was #{pageNumber})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {badgeSlot}
          {onOpenZoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenZoom(pageNumber);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-80 group-hover:opacity-100"
              title="Zoom page preview"
              aria-label={`Zoom preview for page ${pageNumber}`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Thumbnail Content Box */}
      <div className="relative w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-950/70 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/80 dark:border-slate-800/80">
        {loading ? (
          <div className="flex flex-col items-center gap-1.5 text-slate-400 text-[10px]">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading...</span>
          </div>
        ) : thumbSrc ? (
          <div
            className={`w-full h-full flex items-center justify-center p-1.5 transition-all duration-200 ${
              isMarkedForRemoval ? "opacity-35 grayscale" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbSrc}
              alt={`Thumbnail for page ${pageNumber}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.25s ease-in-out",
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
              }}
              className="block rounded shadow-sm bg-white"
            />
          </div>
        ) : (
          /* Fallback document icon when rasterization is unavailable */
          <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
            <div className="w-8 h-10 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500">
              {pageNumber}
            </div>
            <span className="text-[9px] text-slate-400">PDF Page</span>
          </div>
        )}

        {/* Marked for deletion visual banner */}
        {isMarkedForRemoval && (
          <div className="absolute inset-0 flex items-center justify-center bg-rose-900/30 backdrop-blur-[1px]">
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-extrabold tracking-wide uppercase shadow">
              Delete
            </span>
          </div>
        )}

        {/* Selected badge checkmark */}
        {isSelected && !isMarkedForRemoval && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Optional Card Actions Footer Slot (e.g. rotate buttons, shift arrows) */}
      {actionsSlot && (
        <div
          className="w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {actionsSlot}
        </div>
      )}
    </div>
  );
};
