import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Cpu,
  Lock,
  CheckCircle2,
  HelpCircle,
  FileText,
  ArrowRight,
  Zap,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";

export interface HowToStep {
  step: number;
  title: string;
  description: string;
}

export interface UseCaseItem {
  title: string;
  description: string;
  tag: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedToolItem {
  id: string;
  name: string;
  description: string;
  href: string;
  iconSrc: string;
}

export interface ToolSeoData {
  toolId: string;
  toolName: string;
  tagline: string;
  summary: string;
  howToSteps: HowToStep[];
  technicalDetails: {
    heading: string;
    paragraphs: string[];
  };
  useCases: UseCaseItem[];
  specifications: {
    maxFileSize: string;
    engine: string;
    privacy: string;
    outputFormat: string;
    browserSupport: string;
  };
  faqs: FaqItem[];
  relatedTools: RelatedToolItem[];
}

interface ToolSeoSectionProps {
  data: ToolSeoData;
}

export const ToolSeoSection: React.FC<ToolSeoSectionProps> = ({ data }) => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="mt-32 sm:mt-64 lg:mt-[28rem] pt-14 sm:pt-16 border-t border-slate-200/90 text-slate-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-orange-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/#tools" className="hover:text-orange-600 transition-colors">
          PDF Tools
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold" aria-current="page">
          {data.toolName}
        </span>
      </nav>

      {/* 1. How It Works: Step-by-Step Guide */}
      <section className="mb-14 sm:mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Fast &bull; Private &bull; 100% Free</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How to {data.toolName} in 4 Easy Steps
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {data.tagline} &mdash; everything happens directly in your browser without uploading to external servers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.howToSteps.map((s) => (
            <div
              key={s.step}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all relative flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center mb-4 shadow-xs">
                  {s.step}
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Deep Dive: Technical Capabilities & Browser Privacy */}
      <section className="mb-14 sm:mb-20 rounded-3xl bg-slate-50/70 border border-slate-200/90 p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Server Upload Guarantee</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data.technicalDetails.heading}
            </h2>
            {data.technicalDetails.paragraphs.map((para, idx) => (
              <p key={idx} className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Specifications Box */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-4 h-4 text-orange-600" />
              <span>Tool Specifications &amp; Limits</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Application File Limit</span>
                <span className="font-bold text-slate-900">{data.specifications.maxFileSize}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Processing Engine</span>
                <span className="font-bold text-slate-900">{data.specifications.engine}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Privacy Architecture</span>
                <span className="font-bold text-emerald-700">{data.specifications.privacy}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Output Format</span>
                <span className="font-bold text-slate-900">{data.specifications.outputFormat}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 font-medium">Cost &amp; Sign-Up</span>
                <span className="font-bold text-emerald-700">100% Free &bull; No Account Needed</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/security"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
              >
                <span>Read our complete privacy &amp; security architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Practical Use Cases */}
      <section className="mb-14 sm:mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Common Use Cases for {data.toolName}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Real-world scenarios where local, confidential PDF processing saves time and protects privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.useCases.map((uc, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-orange-300 transition-all"
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] mb-3">
                {uc.tag}
              </span>
              <h3 className="font-bold text-base text-slate-900 mb-2">
                {uc.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {uc.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Frequently Asked Questions (FAQ) */}
      <section className="mb-14 sm:mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Clear, honest answers about {data.toolName}, privacy guarantees, and performance limits.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {data.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs"
            >
              <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-2 flex items-start gap-2.5">
                <span className="text-orange-600 font-extrabold">Q.</span>
                <span>{faq.question}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Related PDF Tools Grid */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900">
              Explore More Free PDF Tools
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              All tools run 100% locally in your browser with zero server uploads.
            </p>
          </div>
          <Link
            href="/#tools"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            <span>View All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.relatedTools.map((rt) => (
            <Link
              key={rt.id}
              href={rt.href}
              className="group p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-orange-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image
                    src={rt.iconSrc}
                    alt={rt.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
                  {rt.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {rt.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600">
                <span>Use Free</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
