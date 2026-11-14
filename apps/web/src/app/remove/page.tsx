"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileUploadZone } from "@/components/FileUploadZone";
import { JobProgressBar } from "@/components/JobProgressBar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { PdfPageGrid } from "@/components/workspace/PdfPageGrid";
import { PdfThumbnailCard } from "@/components/workspace/PdfThumbnailCard";
import { PagePreviewModal } from "@/components/workspace/PagePreviewModal";
import {
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckSquare,
  Square,
  Lock,
  Layers,
} from "lucide-react";
import { ClientPdfService } from "@/lib/pdf/clientPdfService";
import { ProcessedOutput } from "@/lib/pdf/types";

type RemoveState = "IDLE" | "FILE_SELECTED" | "PROCESSING" | "SUCCESS" | "ERROR";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function RemovePdfPage() {
  const [state, setState] = useState<RemoveState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isDetectingPages, setIsDetectingPages] = useState<boolean>(false);

  // Set of 1-indexed page numbers marked for deletion
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  // High-res preview modal state
  const [zoomPage, setZoomPage] = useState<number | null>(null);

  // Range input helper
  const [rangeInput, setRangeInput] = useState<string>("");

  // Progress & Execution state
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelected = async (selected: File[]) => {
    if (!selected || selected.length === 0) return;
    const target = selected[0];
    setFile(target);
    setSelectedPages(new Set());
    setErrorMessage("");
    setState("FILE_SELECTED");
    setIsDetectingPages(true);

    try {
      const buffer = await target.arrayBuffer();
      setFileBuffer(buffer);

      const inspection = await ClientPdfService.inspectFile(target);
      setIsDetectingPages(false);
      setPageCount(inspection.pageCount);
    } catch (err: unknown) {
      setIsDetectingPages(false);
      setState("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Failed to inspect PDF.");
    }
  };

  const handleReset = () => {
    setState("IDLE");
    setFile(null);
    setFileBuffer(null);
    setPageCount(null);
    setSelectedPages(new Set());
    setZoomPage(null);
    setRangeInput("");
    setProgress(0);
    setStatusText("");
    setProcessedOutput(null);
    setErrorMessage("");
  };

  // Toggle single page selection for removal
  const togglePage = (pageNumber: number) => {
    const updated = new Set(selectedPages);
    if (updated.has(pageNumber)) {
      updated.delete(pageNumber);
    } else {
      updated.add(pageNumber);
    }
    setSelectedPages(updated);
  };

  // Select all pages
  const selectAll = () => {
    if (!pageCount) return;
    const all = new Set<number>();
    for (let i = 1; i <= pageCount; i++) {
      all.add(i);
    }
    setSelectedPages(all);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  // Quick select even pages
  const selectEven = () => {
    if (!pageCount) return;
    const evens = new Set<number>(selectedPages);
    for (let i = 2; i <= pageCount; i += 2) {
      evens.add(i);
    }
    setSelectedPages(evens);
  };

  // Quick select odd pages
  const selectOdd = () => {
    if (!pageCount) return;
    const odds = new Set<number>(selectedPages);
    for (let i = 1; i <= pageCount; i += 2) {
      odds.add(i);
    }
    setSelectedPages(odds);
  };

  // Mark a specific range from text input (e.g. "3-5" or "2, 4, 6")
  const applyRangeInput = () => {
    if (!rangeInput.trim() || !pageCount) return;
    const updated = new Set<number>(selectedPages);
    const parts = rangeInput.split(",");

    for (const part of parts) {
      const clean = part.trim();
      if (clean.includes("-")) {
        const [startStr, endStr] = clean.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(pageCount, Math.max(start, end));
          for (let p = from; p <= to; p++) updated.add(p);
        }
      } else {
        const p = parseInt(clean, 10);
        if (!isNaN(p) && p >= 1 && p <= pageCount) {
          updated.add(p);
        }
      }
    }
    setSelectedPages(updated);
    setRangeInput("");
  };

  const remainingPagesCount = useMemo(() => {
    if (pageCount === null) return 0;
    return Math.max(0, pageCount - selectedPages.size);
  }, [pageCount, selectedPages]);

  const isFormValid = useMemo(() => {
    if (!file || !pageCount) return false;
    if (selectedPages.size === 0) return false;
    if (selectedPages.size >= pageCount) return false; // Prevent removing 100% of pages
    return true;
  }, [file, pageCount, selectedPages]);

  const handleSubmit = async () => {
    if (!isFormValid || !file) return;

    setState("PROCESSING");
    setProgress(10);
    setStatusText("Removing selected pages locally in browser...");
    setErrorMessage("");

    try {
      const pagesToDelete = Array.from(selectedPages).sort((a, b) => a - b);
      const outputFilename = file.name.replace(/\.pdf$/i, "") + "_pages_removed.pdf";
      const result = await ClientPdfService.remove(
        file,
        pagesToDelete,
        outputFilename,
        (percent, status) => {
          setProgress(percent);
          setStatusText(status);
        }
      );

      setProcessedOutput(result);
      setProgress(100);
      setState("SUCCESS");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove pages.";
      setErrorMessage(msg);
      setState("ERROR");
    }
  };

  const handleDownload = () => {
    if (processedOutput) {
      ClientPdfService.triggerDownload(processedOutput);
    }
  };

  const totalPagesDisplay = pageCount || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> 100% In-Browser Privacy
        </span>
      </div>

      {/* Feature Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-b from-white to-orange-50/50 border border-orange-200/80 shadow-xs flex items-center justify-center p-2.5 mb-4">
          <Image
            src="/icons/tool-remove.png"
            alt="Remove Pages"
            width={64}
            height={64}
            priority
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Remove PDF Pages
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Select and delete unwanted pages, blank sheets, or confidential sections from your document directly in your browser.
        </p>
      </div>

      {/* Stage 1: Upload Dropzone */}
      {state === "IDLE" && (
        <FileUploadZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          maxFiles={1}
          label="Select a PDF file to remove pages"
          sublabel="or drop a PDF document here"
        />
      )}

      {/* Stage 2: Page Selection Workspace */}
      {state === "FILE_SELECTED" && file && (
        <div className="space-y-6">
          <WorkspaceHeader
            filename={file.name}
            fileSizeBytes={file.size}
            pageCount={pageCount}
            isDetecting={isDetectingPages}
            onReset={handleReset}
            toolName="Remove Tool"
            toolIcon={
              <Image
                src="/icons/tool-remove.png"
                alt="Remove Pages"
                width={28}
                height={28}
                className="w-6 h-6 object-contain"
              />
            }
          />

          <PdfPageGrid
            totalPages={totalPagesDisplay}
            selectedCount={selectedPages.size}
            toolbarLeft={
              <>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Mark all pages for deletion"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                  <span>Select All</span>
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Clear all page selections"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deselect All</span>
                </button>
                <button
                  type="button"
                  onClick={selectOdd}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  + Odd Pages
                </button>
                <button
                  type="button"
                  onClick={selectEven}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  + Even Pages
                </button>
              </>
            }
            toolbarRight={
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Range e.g. 2-4"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyRangeInput();
                    }
                  }}
                  className="w-28 px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={applyRangeInput}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  Mark Range
                </button>
              </div>
            }
            infoBanner={
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 w-full flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>
                    Click thumbnails to mark pages for removal. Red outlined pages will be deleted.
                  </span>
                </div>
                {pageCount && (
                  <div>
                    {selectedPages.size >= pageCount ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Cannot remove all pages!
                      </span>
                    ) : (
                      <span>
                        Resulting document: <strong className="text-orange-600 font-bold">{remainingPagesCount}</strong> {remainingPagesCount === 1 ? "page" : "pages"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            }
          >
            {Array.from({ length: totalPagesDisplay }, (_, i) => i + 1).map((pageNum) => {
              const isMarked = selectedPages.has(pageNum);

              return (
                <PdfThumbnailCard
                  key={pageNum}
                  docId={file.name}
                  buffer={fileBuffer}
                  pageNumber={pageNum}
                  isMarkedForRemoval={isMarked}
                  onClick={() => togglePage(pageNum)}
                  onOpenZoom={(p) => setZoomPage(p)}
                  badgeSlot={
                    isMarked ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">
                        Delete
                      </span>
                    ) : null
                  }
                  actionsSlot={
                    <button
                      type="button"
                      onClick={() => togglePage(pageNum)}
                      className={`w-full py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isMarked
                          ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-rose-600"
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isMarked ? "Marked to Delete" : "Mark for Removal"}</span>
                    </button>
                  }
                />
              );
            })}
          </PdfPageGrid>

          {/* Validation warning when all pages marked */}
          {selectedPages.size >= (pageCount || 0) && (
            <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 text-xs border border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                You cannot delete every page from the PDF. At least one page must remain.
              </span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!isFormValid}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {selectedPages.size === 0
                  ? "Select Pages to Remove"
                  : `Remove ${selectedPages.size} ${selectedPages.size === 1 ? "Page" : "Pages"}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Stage 3: Job Progress */}
      {state === "PROCESSING" && (
        <JobProgressBar progress={progress} statusText={statusText} />
      )}

      {/* Stage 4: Success View */}
      {state === "SUCCESS" && processedOutput && (
        <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Pages Removed Successfully!
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Removed {selectedPages.size} {selectedPages.size === 1 ? "page" : "pages"}. Processed locally in your browser.
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

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Resulting PDF</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Remove Pages from Another PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Stage 5: Error View */}
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
                : "Removal Error"}
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
          totalPages={pageCount || 1}
          onNavigate={(newPage) => setZoomPage(newPage)}
          rotation={0}
        />
      )}
    </div>
  );
}
