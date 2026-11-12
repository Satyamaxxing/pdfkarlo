"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { FileUploadZone } from "@/components/FileUploadZone";
import { JobProgressBar } from "@/components/JobProgressBar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { PdfPageGrid } from "@/components/workspace/PdfPageGrid";
import { PdfThumbnailCard } from "@/components/workspace/PdfThumbnailCard";
import { PagePreviewModal } from "@/components/workspace/PagePreviewModal";
import {
  Split,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  ShieldCheck,
  Check,
  Archive,
  Layers,
  Sparkles,
  Info,
  Lock,
  FileText,
} from "lucide-react";
import { ClientPdfService } from "@/lib/pdf/clientPdfService";
import { ProcessedOutput, SplitMode } from "@/lib/pdf/types";

type SplitState = "IDLE" | "FILE_SELECTED" | "PROCESSING" | "SUCCESS" | "ERROR";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function SplitPdfPage() {
  const [state, setState] = useState<SplitState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isDetectingPages, setIsDetectingPages] = useState<boolean>(false);

  // Split Configuration
  const [mode, setMode] = useState<SplitMode>("range");
  const [rangesInput, setRangesInput] = useState<string>("1-2");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set([1]));

  // High-res preview modal state
  const [zoomPage, setZoomPage] = useState<number | null>(null);

  // Progress & Execution
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // When a file is selected, inspect total pages and check encryption client-side
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

      if (inspection.pageCount === 1) {
        setRangesInput("1-1");
        setSelectedPages(new Set([1]));
      } else {
        const half = Math.ceil(inspection.pageCount / 2);
        setRangesInput(`1-${half}, ${half + 1}-${inspection.pageCount}`);
        setSelectedPages(new Set([1]));
      }
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
    setMode("range");
    setRangesInput("1-2");
    setSelectedPages(new Set([1]));
    setZoomPage(null);
    setProgress(0);
    setProcessedOutput(null);
    setErrorMessage("");
    setState("IDLE");
  };

  const togglePageSelection = (p: number) => {
    const updated = new Set(selectedPages);
    if (updated.has(p)) {
      if (updated.size > 1) {
        updated.delete(p);
      }
    } else {
      updated.add(p);
    }
    setSelectedPages(updated);
  };

  const selectAllPages = () => {
    if (!pageCount) return;
    const all = new Set<number>();
    for (let i = 1; i <= pageCount; i++) {
      all.add(i);
    }
    setSelectedPages(all);
  };

  const clearPageSelection = () => {
    setSelectedPages(new Set([1]));
  };

  // Compute page-to-part mapping for Range mode visual feedback
  const rangeAssignments = useMemo(() => {
    if (mode !== "range" || !rangesInput.trim()) return {};
    const map: Record<number, number> = {};
    const parts = rangesInput.split(",").map((s) => s.trim()).filter(Boolean);
    parts.forEach((part, partIdx) => {
      const match = part.match(/^(\d+)(?:-(\d+))?$/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : start;
        if (start >= 1 && end >= start) {
          for (let p = start; p <= end; p++) {
            map[p] = partIdx + 1;
          }
        }
      }
    });
    return map;
  }, [mode, rangesInput]);

  // Validation
  const validationError = useMemo(() => {
    if (mode === "range") {
      if (!rangesInput.trim()) return "Please enter at least one page range (e.g. 1-2).";
      const parts = rangesInput.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length === 0) return "Please enter a valid page range.";

      const seen = new Set<number>();
      for (const part of parts) {
        const match = part.match(/^(\d+)(?:-(\d+))?$/);
        if (!match) return `Invalid range syntax "${part}". Use format e.g. 1-3 or 5.`;
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : start;
        if (start < 1) return `Range start must be >= 1 in "${part}".`;
        if (end < start) return `Start page cannot exceed end page in "${part}".`;
        if (pageCount && (start > pageCount || end > pageCount)) {
          return `Range "${part}" exceeds total document pages (${pageCount}).`;
        }
        for (let p = start; p <= end; p++) {
          if (seen.has(p)) {
            return `Overlapping range detected for page ${p}. Ranges must be distinct.`;
          }
          seen.add(p);
        }
      }
    } else if (mode === "extract") {
      if (selectedPages.size === 0) return "Please select at least one page to extract.";
    }
    return null;
  }, [mode, rangesInput, selectedPages, pageCount]);

  const handleSubmit = async () => {
    if (!file || validationError) return;

    setState("PROCESSING");
    setProgress(10);
    setStatusText("Preparing split operation locally in browser...");
    setErrorMessage("");

    try {
      const result = await ClientPdfService.split(
        file,
        mode,
        {
          ranges: mode === "range" ? rangesInput : undefined,
          selectedPages: mode === "extract" ? Array.from(selectedPages).sort((a, b) => a - b) : undefined,
        },
        (percent, status) => {
          setProgress(percent);
          setStatusText(status);
        }
      );

      setProcessedOutput(result);
      setProgress(100);
      setState("SUCCESS");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to split PDF document.");
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
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 100% In-Browser Privacy
        </span>
      </div>

      {/* Tool Title */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md mb-3">
          <Split className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Split PDF File
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Extract pages or split into independent PDF documents locally in your browser. Fast, secure, and 100% private.
        </p>
      </div>

      {/* Step 1: Upload Zone */}
      {state === "IDLE" && (
        <FileUploadZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          maxFiles={1}
          label="Select a PDF file to split"
          sublabel="or drop a PDF document here"
        />
      )}

      {/* Step 2: Configuration View */}
      {state === "FILE_SELECTED" && file && (
        <div className="space-y-6">
          <WorkspaceHeader
            filename={file.name}
            fileSizeBytes={file.size}
            pageCount={pageCount}
            isDetecting={isDetectingPages}
            onReset={handleReset}
            toolName="Split Tool"
            toolIcon={<Split className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          />

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mode A: Range */}
            <button
              type="button"
              onClick={() => setMode("range")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                mode === "range"
                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 shadow-sm ring-1 ring-amber-500"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                {mode === "range" && <Check className="w-4 h-4 text-amber-600" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Split by Ranges</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Define custom ranges like 1-3, 4-6 to create separate files.
              </p>
            </button>

            {/* Mode B: Extract Pages */}
            <button
              type="button"
              onClick={() => setMode("extract")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                mode === "extract"
                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 shadow-sm ring-1 ring-amber-500"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                {mode === "extract" && <Check className="w-4 h-4 text-amber-600" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Extract Specific Pages</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Select specific pages to combine into a single new PDF.
              </p>
            </button>

            {/* Mode C: Burst Mode */}
            <button
              type="button"
              onClick={() => setMode("burst")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                mode === "burst"
                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 shadow-sm ring-1 ring-amber-500"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Archive className="w-4 h-4" />
                </div>
                {mode === "burst" && <Check className="w-4 h-4 text-amber-600" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Extract Every Page (Burst)</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Generate independent single-page PDFs packaged in a ZIP archive.
              </p>
            </button>
          </div>

          {/* Mode Controls Banner */}
          {mode === "range" && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Page Ranges (comma-separated)
                </label>
                <input
                  type="text"
                  value={rangesInput}
                  onChange={(e) => setRangesInput(e.target.value)}
                  placeholder="e.g. 1-2, 3-5"
                  className="w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Pages 1 to {pageCount || 1} available</span>
              </div>
            </div>
          )}

          {mode === "burst" && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-sm flex items-center gap-3">
              <Archive className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Burst Extraction ({pageCount || "All"} Pages):
                </span>{" "}
                <span className="text-amber-700 dark:text-amber-400">
                  Every page below will be extracted as a separate PDF and packaged into a ZIP archive.
                </span>
              </div>
            </div>
          )}

          {/* Visual Interactive Page Grid */}
          <PdfPageGrid
            totalPages={totalPagesDisplay}
            selectedCount={mode === "extract" ? selectedPages.size : undefined}
            toolbarLeft={
              mode === "extract" ? (
                <>
                  <button
                    type="button"
                    onClick={selectAllPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearPageSelection}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Reset Selection
                  </button>
                </>
              ) : mode === "range" ? (
                <span className="text-xs text-slate-500">
                  Thumbnail colors below reflect your configured range partitions.
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  All pages will be converted into standalone single-page PDFs.
                </span>
              )
            }
            infoBanner={
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>
                  {mode === "extract"
                    ? "Click cards to choose pages to include in the extracted PDF. Click the zoom icon to inspect full-size pages."
                    : mode === "range"
                    ? "Review page previews to confirm range cut points. Click the zoom icon on any page to inspect."
                    : "Review all document pages to be burst into individual files."}
                </span>
              </div>
            }
          >
            {Array.from({ length: totalPagesDisplay }, (_, i) => i + 1).map((pageNum) => {
              const isExtractSelected = mode === "extract" && selectedPages.has(pageNum);
              const partNum = rangeAssignments[pageNum];

              let badge = null;
              if (mode === "range") {
                badge = partNum ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[9px] font-bold">
                    Part #{partNum}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-slate-400 text-white text-[9px] font-medium">
                    Omit
                  </span>
                );
              } else if (mode === "burst") {
                badge = (
                  <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold">
                    File #{pageNum}
                  </span>
                );
              }

              return (
                <PdfThumbnailCard
                  key={pageNum}
                  docId={file.name}
                  buffer={fileBuffer}
                  pageNumber={pageNum}
                  isSelected={isExtractSelected}
                  onClick={mode === "extract" ? () => togglePageSelection(pageNum) : undefined}
                  onOpenZoom={(p) => setZoomPage(p)}
                  badgeSlot={badge}
                  actionsSlot={
                    mode === "extract" ? (
                      <button
                        type="button"
                        onClick={() => togglePageSelection(pageNum)}
                        className={`w-full py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          isExtractSelected
                            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{isExtractSelected ? "Included" : "Include Page"}</span>
                      </button>
                    ) : null
                  }
                />
              );
            })}
          </PdfPageGrid>

          {/* Validation Error banner */}
          {validationError && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={Boolean(validationError)}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Split className="w-4 h-4" />
              <span>
                {mode === "burst"
                  ? "Extract Every Page (ZIP)"
                  : mode === "extract"
                  ? `Extract ${selectedPages.size} ${selectedPages.size === 1 ? "Page" : "Pages"}`
                  : "Split PDF Document"}
              </span>
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
        <div className="max-w-xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              PDF Split Successfully!
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Processed locally in your browser. Files never left your machine.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-left text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {processedOutput.mimeType === "application/zip" ? (
                  <Archive className="w-4 h-4 text-amber-500" />
                ) : (
                  <FileText className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {processedOutput.filename}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {formatBytes(processedOutput.fileSizeBytes)}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Ready for instant download
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {processedOutput.mimeType === "application/zip" ? (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Download ZIP Archive ({formatBytes(processedOutput.fileSizeBytes)})</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Split PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Split Another PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Error State */}
      {state === "ERROR" && (
        <div className="max-w-lg mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-950 shadow-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
            {errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("encrypt") ? (
              <Lock className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("encrypt")
                ? "Password-Protected PDF"
                : "Processing Error"}
            </h2>
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
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
