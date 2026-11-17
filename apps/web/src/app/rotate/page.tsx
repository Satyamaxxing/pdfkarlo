"use client";

import React, { useState, useEffect } from "react";
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
  RotateCw,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  Lock,
  Compass,
} from "lucide-react";
import { ClientPdfService } from "@/lib/pdf/clientPdfService";
import { ProcessedOutput } from "@/lib/pdf/types";
import { ToolSeoSection } from "@/components/ToolSeoSection";
import { ROTATE_SEO_DATA } from "@/lib/seoData";
import { useWorkspaceUI } from "@/components/WorkspaceUIContext";

type RotateState = "IDLE" | "FILE_SELECTED" | "PROCESSING" | "SUCCESS" | "ERROR";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function RotatePdfPage() {
  const [state, setState] = useState<RotateState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isDetectingPages, setIsDetectingPages] = useState<boolean>(false);
  const { setIsWorkspaceActive } = useWorkspaceUI();

  useEffect(() => {
    setIsWorkspaceActive(state !== "IDLE");
    return () => setIsWorkspaceActive(false);
  }, [state, setIsWorkspaceActive]);

  // Per-page rotation angles (in degrees: 0, 90, 180, 270)
  const [pageAngles, setPageAngles] = useState<Record<number, number>>({});
  // Selected page numbers for bulk actions
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  // High-res preview modal state
  const [zoomPage, setZoomPage] = useState<number | null>(null);

  // Execution & Progress state
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

      const initialAngles: Record<number, number> = {};
      const initialSelected = new Set<number>();
      for (let i = 1; i <= inspection.pageCount; i++) {
        initialAngles[i] = 0;
        initialSelected.add(i);
      }
      setPageAngles(initialAngles);
      setSelectedPages(initialSelected);
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
    setPageAngles({});
    setSelectedPages(new Set());
    setZoomPage(null);
    setProgress(0);
    setProcessedOutput(null);
    setErrorMessage("");
    setState("IDLE");
  };

  // Rotate a single page by +90 degrees clockwise
  const rotateSinglePageCw = (pageNum: number) => {
    setPageAngles((prev) => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + 90) % 360,
    }));
  };

  // Rotate a single page by -90 degrees counter-clockwise
  const rotateSinglePageCcw = (pageNum: number) => {
    setPageAngles((prev) => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + 270) % 360,
    }));
  };

  // Rotate all pages by +90 degrees clockwise
  const rotateAllClockwise = () => {
    const total = pageCount || Object.keys(pageAngles).length || 1;
    const updated: Record<number, number> = {};
    for (let i = 1; i <= total; i++) {
      updated[i] = ((pageAngles[i] || 0) + 90) % 360;
    }
    setPageAngles(updated);
  };

  // Rotate all pages by -90 degrees counter-clockwise
  const rotateAllCounterClockwise = () => {
    const total = pageCount || Object.keys(pageAngles).length || 1;
    const updated: Record<number, number> = {};
    for (let i = 1; i <= total; i++) {
      updated[i] = ((pageAngles[i] || 0) + 270) % 360;
    }
    setPageAngles(updated);
  };

  // Rotate only currently selected pages by +90 degrees
  const rotateSelectedClockwise = () => {
    const updated = { ...pageAngles };
    selectedPages.forEach((pageNum) => {
      updated[pageNum] = ((updated[pageNum] || 0) + 90) % 360;
    });
    setPageAngles(updated);
  };

  // Selection actions
  const selectAllPages = () => {
    const total = pageCount || Object.keys(pageAngles).length || 1;
    const all = new Set<number>();
    for (let i = 1; i <= total; i++) all.add(i);
    setSelectedPages(all);
  };

  const clearPageSelection = () => {
    setSelectedPages(new Set());
  };

  const togglePageSelection = (pageNum: number) => {
    const next = new Set(selectedPages);
    if (next.has(pageNum)) {
      next.delete(pageNum);
    } else {
      next.add(pageNum);
    }
    setSelectedPages(next);
  };

  // Reset all page rotations back to 0 degrees
  const resetAllRotations = () => {
    const total = pageCount || Object.keys(pageAngles).length || 1;
    const updated: Record<number, number> = {};
    for (let i = 1; i <= total; i++) {
      updated[i] = 0;
    }
    setPageAngles(updated);
  };

  const hasRotationsApplied = Object.values(pageAngles).some((a) => a !== 0);

  const handleSubmit = async () => {
    if (!file) return;

    // Filter only pages with non-zero rotations to send to client engine
    const activeRotations: Record<number, number> = {};
    for (const [pageNumStr, deg] of Object.entries(pageAngles)) {
      if (deg !== 0) {
        activeRotations[parseInt(pageNumStr, 10)] = deg;
      }
    }

    if (Object.keys(activeRotations).length === 0) {
      setErrorMessage("Please apply at least one rotation (e.g. 90°, 180°, or 270°) before submitting.");
      return;
    }

    setState("PROCESSING");
    setProgress(15);
    setStatusText("Preparing document pages locally...");
    setErrorMessage("");

    try {
      const outputFilename = file.name.replace(/\.pdf$/i, "") + "_rotated.pdf";
      const result = await ClientPdfService.rotate(
        file,
        activeRotations,
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
      setErrorMessage(err instanceof Error ? err.message : "Failed to rotate PDF document.");
      setState("ERROR");
    }
  };

  const handleDownload = () => {
    if (processedOutput) {
      ClientPdfService.triggerDownload(processedOutput);
    }
  };

  const totalPagesDisplay = pageCount || Object.keys(pageAngles).length || 1;

  return (
    <div
      className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 ${
        state === "IDLE" ? "pb-16 sm:pb-24" : "pb-8 sm:pb-10"
      } flex flex-col`}
    >
      {/* Studio Navigation & Tool Switcher (Elevated at top) */}
      {state === "IDLE" && <ToolSwitcherNav currentTool="rotate" />}

      {/* Step 1: Upload Zone */}
      {state === "IDLE" && (
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center text-center space-y-4 pt-1 sm:pt-3 pb-8 sm:pb-12">
          <div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 flex items-center justify-center">
              <Image
                src="/icons/tool-rotate.png"
                alt="Rotate PDF"
                width={64}
                height={64}
                priority
                className="w-full h-full object-contain drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Rotate PDF Pages
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

      {/* Step 2: Post-Upload Visual Workspace */}
      {state === "FILE_SELECTED" && file && (
        <div className="space-y-6">
          <WorkspaceHeader
            filename={file.name}
            fileSizeBytes={file.size}
            pageCount={pageCount}
            isDetecting={isDetectingPages}
            onReset={handleReset}
            toolName="Rotate Tool"
            toolIcon={
              <Image
                src="/icons/tool-rotate.png"
                alt="Rotate PDF"
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
                  onClick={rotateAllClockwise}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rotate all pages 90° clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5 text-orange-600" />
                  <span>Rotate All (+90°)</span>
                </button>
                <button
                  type="button"
                  onClick={rotateAllCounterClockwise}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rotate all pages 90° counter-clockwise"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                  <span>Rotate All (-90°)</span>
                </button>
                {selectedPages.size > 0 && selectedPages.size < totalPagesDisplay && (
                  <button
                    type="button"
                    onClick={rotateSelectedClockwise}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate {selectedPages.size} Selected (+90°)</span>
                  </button>
                )}
              </>
            }
            toolbarRight={
              <>
                <button
                  type="button"
                  onClick={selectAllPages}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearPageSelection}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
                {hasRotationsApplied && (
                  <button
                    type="button"
                    onClick={resetAllRotations}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Reset Angles
                  </button>
                )}
              </>
            }
            infoBanner={
              <div className="flex items-center gap-2 text-xs text-slate-500 px-1 font-medium">
                <Compass className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span>
                  Click cards to toggle selection, use the rotate buttons on each card, or click the zoom icon to inspect full-size pages.
                </span>
              </div>
            }
          >
            {Array.from({ length: totalPagesDisplay }, (_, i) => i + 1).map((pageNum) => {
              const angle = pageAngles[pageNum] || 0;
              const isSelected = selectedPages.has(pageNum);

              return (
                <PdfThumbnailCard
                  key={pageNum}
                  docId={file.name}
                  buffer={fileBuffer}
                  pageNumber={pageNum}
                  rotation={angle}
                  isSelected={isSelected}
                  onClick={() => togglePageSelection(pageNum)}
                  onOpenZoom={(p) => setZoomPage(p)}
                  badgeSlot={
                    angle !== 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold">
                        +{angle}°
                      </span>
                    ) : null
                  }
                  actionsSlot={
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => rotateSinglePageCcw(pageNum)}
                        className="p-1 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                        title="Rotate -90° (Counter-clockwise)"
                        aria-label={`Rotate page ${pageNum} counter-clockwise`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => rotateSinglePageCw(pageNum)}
                        className="p-1 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                        title="Rotate +90° (Clockwise)"
                        aria-label={`Rotate page ${pageNum} clockwise`}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
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
              disabled={!hasRotationsApplied}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Apply Rotation & Save PDF</span>
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
              PDF Rotated Successfully!
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Orientations updated cleanly with zero image recompression. Processed locally in your browser.
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
              <span>Download Rotated PDF</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rotate Another PDF</span>
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
                : "Rotation Error"}
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

      {/* High-Resolution Full-Page Zoom Lightbox */}
      {zoomPage !== null && (
        <PagePreviewModal
          isOpen={zoomPage !== null}
          onClose={() => setZoomPage(null)}
          pageNumber={zoomPage}
          totalPages={totalPagesDisplay}
          docId={file ? file.name : "doc"}
          buffer={fileBuffer}
          rotation={pageAngles[zoomPage] || 0}
          onNavigate={(nextP) => setZoomPage(nextP)}
        />
      )}
      {/* Crawlable SEO Content, How-To, Technical Explanation, Use Cases & FAQs (only shown in landing state) */}
      {state === "IDLE" && <ToolSeoSection data={ROTATE_SEO_DATA} />}
    </div>
  );
}
