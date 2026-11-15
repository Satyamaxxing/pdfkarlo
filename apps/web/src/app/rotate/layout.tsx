import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rotate PDF Pages Online — Fix PDF Page Orientation Permanently",
  description:
    "Rotate PDF pages online for free. Rotate individual pages or all pages by 90, 180, or 270 degrees clockwise or counterclockwise. Persistent orientation with zero server uploads.",
  keywords: [
    "rotate PDF online",
    "rotate PDF pages",
    "rotate individual PDF pages",
    "change PDF page orientation",
    "permanent PDF rotation",
    "rotate PDF 90 degrees",
    "PDF rotate kaise kare",
    "PDF Karlo rotate",
  ],
  alternates: {
    canonical: "https://pdfkarlo.pages.dev/rotate/",
  },
  openGraph: {
    title: "Rotate PDF Pages Online — Permanent Orientation | PDFKarlo",
    description:
      "Rotate document pages by 90, 180, or 270 degrees with persistent orientation preservation. 100% local client-side processing with zero server uploads.",
    url: "https://pdfkarlo.pages.dev/rotate/",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rotate PDF Pages Online with PDFKarlo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rotate PDF Pages Online — Permanent Orientation | PDFKarlo",
    description:
      "Rotate document pages individually or in bulk. 100% client-side Web Workers processing with zero server uploads.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "PDFKarlo Rotate PDF",
      url: "https://pdfkarlo.pages.dev/rotate/",
      description:
        "Free browser-based utility to rotate individual or all PDF pages by 90, 180, or 270 degrees with permanent orientation preservation.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (Web Browser)",
      browserRequirements: "Requires HTML5 and WebAssembly capable browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Rotate individual pages or all pages at once",
        "Bidirectional rotation (CW +90°, CCW -90°, 180° flip)",
        "Instant visual preview with high-resolution page modal",
        "Zero server uploads - 100% client-side execution",
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
          name: "Rotate PDF",
          item: "https://pdfkarlo.pages.dev/rotate/",
        },
      ],
    },
  ],
};

export default function RotateLayout({
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
