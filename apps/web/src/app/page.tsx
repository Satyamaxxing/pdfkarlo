import React from "react";
import { ToolGrid } from "@/components/ToolGrid";
import { ShieldCheck, Cpu, Code2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center py-12 lg:py-16">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Every tool you need to work with PDFs, in one place.
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Fast, private, and browser-local. All document manipulation runs entirely on your device with isolated Web Workers — no server uploads, no data retention.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero Server Uploads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Client-Side Web Workers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Zero Data Retention</span>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <ToolGrid />

      {/* Architecture Highlights */}
      <section id="security" className="mt-20 py-16 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for Security and Reliability
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Designed from first principles to process documents directly on your device with strict safety limits and total privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4 border border-orange-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Magic-Byte Validation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every file is validated at the binary level for authentic PDF signatures before processing, blocking corrupted files and malformed payloads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4 border border-orange-100">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">In-Browser Web Workers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Document processing runs locally in your browser using isolated Web Worker threads. Your PDF files never leave your device or touch a remote server.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4 border border-orange-100">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Permissive Open-Source Foundation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              100% clean Apache-2.0 and MIT client engine powered by pdf-lib, JSZip, and modern Web standards. Zero AGPL exposure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
