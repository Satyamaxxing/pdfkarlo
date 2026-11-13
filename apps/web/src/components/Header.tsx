"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, ShieldCheck, Menu, X } from "lucide-react";

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
    <header className="border-b border-orange-600/80 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <FileText className="w-5 h-5 text-orange-600 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-xs">
            PDFKarlo
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-white/95">
          <Link
            href="/#tools"
            className="px-3.5 py-1.5 rounded-lg hover:text-white hover:bg-white/15 transition-colors"
          >
            All Tools
          </Link>
          <Link
            href="/#security"
            className="px-3.5 py-1.5 rounded-lg hover:text-white hover:bg-white/15 transition-colors"
          >
            Privacy & Security
          </Link>
        </nav>

        {/* Right side items: Badge + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-white text-orange-600 shadow-sm border border-orange-200/50 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
            <span>100% In-Browser Privacy</span>
          </span>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white transition-colors cursor-pointer"
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
          className="md:hidden border-t border-orange-600 bg-orange-600 text-white px-4 py-3 space-y-1 shadow-xl animate-in slide-in-from-top-2 duration-150"
        >
          <Link
            href="/#tools"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/15 transition-colors"
          >
            All Tools
          </Link>
          <Link
            href="/#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/15 transition-colors"
          >
            Privacy & Security
          </Link>
        </nav>
      )}
    </header>
  );
};
