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
      className={`rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
        isDragging
          ? "border-orange-500 bg-orange-50/70 scale-[1.01] shadow-xl shadow-orange-500/10"
          : "border-orange-200/90 bg-white/90 hover:border-orange-500 hover:bg-orange-50/20 hover:shadow-xl hover:shadow-orange-500/10"
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
      <div className="inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-base sm:text-lg font-extrabold bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/25 hover:shadow-2xl hover:shadow-orange-600/35 hover:scale-[1.03] active:scale-[0.98] transition-all">
        <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        <span>{buttonText}</span>
      </div>

      {/* Clear Drop Sublabel */}
      <p className="text-xs sm:text-sm font-semibold text-slate-500">
        {sublabel}
      </p>

      {/* Minimal Privacy Reassurance */}
      <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1">
        Up to 50MB per file &bull; 100% In-Browser Privacy
      </p>
    </div>
  );
};
