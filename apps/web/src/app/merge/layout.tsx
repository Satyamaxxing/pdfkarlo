import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merge PDF Files Online Free — Combine Multiple PDFs",
  description:
    "Merge multiple PDF files into one single document online for free. Visual page-level sequencing, drag-and-drop document ordering, and 100% private in-browser processing. Zero uploads.",
  keywords: [
    "merge PDF",
    "merge PDF online free",
    "combine PDF files",
    "join multiple PDF files",
    "PDF merger online",
    "combine PDF files online for free",
    "merge PDF files without uploading",
    "PDF kaise merge kare",
    "PDF Karlo merge",
  ],
  alternates: {
    canonical: "https://pdfkarlo.pages.dev/merge/",
  },
  openGraph: {
    title: "Merge PDF Files Online Free — Combine Multiple PDFs | PDFKarlo",
    description:
      "Combine multiple PDF documents into a single unified file with page-level sequencing. 100% local client-side processing with zero server uploads.",
    url: "https://pdfkarlo.pages.dev/merge/",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Merge PDF Files Online Free with PDFKarlo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Merge PDF Files Online Free — Combine Multiple PDFs | PDFKarlo",
    description:
      "Combine multiple PDF documents into a single unified file. 100% client-side Web Workers processing with zero server uploads.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "PDFKarlo Merge PDF",
      url: "https://pdfkarlo.pages.dev/merge/",
      description:
        "Free browser-based utility to merge multiple PDF files into one document with visual page reordering. Runs 100% in-browser with Web Workers.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (Web Browser)",
      browserRequirements: "Requires HTML5 and WebAssembly capable browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Combine multiple PDF files into one",
        "Visual page-level drag-and-drop reordering",
        "Document sequencing by upload or custom order",
        "Zero server uploads - 100% client-side memory execution",
        "Supports files up to 50 MB each",
      ],
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
          name: "Merge PDF",
          item: "https://pdfkarlo.pages.dev/merge/",
        },
      ],
    },
  ],
};

export default function MergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
