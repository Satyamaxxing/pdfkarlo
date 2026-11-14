"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, FileText, Sparkles, ShieldCheck } from "lucide-react";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  sublabel?: string;
  buttonText?: string;
  toolIconSrc?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  accept = ".pdf,application/pdf",
  multiple = true,
  maxFiles = 20,
  label = "Select PDF files",
  sublabel = "or drop PDFs anywhere here",
  buttonText = "Choose PDF Files",
  toolIconSrc,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.toLowerCase().endsWith(".pdf")
      );
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles.slice(0, maxFiles));
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected.slice(0, maxFiles));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-3xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-300 bg-white border ${
        isDragging
          ? "border-orange-500 shadow-2xl shadow-orange-500/15 scale-[1.008] ring-4 ring-orange-400/20"
          : "border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Inner Drop Arena */}
      <div
        className={`rounded-2xl border-2 border-dashed py-10 px-6 sm:py-14 sm:px-10 transition-colors ${
          isDragging
            ? "border-orange-500 bg-orange-50/60"
            : "border-orange-200/80 bg-gradient-to-b from-orange-50/30 via-white to-slate-50/40 hover:border-orange-400 hover:bg-orange-50/20"
        }`}
      >
        {/* Interactive Stacking Document Artwork */}
        <div className="relative w-28 h-20 mx-auto mb-5 flex items-center justify-center">
          {/* Back Left Card */}
          <div
            className={`absolute w-14 h-18 rounded-xl bg-white border border-slate-200 shadow-sm transition-transform duration-300 flex flex-col justify-between p-1.5 ${
              isDragging
                ? "-rotate-12 -translate-x-6 scale-105"
                : "-rotate-6 -translate-x-3 group-hover:-rotate-12 group-hover:-translate-x-5"
            }`}
          >
            <div className="w-4 h-1.5 rounded-sm bg-slate-200" />
            <div className="space-y-1">
              <div className="w-full h-1 rounded-sm bg-slate-100" />
              <div className="w-3/4 h-1 rounded-sm bg-slate-100" />
            </div>
            <div className="w-3 h-3 rounded-full bg-slate-100 self-end" />
          </div>

          {/* Back Right Card */}
          <div
            className={`absolute w-14 h-18 rounded-xl bg-white border border-slate-200 shadow-sm transition-transform duration-300 flex flex-col justify-between p-1.5 ${
              isDragging
                ? "rotate-12 translate-x-6 scale-105"
                : "rotate-6 translate-x-3 group-hover:rotate-12 group-hover:translate-x-5"
            }`}
          >
            <div className="w-4 h-1.5 rounded-sm bg-orange-200" />
            <div className="space-y-1">
              <div className="w-full h-1 rounded-sm bg-orange-50" />
              <div className="w-2/3 h-1 rounded-sm bg-orange-50" />
            </div>
            <div className="w-3 h-3 rounded-full bg-orange-100 self-end" />
          </div>

          {/* Center Showcase Card */}
          <div
            className={`relative z-10 w-16 h-20 rounded-xl bg-gradient-to-b from-white to-orange-50 border-2 border-orange-300/80 shadow-md flex flex-col items-center justify-center p-2 transition-transform duration-300 ${
              isDragging ? "scale-110 -translate-y-1" : "group-hover:scale-105"
            }`}
          >
            {toolIconSrc ? (
              <div className="w-9 h-9 relative">
                <Image
                  src={toolIconSrc}
                  alt="Tool Icon"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5 stroke-[2.2]" />
              </div>
            )}
            <span className="text-[9px] font-extrabold text-orange-700 tracking-wider mt-1 uppercase">
              PDF
            </span>
          </div>
        </div>

        {/* Labels & Instructions */}
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {label}
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
          {sublabel}
        </p>

        {/* Tactile Primary Action Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 group-hover:scale-[1.02] active:scale-[0.98] transition-all">
            <FileText className="w-4 h-4 stroke-[2.2]" />
            <span>{buttonText}</span>
          </div>
        </div>

        {/* Capability Trust Pills */}
        <div className="mt-7 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 text-slate-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Max 50 MB / file
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 text-slate-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Unlimited Pages
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 text-slate-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Zero Server Uploads
          </span>
        </div>
      </div>
    </div>
  );
};
