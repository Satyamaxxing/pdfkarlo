import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  iconSrc: string;
  href: string;
}

const LAUNCH_TOOLS: ToolItem[] = [
  {
    id: "merge",
    name: "Merge PDF",
    description: "Combine multiple PDF documents into a single unified file in your preferred order.",
    iconSrc: "/icons/tool-merge.png",
    href: "/merge",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Extract specific page ranges, extract single sheets, or burst each page into standalone files.",
    iconSrc: "/icons/tool-split.png",
    href: "/split",
  },
  {
    id: "rotate",
    name: "Rotate PDF",
    description: "Rotate document pages by 90, 180, or 270 degrees with persistent orientation preservation.",
    iconSrc: "/icons/tool-rotate.png",
    href: "/rotate",
  },
  {
    id: "reorder",
    name: "Reorder Pages",
    description: "Visually resequence document pages via client-side preview and drag-and-drop orchestration.",
    iconSrc: "/icons/tool-reorder.png",
    href: "/reorder",
  },
  {
    id: "remove",
    name: "Remove Pages",
    description: "Delete unwanted pages or confidential sheets from your document before sharing.",
    iconSrc: "/icons/tool-remove.png",
    href: "/remove",
  },
];

const ROADMAP_TOOLS = [
  { name: "Protect PDF (AES-256)", desc: "Password-protect documents" },
  { name: "Unlock PDF", desc: "Remove restrictions" },
  { name: "Compress PDF", desc: "Stream compaction" },
  { name: "JPG to PDF", desc: "Encapsulate images" },
  { name: "PDF to JPG", desc: "High-res rasterization" },
];

export const ToolGrid: React.FC = () => {
  return (
    <section id="tools" className="pb-12">
      {/* 5 Launch MVP Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {LAUNCH_TOOLS.map((tool) => {
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-500 transition-all duration-200"
            >
              <div className="w-14 h-14 mb-4 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src={tool.iconSrc}
                  alt={tool.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                />
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                {tool.name}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {tool.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Post-Launch Roadmap Section */}
      <div className="mt-16 pt-10 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>Post-Launch Roadmap Tools</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ROADMAP_TOOLS.map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-white/80 text-left hover:border-orange-300 transition-colors"
            >
              <div className="text-xs font-bold text-slate-800">{item.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              <span className="inline-block mt-2 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Post-Launch
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
