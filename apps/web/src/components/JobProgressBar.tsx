"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface JobProgressBarProps {
  progress: number;
  statusText?: string;
  subtext?: string;
}

export const JobProgressBar: React.FC<JobProgressBarProps> = ({
  progress,
  statusText = "Processing documents...",
  subtext = "Processing document streams locally in your browser",
}) => {
  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        {statusText}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {subtext}
      </p>

      <div className="mt-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-400">
        <span>Processing</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
};
