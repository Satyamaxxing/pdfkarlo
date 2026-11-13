import React from "react";
import { ToolGrid, RoadmapSection } from "@/components/ToolGrid";
import { ShieldCheck, Cpu, Lock, Code2, Sparkles, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
      {/* 2-Column Split Hero & Tools Workspace */}
      <section id="tools" className="pb-12 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Left Column (Red Box): Heading, Intro & Trust Guarantees */}
          <div className="lg:col-span-5 flex flex-col justify-start lg:sticky lg:top-24 pt-1 sm:pt-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Every tool you need to work with PDFs, in one place.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Fast, private, and browser-local. All document manipulation runs entirely on your device with isolated Web Workers &mdash; no server uploads, no data retention.
            </p>

            {/* Core Trust & Architecture Points */}
            <div className="mt-8 space-y-3.5 pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span>Zero Server Uploads &bull; 100% In-Browser</span>
              </div>

              <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Cpu className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span>Client-Side Web Workers Engine</span>
              </div>

              <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Lock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span>Zero Tracking &bull; Zero Data Retention</span>
              </div>
            </div>

            {/* Vertical Balance Card: Why In-Browser? */}
            <div className="mt-8 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-orange-600 font-extrabold">
                  <Sparkles className="w-4 h-4" /> Why In-Browser?
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Client Sandbox Active
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Traditional PDF editors upload your sensitive files to remote servers. PDFKarlo runs WebAssembly &amp; Web Workers locally in your browser so documents never leave your machine.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Max 50 MB / file</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Instant Processing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>100% Free Forever</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>No Account Required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Blue Box): All 5 Accessible Tools */}
          <div className="lg:col-span-7">
            <ToolGrid />
          </div>
        </div>

        {/* Roadmap Section */}
        <RoadmapSection />
      </section>

      {/* Architecture Highlights */}
      <section id="security" className="mt-16 py-16 border-t border-slate-200 scroll-mt-20">
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
