"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ToolSwitcherNav } from "@/components/ToolSwitcherNav";
import { FileUploadZone } from "@/components/FileUploadZone";
import { JobProgressBar } from "@/components/JobProgressBar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { PdfPageGrid } from "@/components/workspace/PdfPageGrid";
import { PdfThumbnailCard } from "@/components/workspace/PdfThumbnailCard";
import { PagePreviewModal } from "@/components/workspace/PagePreviewModal";
import {
  ArrowUpDown,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  ListOrdered,
  Lock,
} from "lucide-react";
import { ClientPdfService } from "@/lib/pdf/clientPdfService";
import { ProcessedOutput } from "@/lib/pdf/types";
import { ToolSeoSection } from "@/components/ToolSeoSection";
import { REORDER_SEO_DATA } from "@/lib/seoData";
import { useWorkspaceUI } from "@/components/WorkspaceUIContext";

type ReorderState = "IDLE" | "FILE_SELECTED" | "PROCESSING" | "SUCCESS" | "ERROR";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function ReorderPdfPage() {
  const [state, setState] = useState<ReorderState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isDetectingPages, setIsDetectingPages] = useState<boolean>(false);
  const { setIsWorkspaceActive } = useWorkspaceUI();

  useEffect(() => {
    setIsWorkspaceActive(state !== "IDLE");
    return () => setIsWorkspaceActive(false);
  }, [state, setIsWorkspaceActive]);

  // Ordered list of original 1-based page numbers: e.g. [1, 2, 3, 4]
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // High-res preview modal state
  const [zoomPage, setZoomPage] = useState<number | null>(null);

  // Progress & Execution state
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelected = async (selected: File[]) => {
    if (!selected || selected.length === 0) return;
    const target = selected[0];
    setFile(target);
    setState("FILE_SELECTED");
    setIsDetectingPages(true);
    setErrorMessage("");

    try {
      const buffer = await target.arrayBuffer();
      setFileBuffer(buffer);

      const inspection = await ClientPdfService.inspectFile(target);
      setIsDetectingPages(false);
      setPageCount(inspection.pageCount);

      const initialOrder = Array.from({ length: inspection.pageCount }, (_, i) => i + 1);
      setPageOrder(initialOrder);
    } catch (err: unknown) {
      setIsDetectingPages(false);
      setState("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Failed to inspect PDF.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileBuffer(null);
    setPageCount(null);
    setPageOrder([]);
    setDraggedIndex(null);
    setZoomPage(null);
    setProgress(0);
    setProcessedOutput(null);
    setErrorMessage("");
    setState("IDLE");
  };

  // Move page to beginning (position 0)
  const moveToBeginning = (currentIndex: number) => {
    if (currentIndex === 0) return;
    const updated = [...pageOrder];
    const [moved] = updated.splice(currentIndex, 1);
    updated.unshift(moved);
    setPageOrder(updated);
  };

  // Move page to end (last position)
  const moveToEnd = (currentIndex: number) => {
    if (currentIndex === pageOrder.length - 1) return;
    const updated = [...pageOrder];
    const [moved] = updated.splice(currentIndex, 1);
    updated.push(moved);
    setPageOrder(updated);
  };

  // Move page left (swap with currentIndex - 1)
  const moveLeft = (currentIndex: number) => {
    if (currentIndex === 0) return;
    const updated = [...pageOrder];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[currentIndex - 1];
    updated[currentIndex - 1] = temp;
    setPageOrder(updated);
  };

  // Move page right (swap with currentIndex + 1)
  const moveRight = (currentIndex: number) => {
    if (currentIndex >= pageOrder.length - 1) return;
    const updated = [...pageOrder];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[currentIndex + 1];
    updated[currentIndex + 1] = temp;
    setPageOrder(updated);
  };

  // Reverse all pages
  const reverseOrder = () => {
    setPageOrder([...pageOrder].reverse());
  };

  // Reset to original natural order [1..N]
  const resetToOriginal = () => {
    const total = pageOrder.length;
    setPageOrder(Array.from({ length: total }, (_, i) => i + 1));
  };

  // Drag-and-drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...pageOrder];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(targetIndex);
    setPageOrder(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Check if order was changed from natural 1..N
  const isOrderChanged = useMemo(() => {
    return pageOrder.some((p, idx) => p !== idx + 1);
  }, [pageOrder]);

  const handleSubmit = async () => {
    if (!file) return;

    if (!isOrderChanged) {
      setErrorMessage("Please reorder at least one page before submitting.");
      return;
    }

    setState("PROCESSING");
    setProgress(10);
    setStatusText("Reordering pages locally in browser...");
    setErrorMessage("");

    try {
      const result = await ClientPdfService.reorder(
        file,
        pageOrder,
        `reordered_${file.name}`,
        (percent, status) => {
          setProgress(percent);
          setStatusText(status);
        }
      );

      setProcessedOutput(result);
      setProgress(100);
      setState("SUCCESS");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reorder PDF document.");
      setState("ERROR");
    }
  };

  const handleDownload = () => {
    if (processedOutput) {
      ClientPdfService.triggerDownload(processedOutput);
    }
  };

  return (
    <div
      className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 ${
        state === "IDLE" ? "pb-16 sm:pb-24" : "pb-8 sm:pb-10"
      } flex flex-col`}
    >
      {/* Studio Navigation & Tool Switcher (Elevated at top) */}
      {state === "IDLE" && <ToolSwitcherNav currentTool="reorder" />}

      {/* Step 1: Upload Zone */}
      {state === "IDLE" && (
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center text-center space-y-4 pt-1 sm:pt-3 pb-8 sm:pb-12">
          <div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 flex items-center justify-center">
              <Image
                src="/icons/tool-reorder.png"
                alt="Reorder Pages"
                width={64}
                height={64}
                priority
                className="w-full h-full object-contain drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Reorder PDF Pages
            </h1>
          </div>

          <FileUploadZone
            onFilesSelected={handleFileSelected}
            multiple={false}
            maxFiles={1}
            buttonText="Select PDF file"
            sublabel="or drop PDF here"
          />
        </div>
      )}

      {/* Step 2: Interactive Page Reorder Canvas */}
      {state === "FILE_SELECTED" && file && (
        <div className="space-y-6">
          <WorkspaceHeader
            filename={file.name}
            fileSizeBytes={file.size}
            pageCount={pageCount}
            isDetecting={isDetectingPages}
            onReset={handleReset}
            toolName="Reorder Tool"
            toolIcon={
              <Image
                src="/icons/tool-reorder.png"
                alt="Reorder Pages"
                width={28}
                height={28}
                className="w-6 h-6 object-contain"
              />
            }
          />

          <PdfPageGrid
            totalPages={pageOrder.length}
            toolbarLeft={
              <>
                <button
                  type="button"
                  onClick={reverseOrder}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reverse page sequence"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                  <span>Reverse Order</span>
                </button>
                {isOrderChanged && (
                  <button
                    type="button"
                    onClick={resetToOriginal}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Reset to original sequence"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset to Original</span>
                  </button>
                )}
              </>
            }
            toolbarRight={
              isOrderChanged ? (
                <span className="text-xs font-semibold text-orange-700 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200">
                  Custom order active
                </span>
              ) : null
            }
            infoBanner={
              <div className="flex items-center gap-2 text-xs text-slate-500 px-1 font-medium">
                <ListOrdered className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span>
                  Drag thumbnails or use arrow buttons to rearrange pages. Click the zoom icon on any card to preview full size.
                </span>
              </div>
            }
          >
            {pageOrder.map((origPageNum, newIndex) => {
              const isFirst = newIndex === 0;
              const isLast = newIndex === pageOrder.length - 1;
              const hasMoved = origPageNum !== newIndex + 1;

              return (
                <PdfThumbnailCard
                  key={`${origPageNum}-${newIndex}`}
                  docId={file.name}
                  buffer={fileBuffer}
                  pageNumber={origPageNum}
                  displayIndex={newIndex + 1}
                  isDraggable={true}
                  dragIndex={newIndex}
                  isDragging={draggedIndex === newIndex}
                  onDragStart={(_e, idx) => handleDragStart(idx)}
                  onDragOver={(_e, idx) => handleDragOver(idx)}
                  onDragEnd={handleDragEnd}
                  onOpenZoom={(p) => setZoomPage(p)}
                  badgeSlot={
                    hasMoved ? (
                      <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold">
                        Moved
                      </span>
                    ) : null
                  }
                  actionsSlot={
                    <div className="flex items-center justify-between gap-1 w-full">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveToBeginning(newIndex)}
                        className="p-1 rounded text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                        title="Move to first position"
                        aria-label={`Move page ${origPageNum} to first position`}
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => moveLeft(newIndex)}
                        className="p-1 rounded text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                        title="Move left"
                        aria-label={`Move page ${origPageNum} left`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveRight(newIndex)}
                        className="p-1 rounded text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                        title="Move right"
                        aria-label={`Move page ${origPageNum} right`}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => moveToEnd(newIndex)}
                        className="p-1 rounded text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                        title="Move to last position"
                        aria-label={`Move page ${origPageNum} to last position`}
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  }
                />
              );
            })}
          </PdfPageGrid>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isOrderChanged}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Apply Reorder & Save PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Progress State */}
      {state === "PROCESSING" && (
        <JobProgressBar progress={progress} statusText={statusText} />
      )}

      {/* Step 4: Success State */}
      {state === "SUCCESS" && processedOutput && (
        <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              PDF Reordered Successfully!
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              New page sequence saved cleanly. Processed locally in your browser.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                {processedOutput.filename}
              </p>
              <span className="text-[11px] text-slate-400">
                {formatBytes(processedOutput.fileSizeBytes)}
              </span>
            </div>
            <p className="text-[11px] text-orange-600 mt-1 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3" /> Ready for instant download
            </p>
          </div>

          {/* Download button */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Reordered PDF</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reorder Another PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Error State */}
      {state === "ERROR" && (
        <div className="max-w-lg mx-auto p-8 bg-white rounded-3xl border border-rose-200 shadow-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            {errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("encrypt") ? (
              <Lock className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("encrypt")
                ? "Password-Protected PDF"
                : "Reorder Error"}
            </h2>
            <p className="mt-2 text-xs text-rose-600 font-medium">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Try Again with Another File
          </button>
        </div>
      )}

      {/* High-Resolution Full-Page Preview Modal */}
      {fileBuffer && file && (
        <PagePreviewModal
          isOpen={zoomPage !== null}
          onClose={() => setZoomPage(null)}
          docId={file.name}
          buffer={fileBuffer}
          pageNumber={zoomPage || 1}
          totalPages={pageCount || pageOrder.length || 1}
          onNavigate={(newPage) => setZoomPage(newPage)}
          rotation={0}
        />
      )}
      {/* Crawlable SEO Content, How-To, Technical Explanation, Use Cases & FAQs (only shown in landing state) */}
      {state === "IDLE" && <ToolSeoSection data={REORDER_SEO_DATA} />}
    </div>
  );
}
