"use client";

import React from "react";

interface PaginationBarProps {
  currentPage?: number;
  totalPages?: number;
  showingCount?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export default function PaginationBar({
  currentPage = 1,
  totalPages = 3,
  showingCount = 8,
  totalItems = 24,
  onPageChange,
}: PaginationBarProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-space-xl p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
      <div className="font-body-sm text-body-sm text-on-surface-variant">
        Hiển thị{" "}
        <span className="font-semibold text-on-surface">
          1 - {showingCount}
        </span>{" "}
        trong số{" "}
        <span className="font-semibold text-on-surface">{totalItems}</span> sản
        phẩm
      </div>
      <div className="flex items-center gap-1.5">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className={`px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-1 shadow-sm transition-colors ${
            currentPage <= 1
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-surface-container-high cursor-pointer"
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
          <span>Trước</span>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange?.(p)}
            className={`w-9 h-9 rounded-lg font-label-md text-label-md flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
              p === currentPage
                ? "bg-primary text-on-primary font-bold"
                : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
            }`}
            type="button"
          >
            {p}
          </button>
        ))}

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className={`px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-1 shadow-sm transition-colors ${
            currentPage >= totalPages
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-surface-container-high cursor-pointer"
          }`}
          type="button"
        >
          <span>Sau</span>
          <span className="material-symbols-outlined text-[18px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}
