"use client";

import React, { useState } from "react";
import { Grid, LayoutGrid, Maximize2 } from "lucide-react";

export type GridCardSize = "sm" | "md" | "lg";

interface PdfPageGridProps {
  children: React.ReactNode;
  totalPages: number;
  selectedCount?: number;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  infoBanner?: React.ReactNode;
  hideToolbar?: boolean;
}

export const PdfPageGrid: React.FC<PdfPageGridProps> = ({
  children,
  totalPages,
  selectedCount,
  toolbarLeft,
  toolbarRight,
  infoBanner,
  hideToolbar = false,
}) => {
  const [cardSize, setCardSize] = useState<GridCardSize>("md");

  const gridClass =
    cardSize === "sm"
      ? "grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2.5"
      : cardSize === "lg"
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3.5";

  return (
    <div className="space-y-4">
      {/* Global Action Toolbar */}
      {!hideToolbar && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">{toolbarLeft}</div>

          <div className="flex items-center gap-2.5">
            {toolbarRight}

            {/* Grid Zoom / Card Size Switcher */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setCardSize("sm")}
                className={`p-1 rounded-lg text-xs transition-colors ${
                  cardSize === "sm"
                    ? "bg-white text-orange-600 shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Compact grid"
                aria-label="Compact card size"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCardSize("md")}
                className={`p-1 rounded-lg text-xs transition-colors ${
                  cardSize === "md"
                    ? "bg-white text-orange-600 shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Standard grid"
                aria-label="Standard card size"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCardSize("lg")}
                className={`p-1 rounded-lg text-xs transition-colors ${
                  cardSize === "lg"
                    ? "bg-white text-orange-600 shadow-xs font-bold"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Large grid"
                aria-label="Large card size"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {infoBanner}

      {/* Grid Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-50/70 border border-slate-200 shadow-inner">
        <div className="flex items-center justify-between pb-3 text-xs text-slate-500 border-b border-slate-200/80 mb-4">
          <span>
            {totalPages} {totalPages === 1 ? "page" : "pages"} loaded
          </span>
          {selectedCount !== undefined && (
            <span className="font-semibold text-orange-600">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className={`grid ${gridClass} max-h-[64vh] overflow-y-auto p-1 pr-2`}>
          {children}
        </div>
      </div>
    </div>
  );
};
