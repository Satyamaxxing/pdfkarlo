import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfkarlo.pages.dev"),
  title: "PDFKarlo — 100% In-Browser Privacy-First PDF Platform",
  description: "Fast, private, and secure browser-based PDF tools. Merge, split, rotate, reorder, and remove PDF pages locally on your device with zero server uploads.",
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
    title: "PDFKarlo — 100% In-Browser Privacy-First PDF Platform",
    description: "Fast, private, and secure browser-based PDF tools. 100% local client-side processing with zero server uploads.",
    url: "https://pdfkarlo.pages.dev",
    siteName: "PDFKarlo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFKarlo — 100% In-Browser Privacy-First PDF Platform",
    description: "Fast, private, and secure browser-based PDF tools. 100% local client-side processing with zero server uploads.",
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
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
