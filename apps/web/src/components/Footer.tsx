"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck, Cpu, Lock } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const isToolPage = ["/merge", "/split", "/rotate", "/reorder", "/remove"].some(
    (tool) => pathname === tool || pathname?.startsWith(tool + "/")
  );

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

      <div className={`max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 ${isToolPage ? "py-6" : "py-10"}`}>
        {!isToolPage && (
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
        )}

        <div className={`${isToolPage ? "pt-2" : "pt-8 border-t border-slate-200"} flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500`}>
          <p>© {new Date().getFullYear()} PDFKarlo Platform. Independently engineered & permissive open-source foundation.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center font-medium">
            <Link href="/security" className="hover:text-orange-600 transition-colors">
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
