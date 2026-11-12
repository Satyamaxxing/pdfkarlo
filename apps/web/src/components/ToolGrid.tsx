import React from "react";
import Link from "next/link";
import {
  Layers,
  Split,
  RotateCw,
  ArrowUpDown,
  Trash2,
  Clock,
} from "lucide-react";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  color: string;
  href: string;
}

const LAUNCH_TOOLS: ToolItem[] = [
  {
    id: "merge",
    name: "Merge PDF",
    description: "Combine multiple PDF documents into a single unified file in your preferred order.",
    icon: Layers,
    color: "from-blue-500 to-indigo-600",
    href: "/merge",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Extract specific page ranges, extract single sheets, or burst each page into standalone files.",
    icon: Split,
    color: "from-amber-500 to-orange-600",
    href: "/split",
  },
  {
    id: "rotate",
    name: "Rotate PDF",
    description: "Rotate document pages by 90, 180, or 270 degrees with persistent orientation preservation.",
    icon: RotateCw,
    color: "from-cyan-500 to-blue-600",
    href: "/rotate",
  },
  {
    id: "reorder",
    name: "Reorder Pages",
    description: "Visually resequence document pages via client-side preview and drag-and-drop orchestration.",
    icon: ArrowUpDown,
    color: "from-teal-500 to-emerald-600",
    href: "/reorder",
  },
  {
    id: "remove",
    name: "Remove Pages",
    description: "Delete unwanted pages or confidential sheets from your document before sharing.",
    icon: Trash2,
    color: "from-red-500 to-rose-600",
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
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${tool.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Ready
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Launch Tool</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Post-Launch Roadmap Section */}
      <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Post-Launch Roadmap Tools</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ROADMAP_TOOLS.map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-left"
            >
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              <span className="inline-block mt-2 text-[10px] font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                Post-Launch
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
