"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Menu, X } from "lucide-react";

const SecurityShieldIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="shieldGrad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="shieldBg" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ECFDF5" />
        <stop offset="1" stopColor="#D1FAE5" />
      </linearGradient>
    </defs>
    <path
      d="M16 2.5L6 6.8V15.2C6 21.8 10.3 27.9 16 29.5C21.7 27.9 26 21.8 26 15.2V6.8L16 2.5Z"
      fill="url(#shieldBg)"
      stroke="url(#shieldGrad)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M11.5 15.5L14.5 18.5L20.5 12"
      stroke="#059669"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
      <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
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
            href="/security"
            className="px-3.5 py-1.5 rounded-lg hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            Privacy & Security
          </Link>
        </nav>

        {/* Right side items: Professional Privacy Seal + Mobile Hamburger */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/security"
            className="flex items-center gap-3 pl-3 sm:pl-5 sm:border-l sm:border-slate-200 group transition-all"
            title="All PDF processing happens locally in your browser with zero server uploads"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50/90 border border-emerald-200/80 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-100/70 transition-all shadow-xs">
              <SecurityShieldIcon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">
                100% In-Browser Privacy
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-semibold tracking-tight hidden sm:inline mt-0.5">
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
            href="/security"
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
