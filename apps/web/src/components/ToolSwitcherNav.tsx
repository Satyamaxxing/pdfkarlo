"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export type ToolId = "merge" | "split" | "rotate" | "reorder" | "remove";

interface ToolSwitcherNavProps {
  currentTool: ToolId;
}

const TOOLS: { id: ToolId; name: string; href: string; iconSrc: string }[] = [
  { id: "merge", name: "Merge", href: "/merge", iconSrc: "/icons/tool-merge.png" },
  { id: "split", name: "Split", href: "/split", iconSrc: "/icons/tool-split.png" },
  { id: "rotate", name: "Rotate", href: "/rotate", iconSrc: "/icons/tool-rotate.png" },
  { id: "reorder", name: "Reorder", href: "/reorder", iconSrc: "/icons/tool-reorder.png" },
  { id: "remove", name: "Remove", href: "/remove", iconSrc: "/icons/tool-remove.png" },
];

export const ToolSwitcherNav: React.FC<ToolSwitcherNavProps> = ({ currentTool }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors group w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to All Tools</span>
      </Link>

      {/* Sleek Segmented Tool Switcher */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/80 rounded-2xl overflow-x-auto max-w-full shadow-2xs">
        {TOOLS.map((tool) => {
          const isActive = tool.id === currentTool;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white text-orange-600 shadow-xs border border-orange-200/80 scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <div className="w-4 h-4 flex-shrink-0 relative">
                <Image
                  src={tool.iconSrc}
                  alt={tool.name}
                  width={16}
                  height={16}
                  className="w-full h-full object-contain"
                />
              </div>
              <span>{tool.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
