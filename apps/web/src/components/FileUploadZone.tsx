"use client";

import React, { useRef, useState } from "react";
import { Plus } from "lucide-react";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  sublabel?: string;
  buttonText?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  accept = ".pdf,application/pdf",
  multiple = true,
  maxFiles = 20,
  buttonText = "Select PDF files",
  sublabel = "or drop PDFs here",
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
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
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
      className={`relative w-full max-w-xl mx-auto py-8 sm:py-10 px-6 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center ${
        isDragging
          ? "bg-orange-50/90 border-2 border-dashed border-orange-500 ring-8 ring-orange-500/10 scale-[1.02] shadow-2xl shadow-orange-500/15"
          : "bg-transparent border-2 border-transparent"
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

      {/* Prominent Primary PDF Button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group inline-flex items-center justify-center gap-3.5 px-10 sm:px-14 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-base sm:text-xl shadow-xl shadow-orange-600/30 hover:shadow-2xl hover:shadow-orange-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
        <span>{buttonText}</span>
      </button>

      {/* Clear Drop Sublabel */}
      <p className="mt-3.5 text-xs sm:text-sm font-medium text-slate-400">
        {isDragging ? "Drop your PDF files here" : sublabel}
      </p>

      {/* Unique PDFKarlo Trust Micro-Pill */}
      <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/80 text-slate-500 text-xs font-semibold backdrop-blur-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>100% In-Browser &bull; Zero Server Uploads &bull; Max 50MB</span>
      </div>
    </div>
  );
};
