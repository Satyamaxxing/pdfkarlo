import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfkarlo.pages.dev"),
  title: "PDFKarlo — 100% In-Browser Privacy-First PDF Platform",
  description: "Fast, private, and secure browser-based PDF tools. Merge, split, rotate, reorder, and remove PDF pages locally on your device with zero server uploads.",
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
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
