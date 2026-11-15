import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfkarlo.pages.dev"),
  title: {
    default: "PDFKarlo – Free Online PDF Tools | Merge, Split & Edit PDFs",
    template: "%s | PDFKarlo",
  },
  description:
    "Use free online PDF tools to merge, split, rotate, reorder and remove PDF pages. No subscriptions, no signup. Process PDFs privately in your browser with zero server uploads.",
  keywords: [
    "PDFKarlo",
    "PDF Karlo",
    "PDF karo",
    "free PDF tools",
    "free online PDF editor",
    "PDF tools online",
    "merge PDF online free",
    "split PDF online",
    "rotate PDF online",
    "reorder PDF pages",
    "remove PDF pages",
    "PDF tools without signup",
    "private in-browser PDF editor",
    "PDF ka kaam online karo free mein",
  ],
  authors: [{ name: "PDFKarlo" }],
  creator: "PDFKarlo",
  publisher: "PDFKarlo",
  applicationName: "PDFKarlo",
  alternates: {
    canonical: "https://pdfkarlo.pages.dev/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "PDFKarlo – Free Online PDF Tools | Merge, Split & Edit PDFs",
    description:
      "Use free online PDF tools to merge, split, rotate, reorder and remove PDF pages. No subscriptions, no signup. 100% private in-browser processing.",
    url: "https://pdfkarlo.pages.dev/",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PDFKarlo – Free Online PDF Tools Processed Privately in Browser",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFKarlo – Free Online PDF Tools | Merge, Split & Edit PDFs",
    description:
      "Use free online PDF tools to merge, split, rotate, reorder and remove PDF pages. No subscriptions, no signup. Process PDFs privately in your browser.",
    images: ["/og-image.png"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PDFKarlo",
  alternateName: ["PDF Karlo", "PDFkaro", "PDF karo", "PDFKarlo Tools"],
  url: "https://pdfkarlo.pages.dev/",
  description:
    "Free, privacy-first online PDF tools. Merge, split, rotate, reorder, and remove PDF pages locally inside your browser with zero server uploads.",
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: "PDFKarlo",
    url: "https://pdfkarlo.pages.dev/",
    logo: "https://pdfkarlo.pages.dev/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-white text-slate-900 font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
