import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remove PDF Pages Online Free — Delete Pages from PDF",
  description:
    "Remove and delete unwanted, blank, or confidential pages from PDF online for free. Select specific pages or custom ranges with instant visual preview. Zero uploads.",
  keywords: [
    "remove PDF pages",
    "delete pages from PDF",
    "delete selected PDF pages",
    "remove unwanted PDF pages",
    "delete blank pages from PDF",
    "PDF se pages kaise delete kare",
    "PDF Karlo remove",
  ],
  alternates: {
    canonical: "https://pdfkarlo.pages.dev/remove/",
  },
  openGraph: {
    title: "Remove PDF Pages Online Free — Delete Pages | PDFKarlo",
    description:
      "Delete unwanted pages or confidential sheets from your document before sharing. 100% local client-side processing with zero server uploads.",
    url: "https://pdfkarlo.pages.dev/remove/",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Remove PDF Pages Online Free with PDFKarlo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remove PDF Pages Online Free — Delete Pages | PDFKarlo",
    description:
      "Delete unwanted or confidential pages from any PDF document. 100% client-side Web Workers processing with zero server uploads.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "PDFKarlo Remove PDF Pages",
      url: "https://pdfkarlo.pages.dev/remove/",
      description:
        "Free browser-based utility to remove and delete unwanted pages, blank sheets, or confidential sections from PDF documents.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (Web Browser)",
      browserRequirements: "Requires HTML5 and WebAssembly capable browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Click-to-delete visual page selection with red overlay",
        "Range deletion input (e.g. 2-5, 8)",
        "Zero-page deletion protection safeguard",
        "Instant live page previews with zoom modal",
        "Zero server uploads - 100% private in-browser processing",
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
          name: "Remove Pages",
          item: "https://pdfkarlo.pages.dev/remove/",
        },
      ],
    },
  ],
};

export default function RemoveLayout({
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
