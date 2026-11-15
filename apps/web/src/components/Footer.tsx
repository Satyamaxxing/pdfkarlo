"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Cpu, Lock, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/95 backdrop-blur-md relative overflow-hidden">
      {/* Decorative PDF Workflow Wave Illustration */}
      <div className="w-full flex justify-center pt-8 px-4 pointer-events-none select-none">
        <Image
          src="/footer-art.png"
          alt="PDFKarlo Workflow Illustration"
          width={1024}
          height={294}
          className="w-full max-w-4xl h-auto object-contain [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%),linear-gradient(to_bottom,black_70%,transparent_100%)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
          priority
        />
      </div>

      <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Strict Privacy Guarantee</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Your PDFs are processed locally in your browser. PDF files are not uploaded to our servers, indexed, or stored anywhere.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex-shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Zero Server Retention</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Because all document operations execute on your device, there is no remote database, cloud storage, or server retention window.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Web Worker Isolation</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Heavy PDF parsing and compilation execute in dedicated background Web Worker threads to keep your browser fast and responsive.
              </p>
            </div>
          </div>
        </div>

        {/* Crawlable Footer Navigation Columns */}
        <div className="pt-8 pb-10 border-t border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 text-xs">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-3">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="PDFKarlo Logo"
                width={140}
                height={34}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-slate-600 leading-relaxed pr-6">
              <strong className="text-slate-900">PDF ka kaam online karo, free mein &mdash; with PDFKarlo.</strong> Free, privacy-first browser PDF utility suite. All 5 tools run 100% locally in your device memory with zero server uploads and no account signup required.
            </p>
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Free &bull; Max 50 MB / file &bull; 0 Bytes Uploaded</span>
            </div>
          </div>

          {/* Column 1: PDF Tools */}
          <div className="lg:col-span-3 space-y-2.5">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Free PDF Tools
            </h5>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link href="/merge/" className="hover:text-orange-600 transition-colors">
                  Merge PDF &bull; Combine Files
                </Link>
              </li>
              <li>
                <Link href="/split/" className="hover:text-orange-600 transition-colors">
                  Split PDF &bull; Extract Pages
                </Link>
              </li>
              <li>
                <Link href="/rotate/" className="hover:text-orange-600 transition-colors">
                  Rotate PDF &bull; Fix Orientation
                </Link>
              </li>
              <li>
                <Link href="/reorder/" className="hover:text-orange-600 transition-colors">
                  Reorder Pages &bull; Rearrange Sequence
                </Link>
              </li>
              <li>
                <Link href="/remove/" className="hover:text-orange-600 transition-colors">
                  Remove Pages &bull; Delete Sheets
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Architecture & Security */}
          <div className="lg:col-span-2 space-y-2.5">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Architecture &amp; USP
            </h5>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link href="/security/" className="hover:text-orange-600 transition-colors">
                  Why In-Browser?
                </Link>
              </li>
              <li>
                <Link href="/security/" className="hover:text-orange-600 transition-colors">
                  Zero Server Uploads
                </Link>
              </li>
              <li>
                <Link href="/security/" className="hover:text-orange-600 transition-colors">
                  Web Worker Engine
                </Link>
              </li>
              <li>
                <Link href="/security/" className="hover:text-orange-600 transition-colors">
                  Privacy Safeguards
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Info */}
          <div className="lg:col-span-2 space-y-2.5">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Platform Info
            </h5>
            <ul className="space-y-2 text-slate-600">
              <li className="text-slate-500">Free Tier &bull; No Upgrades</li>
              <li className="text-slate-500">Max 50 MB / file</li>
              <li className="text-slate-500">No Account Required</li>
              <li className="text-slate-500">Open-Source Engine</li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PDFKarlo. Official web platform: <a href="https://pdfkarlo.pages.dev/" className="underline hover:text-orange-600">pdfkarlo.pages.dev</a>. All document processing is strictly client-side.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center font-medium">
            <Link href="/security/" className="hover:text-orange-600 transition-colors">
              Why In-Browser &amp; Security USP
            </Link>
            <span>Client-Side v1.0.0</span>
            <span>Zero Data Collection</span>
            <span>Zero AGPL Dependencies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
