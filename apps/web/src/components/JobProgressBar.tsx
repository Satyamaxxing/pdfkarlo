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
    <div className="w-full max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-md text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>

      <h3 className="text-lg font-bold text-slate-900">
        {statusText}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        {subtext}
      </p>

      <div className="mt-6 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[11px] font-bold text-slate-400">
        <span>Processing</span>
        <span className="text-orange-600 font-extrabold">{progress}%</span>
      </div>
    </div>
  );
};
