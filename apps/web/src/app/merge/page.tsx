"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileUploadZone } from "@/components/FileUploadZone";
import { JobProgressBar } from "@/components/JobProgressBar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { PdfPageGrid } from "@/components/workspace/PdfPageGrid";
import { PdfThumbnailCard } from "@/components/workspace/PdfThumbnailCard";
import { PagePreviewModal } from "@/components/workspace/PagePreviewModal";
import { ToolSwitcherNav } from "@/components/ToolSwitcherNav";
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  ShieldCheck,
  Lock,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  Eye,
  FolderOpen,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ClientPdfService } from "@/lib/pdf/clientPdfService";
import { ProcessedOutput } from "@/lib/pdf/types";

type MergeState = "IDLE" | "FILES_SELECTED" | "PROCESSING" | "SUCCESS" | "ERROR";

interface MergeDocItem {
  id: string;
  file: File;
  buffer: ArrayBuffer | null;
  pageCount: number | null;
  isInspecting: boolean;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function MergePdfPage() {
  const [state, setState] = useState<MergeState>("IDLE");
  const [docs, setDocs] = useState<MergeDocItem[]>([]);
  const [viewMode, setViewMode] = useState<"unified" | "by-document">("unified");

  // High-res preview modal state
  const [zoomTarget, setZoomTarget] = useState<{
    docId: string;
    buffer: ArrayBuffer;
    pageNumber: number;
    totalPages: number;
  } | null>(null);

  // Progress & Execution state
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [processedOutput, setProcessedOutput] = useState<ProcessedOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = async (newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;

    // Create initial items
    const newItems: MergeDocItem[] = newFiles.map((file, idx) => ({
      id: `${file.name}-${file.lastModified}-${Date.now()}-${idx}`,
      file,
      buffer: null,
      pageCount: null,
      isInspecting: true,
    }));

    setDocs((prev) => [...prev, ...newItems]);
    setState("FILES_SELECTED");
    setErrorMessage("");

    // Inspect each new file in background
    for (const item of newItems) {
      try {
        const buffer = await item.file.arrayBuffer();
        const inspection = await ClientPdfService.inspectFile(item.file);
        setDocs((prev) =>
          prev.map((d) =>
            d.id === item.id
              ? {
                  ...d,
                  buffer,
                  pageCount: inspection.pageCount,
                  isInspecting: false,
                }
              : d
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to inspect PDF.";
        setDocs((prev) =>
          prev.map((d) =>
            d.id === item.id
              ? {
                  ...d,
                  isInspecting: false,
                  error: msg,
                }
              : d
          )
        );
      }
    }
  };

  const handleRemoveDoc = (index: number) => {
    const updated = docs.filter((_, idx) => idx !== index);
    setDocs(updated);
    if (updated.length === 0) {
      setState("IDLE");
    }
  };

  const moveDoc = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= docs.length) return;
    const updated = [...docs];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setDocs(updated);
  };

  const handleReset = () => {
    setDocs([]);
    setZoomTarget(null);
    setProcessedOutput(null);
    setProgress(0);
    setErrorMessage("");
    setState("IDLE");
  };

  // Check if any document has an inspection error or encryption
  const hasEncryptedOrErrorDoc = useMemo(() => {
    return docs.some((d) => Boolean(d.error));
  }, [docs]);

  // Compute total combined pages across all documents
  const totalCombinedPages = useMemo(() => {
    return docs.reduce((sum, d) => sum + (d.pageCount || 0), 0);
  }, [docs]);

  // Total combined bytes
  const totalCombinedBytes = useMemo(() => {
    return docs.reduce((sum, d) => sum + d.file.size, 0);
  }, [docs]);

  // Flat list of all pages across all documents for Unified Sequence View
  const unifiedPageSequence = useMemo(() => {
    const list: Array<{
      docIndex: number;
      docId: string;
      docName: string;
      buffer: ArrayBuffer | null;
      pageNumber: number;
      totalPages: number;
      globalIndex: number;
    }> = [];

    let globalCounter = 1;
    docs.forEach((d, docIdx) => {
      const count = d.pageCount || 0;
      for (let p = 1; p <= count; p++) {
        list.push({
          docIndex: docIdx + 1,
          docId: d.id,
          docName: d.file.name,
          buffer: d.buffer,
          pageNumber: p,
          totalPages: count,
          globalIndex: globalCounter++,
        });
      }
    });

    return list;
  }, [docs]);

  const handleMergeSubmit = async () => {
    if (docs.length < 2 || hasEncryptedOrErrorDoc) return;

    setState("PROCESSING");
    setProgress(10);
    setStatusText("Preparing document streams locally in browser...");
    setErrorMessage("");

    try {
      const orderedFiles = docs.map((d) => d.file);
      const result = await ClientPdfService.merge(
        orderedFiles,
        "merged_document.pdf",
        (percent, status) => {
          setProgress(percent);
          setStatusText(status);
        }
      );

      setProcessedOutput(result);
      setProgress(100);
      setState("SUCCESS");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to merge PDF documents.";
      setErrorMessage(msg);
      setState("ERROR");
    }
  };

  const handleDownload = () => {
    if (processedOutput) {
      ClientPdfService.triggerDownload(processedOutput);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Studio Navigation & Tool Switcher */}
      <ToolSwitcherNav currentTool="merge" />

      {/* Stage Area when in IDLE */}
      {state === "IDLE" && (
        <div className="max-w-2xl mx-auto py-8 sm:py-14 flex flex-col items-center justify-center text-center space-y-6">
          {/* Focused Title */}
          <div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/icons/tool-merge.png"
                alt="Merge PDF"
                width={80}
                height={80}
                priority
                className="w-full h-full object-contain drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Merge PDF Files
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-500 font-normal max-w-lg mx-auto">
              Combine multiple PDFs into a single unified file.
            </p>
          </div>

          {/* Simple, High-Impact Upload Zone */}
          <FileUploadZone
            onFilesSelected={handleFilesAdded}
            multiple={true}
            maxFiles={10}
            buttonText="Select PDF files"
            sublabel="or drop PDFs here"
          />
        </div>
      )}

      {/* Step 2: Multi-Document Workspace */}
      {state === "FILES_SELECTED" && (
        <div className="space-y-6">
          <input
            ref={addMoreInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFilesAdded(Array.from(e.target.files));
            }}
            className="hidden"
          />

          <WorkspaceHeader
            filename={`${docs.length} ${docs.length === 1 ? "Document" : "Documents"} Selected`}
            fileSizeBytes={totalCombinedBytes}
            pageCount={totalCombinedPages > 0 ? totalCombinedPages : null}
            isDetecting={docs.some((d) => d.isInspecting)}
            onReset={handleReset}
            toolName="Merge Tool"
            toolIcon={
              <Image
                src="/icons/tool-merge.png"
                alt="Merge PDF"
                width={28}
                height={28}
                className="w-6 h-6 object-contain"
              />
            }
          />

          {/* Document Order Management Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Document Merge Order ({docs.length})
              </span>
              <button
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More PDFs</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {docs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    doc.error
                      ? "bg-rose-50/70 border-rose-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-orange-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate" title={doc.file.name}>
                        {doc.file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatBytes(doc.file.size)} &bull;{" "}
                        {doc.isInspecting
                          ? "Loading pages..."
                          : doc.error
                          ? "Encrypted/Unsupported"
                          : `${doc.pageCount} ${doc.pageCount === 1 ? "Page" : "Pages"}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveDoc(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                      title="Move up in merge sequence"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDoc(idx, idx + 1)}
                      disabled={idx === docs.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                      title="Move down in merge sequence"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasEncryptedOrErrorDoc && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  One or more documents are password-protected or unsupported. Please remove encrypted files before merging.
                </span>
              </div>
            )}
          </div>

          {/* View Mode Toggle & Page Preview Area */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("unified")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "unified"
                    ? "bg-orange-600 text-white shadow-sm shadow-orange-500/20"
                    : "bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Unified Sequence ({totalCombinedPages} Pages)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("by-document")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "by-document"
                    ? "bg-orange-600 text-white shadow-sm shadow-orange-500/20"
                    : "bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>By Document ({docs.length})</span>
              </button>
            </div>

            <span className="text-xs text-slate-400">
              Click zoom on any card to preview full size.
            </span>
          </div>

          {/* Mode 1: Unified Page Grid (Displays every page from every uploaded document in merge order) */}
          {viewMode === "unified" && (
            <PdfPageGrid
              totalPages={unifiedPageSequence.length}
              infoBanner={
                <div className="flex items-center gap-2 text-xs text-slate-600 px-1 font-medium">
                  <Layers className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span>
                    Displaying every page across all {docs.length} documents in their exact output sequence.
                  </span>
                </div>
              }
            >
              {unifiedPageSequence.map((item) => (
                <PdfThumbnailCard
                  key={`${item.docId}-page-${item.pageNumber}`}
                  docId={item.docId}
                  buffer={item.buffer}
                  pageNumber={item.pageNumber}
                  displayIndex={item.globalIndex}
                  onOpenZoom={() => {
                    if (item.buffer) {
                      setZoomTarget({
                        docId: item.docId,
                        buffer: item.buffer,
                        pageNumber: item.pageNumber,
                        totalPages: item.totalPages,
                      });
                    }
                  }}
                  badgeSlot={
                    <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold truncate max-w-[80px]">
                      Doc #{item.docIndex}
                    </span>
                  }
                  actionsSlot={
                    <div className="text-[10px] text-slate-500 truncate text-center">
                      Doc {item.docIndex} &bull; Page {item.pageNumber}
                    </div>
                  }
                />
              ))}
            </PdfPageGrid>
          )}

          {/* Mode 2: Grouped by Document */}
          {viewMode === "by-document" && (
            <div className="space-y-6">
              {docs.map((doc, docIdx) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-extrabold">
                        #{docIdx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {doc.file.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {formatBytes(doc.file.size)} &bull; {doc.pageCount || 0} Pages
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveDoc(docIdx, docIdx - 1)}
                        disabled={docIdx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 disabled:opacity-20 cursor-pointer"
                        title="Move doc up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDoc(docIdx, docIdx + 1)}
                        disabled={docIdx === docs.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 disabled:opacity-20 cursor-pointer"
                        title="Move doc down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {doc.pageCount && doc.pageCount > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-72 overflow-y-auto p-1">
                      {Array.from({ length: doc.pageCount }, (_, i) => i + 1).map((pageNum) => (
                        <PdfThumbnailCard
                          key={`${doc.id}-p-${pageNum}`}
                          docId={doc.id}
                          buffer={doc.buffer}
                          pageNumber={pageNum}
                          onOpenZoom={() => {
                            if (doc.buffer) {
                              setZoomTarget({
                                docId: doc.id,
                                buffer: doc.buffer,
                                pageNumber: pageNum,
                                totalPages: doc.pageCount || 1,
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {doc.isInspecting ? "Loading page previews..." : doc.error || "No pages found."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Merge Warnings */}
          {docs.length < 2 && (
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Please add at least 2 PDF files to perform a merge operation.</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <button
              type="button"
              disabled={docs.length < 2 || hasEncryptedOrErrorDoc}
              onClick={handleMergeSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>
                Merge {docs.length} PDFs ({totalCombinedPages} Pages)
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
        <div className="max-w-lg mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              PDFs Merged Successfully!
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Combined {processedOutput.pageCount ?? totalCombinedPages} pages locally in your browser. Files never left your machine.
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
              <span>Download Merged PDF</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Merge More PDFs</span>
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
                : "Processing Error"}
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
            Try Again with Different Files
          </button>
        </div>
      )}

      {/* High-Resolution Full-Page Preview Modal */}
      {zoomTarget && (
        <PagePreviewModal
          isOpen={true}
          onClose={() => setZoomTarget(null)}
          docId={zoomTarget.docId}
          buffer={zoomTarget.buffer}
          pageNumber={zoomTarget.pageNumber}
          totalPages={zoomTarget.totalPages}
          onNavigate={(newPage) =>
            setZoomTarget((prev) => (prev ? { ...prev, pageNumber: newPage } : null))
          }
          rotation={0}
        />
      )}
    </div>
  );
}
