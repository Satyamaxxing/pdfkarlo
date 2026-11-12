import React from "react";
import { ToolGrid } from "@/components/ToolGrid";
import { ShieldCheck, Zap, Cpu, Code2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center py-12 lg:py-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-6">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Independently Built • Fast • 100% In-Browser</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto">
          Every tool you need to work with PDFs, in one place.
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          100% free, private, and secure. Your PDFs are processed locally in your browser. PDF files are not uploaded to our servers.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>No Server Uploads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span>100% In-Browser Privacy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span>Zero Tracking or Data Retention</span>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <ToolGrid />

      {/* Architecture Highlights */}
      <section id="security" className="mt-20 py-16 border-t border-slate-200 dark:border-slate-800 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Engineered for Security and Reliability
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
            Designed from first principles to process documents directly on your device with strict safety limits and total privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Magic-Byte Validation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every file is validated at the binary level for authentic PDF signatures before processing, blocking corrupted files and malformed payloads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">In-Browser Web Workers</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Document processing runs locally in your browser using isolated Web Worker threads. Your PDF files never leave your device or touch a remote server.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Permissive Open-Source Foundation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              100% clean Apache-2.0 and MIT client engine powered by pdf-lib, JSZip, and modern Web standards. Zero AGPL exposure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
