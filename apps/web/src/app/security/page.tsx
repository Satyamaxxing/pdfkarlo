import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  ShieldCheck,
  Cpu,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  WifiOff,
  Terminal,
  Zap,
  Server,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck,
  HardDriveDownload,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Why In-Browser? — PDFKarlo Architecture & 100% Privacy Guarantee",
  description:
    "Explore how PDFKarlo processes PDFs entirely on your device with Web Workers and pdf-lib. Zero server uploads, zero cloud retention, and 100% document privacy.",
  alternates: {
    canonical: "https://pdfkarlo.pages.dev/security/",
  },
  openGraph: {
    title: "Why In-Browser? — PDFKarlo Architecture & 100% Privacy Guarantee | PDFKarlo",
    description:
      "Your documents never leave your computer. Discover how client-side Web Workers eliminate cloud privacy risks.",
    url: "https://pdfkarlo.pages.dev/security/",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PDFKarlo In-Browser Privacy Architecture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Why In-Browser? — PDFKarlo Architecture & 100% Privacy Guarantee",
    description:
      "Zero server uploads, zero cloud retention, and 100% document privacy with client-side Web Workers.",
    images: ["/og-image.png"],
  },
};

const securityJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Why In-Browser? — PDFKarlo Privacy & Architecture",
      url: "https://pdfkarlo.pages.dev/security/",
      description:
        "Detailed technical overview of PDFKarlo client-side PDF processing architecture, memory boundaries, and zero server upload guarantee.",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://pdfkarlo.pages.dev/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Privacy & Security Architecture",
          item: "https://pdfkarlo.pages.dev/security/",
        },
      ],
    },
  ],
};

