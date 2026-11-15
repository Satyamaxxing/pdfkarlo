import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reorder PDF Pages Online — Rearrange PDF Page Order Free",
  description:
    "Reorder and rearrange PDF pages online for free. Visual drag-and-drop page sequencing, instant preview, reverse order, and 100% private in-browser processing. Zero uploads.",
  keywords: [
    "reorder PDF pages",
    "rearrange PDF pages",
    "change PDF page order",
    "organize PDF pages",
    "arrange PDF pages online",
    "drag and drop PDF pages",
    "PDF page sequence change",
    "PDF Karlo reorder",
  ],
  alternates: {
    canonical: "https://pdfkarlo.pages.dev/reorder/",
  },
  openGraph: {
    title: "Reorder PDF Pages Online — Rearrange Page Sequence | PDFKarlo",
    description:
      "Visually resequence document pages via client-side preview and drag-and-drop orchestration. 100% local client-side processing with zero server uploads.",
    url: "https://pdfkarlo.pages.dev/reorder/",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reorder PDF Pages Online with PDFKarlo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reorder PDF Pages Online — Rearrange Page Sequence | PDFKarlo",
    description:
      "Rearrange PDF page sequence visually with drag and drop. 100% client-side Web Workers processing with zero server uploads.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "PDFKarlo Reorder PDF Pages",
      url: "https://pdfkarlo.pages.dev/reorder/",
      description:
        "Free browser-based utility to rearrange, sort, or reverse the page order of any PDF document visually via drag and drop.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (Web Browser)",
      browserRequirements: "Requires HTML5 and WebAssembly capable browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Drag-and-drop visual page reordering",
        "Quick position buttons (Move to Start, Left, Right, End)",
        "One-click Reverse Order and Reset to Original",
        "Instant live page thumbnail previews",
        "Zero server uploads - 100% browser-local processing",
        "Supports files up to 50 MB",
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
          name: "Reorder Pages",
          item: "https://pdfkarlo.pages.dev/reorder/",
        },
      ],
    },
  ],
};

export default function ReorderLayout({
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
