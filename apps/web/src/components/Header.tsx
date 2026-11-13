"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Menu, X } from "lucide-react";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key press for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileMenuOpen]);

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center group py-1" aria-label="PDFKarlo Home">
          <Image
            src="/logo.png"
            alt="PDFKarlo"
            width={200}
            height={48}
            priority
            className="h-10 sm:h-12 w-auto object-contain group-hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Link
            href="/#tools"
            className="px-3.5 py-1.5 rounded-lg hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            All Tools
          </Link>
          <Link
            href="/#security"
            className="px-3.5 py-1.5 rounded-lg hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            Privacy & Security
          </Link>
        </nav>

        {/* Right side items: Professional Privacy Seal + Mobile Hamburger */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/#security"
            className="flex items-center gap-2.5 pl-3 sm:pl-4 sm:border-l sm:border-slate-200 group transition-all"
            title="All PDF processing happens locally in your browser with zero server uploads"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-extrabold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                100% In-Browser Privacy
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline mt-0.5">
                Zero Server Uploads &bull; Local Execution
              </span>
            </div>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-orange-600 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-slate-200 bg-white text-slate-800 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150"
        >
          <Link
            href="/#tools"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            All Tools
          </Link>
          <Link
            href="/#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            Privacy & Security
          </Link>
        </nav>
      )}
    </header>
  );
};