export default function SecurityPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(securityJsonLd) }}
      />
      {/* 1. Hero USP Banner */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>The Core USP of PDFKarlo</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          Why In-Browser Processing is the{" "}
          <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            Future of PDF Privacy
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-3xl mx-auto">
          Traditional online PDF tools upload your sensitive contracts, bank statements, tax forms, and medical records
          to remote cloud servers. PDFKarlo operates on a radically different architecture:{" "}
          <strong className="text-slate-900 font-semibold">100% of the processing happens directly on your device.</strong>
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/70">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>0 Bytes Uploaded to Any Server</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/70">
            <WifiOff className="w-4 h-4 text-emerald-600" />
            <span>Works 100% Offline in Airplane Mode</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/70">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Zero Network Latency</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Architecture Comparison: Traditional Cloud vs PDFKarlo */}
      <div className="mt-16 sm:mt-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Traditional Online Tools vs. PDFKarlo Client Sandbox
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            See the fundamental architectural difference between remote file uploads and local browser execution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Traditional Cloud Service (The Flawed Way) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  Traditional Online PDF Tools (Smallpdf, iLovePDF, etc.)
                </span>
                <XCircle className="w-5 h-5 text-rose-500" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-rose-100 shadow-xs">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600 flex-shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">1. Remote Server Upload</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Your document payload is transmitted over public networks to external third-party cloud data centers (AWS, GCP, etc.).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-rose-100 shadow-xs">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">2. Remote Disk Retention Window</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Files are written to temporary server disks for 1 to 24 hours to generate download links, vulnerable to subpoenas, leaks, or server breaches.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-rose-100 shadow-xs">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600 flex-shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">3. Artificial Paywalls & Daily Limits</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Because servers cost money to run, companies throttle you after 2 files and demand expensive monthly subscriptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200/80 text-xs font-semibold text-rose-600 flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>High privacy risk for sensitive confidential documents.</span>
            </div>
          </div>

          {/* PDFKarlo Architecture (The Privacy-First Way) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 border-2 border-orange-500/80 shadow-md shadow-orange-500/5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-orange-200/80 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-100/80 px-3 py-1 rounded-full border border-orange-300">
                  PDFKarlo Client-Side Engine
                </span>
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-orange-200 shadow-xs">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600 flex-shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">1. Isolated Web Worker Sandboxing</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Document manipulation runs on isolated background threads directly on your computer&apos;s processor using WebAssembly and pdf-lib.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-orange-200 shadow-xs">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">2. Ephemeral RAM Memory (Zero Disk Writing)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Documents exist solely in ephemeral ArrayBuffer memory in your browser. The moment you close or refresh the tab, data is wiped instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-orange-200 shadow-xs">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600 flex-shrink-0">
                    <HardDriveDownload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">3. Direct Local Download & 100% Free Forever</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Output files generate directly in client memory without uploading or downloading over the internet. Zero server overhead means zero paywalls.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-orange-200/80 text-xs font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Certified 100% private: Files never leave your local device.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Comparison Table */}
      <div className="mt-16 sm:mt-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Side-by-Side Comparison Matrix
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Clear contrast between cloud-hosted processors and PDFKarlo&apos;s browser execution model.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-4 px-6">Evaluation Criteria</th>
                <th className="py-4 px-6 text-slate-500">Traditional Cloud PDF Tools</th>
                <th className="py-4 px-6 text-orange-600 bg-orange-50/50">PDFKarlo In-Browser Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">File Destination</td>
                <td className="py-4 px-6 text-rose-600">Uploaded to third-party cloud servers</td>
                <td className="py-4 px-6 font-bold text-emerald-700 bg-orange-50/30">Never leaves your device (0 bytes sent)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">Third-Party Access</td>
                <td className="py-4 px-6">Server admins, cloud hosts, foreign jurisdictions</td>
                <td className="py-4 px-6 font-bold text-emerald-700 bg-orange-50/30">Impossible (No external network path)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">Offline Operation</td>
                <td className="py-4 px-6 text-rose-600">❌ Inoperable (Uploads fail without internet)</td>
                <td className="py-4 px-6 font-bold text-emerald-700 bg-orange-50/30">✅ 100% Functional in Airplane Mode</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">Processing Speed</td>
                <td className="py-4 px-6">Slowed by upload bandwidth & server queues</td>
                <td className="py-4 px-6 font-bold text-emerald-700 bg-orange-50/30">Instantaneous (Native device CPU speed)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">Data Retention Window</td>
                <td className="py-4 px-6 text-rose-600">Retained on remote storage for 1-24 hours</td>
                <td className="py-4 px-6 font-bold text-emerald-700 bg-orange-50/30">0 seconds (Purged on tab close)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">Daily Task Limits</td>
                <td className="py-4 px-6">Strict paywalls after 2–3 operations</td>
                <td className="py-4 px-6 font-bold text-emerald-700 bg-orange-50/30">Unlimited &amp; 100% Free Forever</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-slate-900">Account Requirement</td>
                <td className="py-4 px-6">Demands email, logins, or social tracking</td>
                <td className="py-4 px-6 font-bold text-emerald-700 bg-orange-50/30">No account, no email, no cookies</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Independent Verification Guide (DevTools Proof) */}
      <div className="mt-16 sm:mt-24 p-6 sm:p-10 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-orange-400 text-xs font-bold mb-4 border border-slate-700">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Verification</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Verify It Yourself in 15 Seconds
          </h2>

          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Privacy claims are cheap. Code and network packets do not lie. You can independently verify that PDFKarlo
            transfers zero file bytes using any modern web browser:
          </p>

          <div className="mt-8 space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                1
              </span>
              <p className="text-slate-200">
                Press <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-orange-300">F12</kbd> or right-click anywhere and select <strong className="text-white">Inspect</strong> to open Developer Tools.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                2
              </span>
              <p className="text-slate-200">
                Click on the <strong className="text-white font-semibold">Network</strong> tab and tick the <strong className="text-white font-semibold">&ldquo;Fetch/XHR&rdquo;</strong> filter.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                3
              </span>
              <p className="text-slate-200">
                Drop in any PDF and perform a Merge, Split, or Rotate operation.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                4
              </span>
              <p className="text-slate-200">
                <strong className="text-emerald-400">Result:</strong> You will observe zero outgoing document payloads or POST requests. Your document is digested purely by the Web Worker thread in your browser.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 5. Four Security Pillars */}
      <div className="mt-16 sm:mt-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            The Four Pillars of In-Browser Security
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Engineered from first principles to guarantee document integrity, thread safety, and zero leakage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-orange-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Magic-Byte File Validation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We validate the raw binary magic header (<code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">%PDF-</code>) before parsing. This prevents malicious executable uploads, script injection, or corrupted file handling.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-orange-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Isolated Background Web Workers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Heavy PDF parsing runs in dedicated background Web Worker threads. Your main UI thread remains smooth at 60 FPS, and if a malformed file fails, the worker terminates cleanly without memory corruption.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-orange-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Ephemeral Client Memory Allocation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Document buffers are loaded strictly as temporary JavaScript ArrayBuffer objects. We do not store files in IndexedDB, LocalStorage, or cookies. When the browser tab closes, the garbage collector wipes memory entirely.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-orange-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Permissive Open-Source Foundation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Powered by battle-tested MIT and Apache-2.0 client libraries (<code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">pdf-lib</code> and <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono">pdfjs-dist</code>). Zero proprietary vendor lock-in, zero AGPL legal exposure.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Frequently Asked Questions */}
      <div className="mt-16 sm:mt-24 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Direct answers regarding our security architecture and privacy model.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
              Can PDFKarlo employees or server admins see my PDF?
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
              No. It is mathematically and technically impossible. Because your PDF files are never uploaded to any server, there is no server disk, log, or database where documents could ever be intercepted.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
              What is the maximum file size I can process?
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
              Because execution runs on your device, processing limits are governed by your device&apos;s available RAM. PDFKarlo comfortably handles documents up to 50 MB to 100 MB with dozens of high-resolution pages.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
              Does PDFKarlo really work without an internet connection?
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
              Yes! Once the application code is cached in your browser, you can disconnect your Wi-Fi, turn on Airplane Mode, and perform any PDF merge, split, rotation, or page deletion locally without an internet connection.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
              Why is PDFKarlo 100% free with no subscriptions?
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-6">
              Traditional online PDF companies maintain massive cloud server clusters and bandwidth pipelines to receive and convert millions of documents daily, forcing them to charge costly subscriptions. Because PDFKarlo leverages your device&apos;s own processor, our infrastructure cost is virtually zero.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Action CTA Footer Card */}
      <div className="mt-16 sm:mt-24 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-center shadow-lg shadow-orange-500/20">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Ready to experience genuine document privacy?
        </h2>
        <p className="mt-3 text-orange-100 text-sm sm:text-base max-w-xl mx-auto">
          No signups, no credit cards, no server uploads. Pick a tool and process your documents safely in seconds.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/merge"
            className="px-6 py-3 rounded-xl bg-white text-orange-600 font-bold text-sm hover:bg-orange-50 transition-colors shadow-sm"
          >
            Merge PDFs
          </Link>
          <Link
            href="/split"
            className="px-6 py-3 rounded-xl bg-orange-700/60 hover:bg-orange-700 text-white font-bold text-sm transition-colors border border-white/20"
          >
            Split PDFs
          </Link>
          <Link
            href="/#tools"
            className="px-6 py-3 rounded-xl bg-orange-700/60 hover:bg-orange-700 text-white font-bold text-sm transition-colors border border-white/20"
          >
            View All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
