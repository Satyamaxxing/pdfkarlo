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

        {/* Right side items: Badge + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-orange-50 text-orange-700 shadow-xs border border-orange-200/80 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
            <span className="hidden sm:inline">100% In-Browser Privacy</span>
            <span className="sm:hidden">Local Privacy</span>
          </span>

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
