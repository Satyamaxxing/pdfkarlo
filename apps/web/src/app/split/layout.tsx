import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF Online Free — Extract Selected Pages or Burst PDF",
  description:
    "Split PDF files online for free. Extract custom page ranges, extract single sheets, or burst every page into standalone PDFs in a ZIP archive. 100% in-browser privacy.",
  keywords: [
    "split PDF",
    "split PDF online",
    "split PDF online free",
    "extract PDF pages",
    "split PDF by page range",
    "separate PDF pages",
    "burst PDF pages",
    "PDF kaise split kare",
    "PDF Karlo split",
  ],
  alternates: {
    canonical: "https://pdfkarlo.pages.dev/split/",
  },
  openGraph: {
    title: "Split PDF Online Free — Extract Selected Pages | PDFKarlo",
    description:
      "Extract specific page ranges, extract single sheets, or burst each page into standalone files. 100% local client-side processing with zero server uploads.",
    url: "https://pdfkarlo.pages.dev/split/",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Split PDF Online Free with PDFKarlo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Split PDF Online Free — Extract Selected Pages | PDFKarlo",
    description:
      "Split PDF files into ranges or individual files. 100% client-side Web Workers processing with zero server uploads.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "PDFKarlo Split PDF",
      url: "https://pdfkarlo.pages.dev/split/",
      description:
        "Free browser-based utility to split PDF files into specific page ranges, extract single pages, or burst documents into separate files.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (Web Browser)",
      browserRequirements: "Requires HTML5 and WebAssembly capable browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Split PDF by custom page ranges (e.g. 1-3, 4-8)",
        "Extract selected pages into a new PDF",
        "Burst all pages into standalone PDF files in a ZIP",
        "Visual page selection and high-resolution preview",
        "Zero server uploads - 100% in-browser processing",
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
          name: "Split PDF",
          item: "https://pdfkarlo.pages.dev/split/",
        },
      ],
    },
  ],
};

export default function SplitLayout({
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
