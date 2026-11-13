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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
          {toolIcon || <FileText className="w-5 h-5 text-orange-600" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 truncate" title={filename}>
              {filename}
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
              <ShieldCheck className="w-3 h-3 text-orange-600" /> Local
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{formatBytes(fileSizeBytes)}</span>
            <span>&bull;</span>
            <span className="font-semibold text-slate-700">
              {isDetecting ? (
                <span className="inline-flex items-center gap-1 text-orange-600">
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
                <span className="hidden md:inline text-orange-600/80 font-medium">{toolName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-transparent transition-all cursor-pointer"
          title="Choose a different PDF file"
        >
          <X className="w-3.5 h-3.5" />
          <span>Change Document</span>
        </button>
      </div>
    </div>
  );
};
