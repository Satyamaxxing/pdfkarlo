"use client";

import React from "react";
import { FileText, X, ShieldCheck, Loader2 } from "lucide-react";

interface WorkspaceHeaderProps {
  filename: string;
  fileSizeBytes: number;
  pageCount: number | null;
  isDetecting?: boolean;
  onReset: () => void;
  toolName?: string;
  toolIcon?: React.ReactNode;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  filename,
  fileSizeBytes,
  pageCount,
  isDetecting = false,
  onReset,
  toolName,
  toolIcon,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          {toolIcon || <FileText className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={filename}>
              {filename}
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" /> Local
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{formatBytes(fileSizeBytes)}</span>
            <span>&bull;</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {isDetecting ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Counting pages...
                </span>
              ) : pageCount !== null ? (
                `${pageCount} ${pageCount === 1 ? "page" : "pages"}`
              ) : (
                "Document loaded"
              )}
            </span>
            {toolName && (
              <>
                <span className="hidden md:inline">&bull;</span>
                <span className="hidden md:inline text-slate-400">{toolName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Choose a different PDF file"
        >
          <X className="w-3.5 h-3.5" />
          <span>Change Document</span>
        </button>
      </div>
    </div>
  );
};
