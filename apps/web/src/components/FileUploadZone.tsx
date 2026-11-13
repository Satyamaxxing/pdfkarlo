"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText } from "lucide-react";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  sublabel?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  accept = ".pdf,application/pdf",
  multiple = true,
  maxFiles = 20,
  label = "Select PDF files",
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
      className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 shadow-xs ${
        isDragging
          ? "border-orange-500 bg-orange-50/70 scale-[1.01]"
          : "border-orange-300/80 bg-white/90 hover:border-orange-500 hover:bg-orange-50/30 hover:shadow-md hover:shadow-orange-500/10"
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

      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 mb-4">
        <UploadCloud className="w-8 h-8 stroke-[2.2]" />
      </div>

      <h3 className="text-xl font-bold text-slate-900">
        {label}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {sublabel}
      </p>

      <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20 transition-all">
        <FileText className="w-4 h-4" />
        <span>Choose Files</span>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Up to 50MB per file &bull; Processed locally in your browser
      </p>
    </div>
  );
};
