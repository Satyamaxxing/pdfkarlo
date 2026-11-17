import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ToolGrid, RoadmapSection } from "@/components/ToolGrid";
import { ShieldCheck, Cpu, Lock, Code2, Sparkles, CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";
import {
  ZeroServerUploadsShieldSvg,
  ClientSideWebWorkersChipSvg,
  ZeroTrackingVaultLockSvg,
} from "@/components/TrustBadges";
import { HOMEPAGE_FAQS } from "@/lib/seoData";

export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOMEPAGE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
      {/* 2-Column Split Hero & Tools Workspace */}
      <section id="tools" className="pb-12 scroll-mt-20 relative max-sm:overflow-x-clip">
        {/* Ambient Brand Mascot Background Watermark (Simple, Clean, Breathable) */}
        <div
          className="block absolute -top-4 sm:-top-12 lg:-top-10 left-1/2 sm:left-[48%] lg:left-[44%] -translate-x-1/2 w-[300px] min-[400px]:w-[360px] sm:w-[640px] lg:w-[740px] xl:w-[820px] aspect-square pointer-events-none select-none -z-10"
          style={{ opacity: 0.12 }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-orange-400/15 rounded-full blur-2xl sm:blur-3xl -z-10" />
          <Image
            src="/mascot.png"
            alt="PDFKarlo Mascot Watermark"
            width={820}
            height={683}
            className="w-full h-full object-contain"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)",
              maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)",
            }}
            priority
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-start">
          {/* Left Column (Red Box): Heading, Intro & Trust Guarantees */}
          <div className="lg:col-span-6 flex flex-col justify-start lg:sticky lg:top-24 pt-1 sm:pt-2">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.85rem] 2xl:text-[4.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.08] sm:leading-[1.05]">
              Every tool you need<br />
              <span className="sm:whitespace-nowrap">to work with PDFs,</span><br />
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                in one place.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed font-normal max-w-xl">
              <strong className="text-slate-900 font-semibold">PDF ka kaam online karo, free mein — with PDFKarlo.</strong> Fast, private, and 100% browser-local. Merge, split, rotate, reorder, and remove PDF pages directly on your device with isolated Web Workers &mdash; no server uploads, no accounts, and up to 50 MB per file.
            </p>

            {/* Core Trust & Architecture Points */}
            <div className="mt-8 space-y-4 pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-3.5 text-sm sm:text-base font-bold text-slate-800">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-white to-emerald-50 border border-emerald-200/90 shadow-xs flex items-center justify-center flex-shrink-0">
                  <ZeroServerUploadsShieldSvg className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                </div>
                <span>Zero Server Uploads &bull; 100% In-Browser</span>
              </div>

              <div className="flex items-center gap-3.5 text-sm sm:text-base font-bold text-slate-800">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-white to-emerald-50 border border-emerald-200/90 shadow-xs flex items-center justify-center flex-shrink-0">
                  <ClientSideWebWorkersChipSvg className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                </div>
                <span>Client-Side Web Workers Engine</span>
              </div>

              <div className="flex items-center gap-3.5 text-sm sm:text-base font-bold text-slate-800">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-white to-emerald-50 border border-emerald-200/90 shadow-xs flex items-center justify-center flex-shrink-0">
                  <ZeroTrackingVaultLockSvg className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                </div>
                <span>Zero Tracking &bull; Zero Data Retention</span>
              </div>
            </div>
          </div>

          {/* Right Column (Blue Box): All 5 Accessible Tools */}
          <div className="lg:col-span-6">
            <ToolGrid />
          </div>
        </div>

        {/* Roadmap Section */}
        <RoadmapSection />
      </section>

      {/* Expanded USP Dialogue Section: Why In-Browser? */}
      <section id="why-in-browser" className="mt-16 sm:mt-24 scroll-mt-20">
        <div className="rounded-3xl bg-white border-2 border-orange-200/90 shadow-sm p-6 sm:p-10 lg:p-14 relative overflow-hidden">
          {/* Header Row of the Dialogue Box - Centered Alignment */}
          <div className="flex flex-col items-center text-center pb-6 sm:pb-8 border-b border-slate-100">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 flex-shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Why In-Browser?
              </h2>
            </div>
            <p className="text-xs sm:text-sm sm:text-base text-slate-500 font-medium mt-2">
              The primary Unique Selling Proposition (USP) of PDFKarlo
            </p>
          </div>

          {/* Core Philosophy Statement */}
          <div className="py-6 sm:py-8 max-w-4xl mx-auto text-center">
            <p className="text-base sm:text-xl lg:text-2xl text-slate-800 font-medium leading-relaxed">
              Traditional PDF editors upload your sensitive files to remote servers. PDFKarlo runs WebAssembly &amp; Web Workers locally in your browser so <span className="text-orange-600 font-extrabold underline decoration-orange-300 underline-offset-4">documents never leave your machine</span>.
            </p>
          </div>

          {/* 4 Feature Points in High-Impact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-slate-100">
            {/* 1. Max 50 MB / file */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Max 50 MB / file</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Handles heavy multipage documents, scanned reports, and high-res PDFs directly in browser RAM without server timeouts.
              </p>
            </div>

            {/* 2. Instant Processing */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Instant Processing</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero upload bandwidth delay and zero server queue waiting. All byte-level operations run on your local CPU cores.
              </p>
            </div>

            {/* 3. 100% Free to Use */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% Free to Use</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                All 5 available PDF tools are completely free to use. Zero subscriptions, zero paywalls, and zero watermarks on your exported documents.
              </p>
            </div>

            {/* 4. No Account Required */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>No Account Required</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                No email signups, no authentication cookies, and no tracking. Data is held in ephemeral memory and wiped immediately on tab close.
              </p>
            </div>
          </div>

          {/* Bottom Action Footer of the Dialogue Box */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
            <Link
              href="/security"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 text-white font-bold text-xs sm:text-sm hover:bg-orange-700 transition-colors shadow-xs group"
            >
              <span>Explore our 100% in-browser USP &amp; architecture</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
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

      {/* 4. Frequently Asked Questions (Homepage FAQ) */}
      <section id="faq" className="mt-16 sm:mt-24 py-16 border-t border-slate-200 scroll-mt-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Everything you need to know about PDFKarlo, our free in-browser PDF utilities, document privacy, and 50 MB per-file limits.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {HOMEPAGE_FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-orange-200 transition-all"
            >
              <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 flex items-start gap-3">
                <span className="text-orange-600 font-extrabold">Q.</span>
                <span>{faq.question}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
