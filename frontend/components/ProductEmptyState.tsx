"use client";

import React from "react";

interface ProductEmptyStateProps {
  onReloadMenu: () => void;
  hotline?: string;
}

export default function ProductEmptyState({
  onReloadMenu,
  hotline = "1900 6868",
}: ProductEmptyStateProps) {
  const cleanHotline = hotline.replace(/\s+/g, "");

  return (
    <div
      id="view-empty"
      role="status"
      aria-live="polite"
      data-testid="product-empty-state"
      className="w-full bg-surface-container-lowest rounded-3xl p-space-xl sm:p-14 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
    >
      {/* Hiệu ứng ánh sáng nền dịu nhẹ */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />

      {/* Minh họa ly cà phê nghệ nhân tối giản (SVG từ thiết kế Stitch) */}
      <div className="relative w-44 h-44 mb-space-lg flex items-center justify-center">
        <div className="absolute inset-2 rounded-full bg-surface-container-low shadow-inner" />
        <svg
          className="relative w-36 h-36"
          fill="none"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <ellipse
            className="text-surface-container-highest"
            cx="80"
            cy="138"
            fill="currentColor"
            rx="42"
            ry="7"
          />
          <path
            className="text-tertiary-fixed-dim animate-pulse"
            d="M74 36C72 28 78 22 75 16"
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <path
            className="text-primary-fixed-dim"
            d="M84 32C86 25 82 20 85 14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <path
            d="M50 60H110C110 60 108 106 80 106C52 106 50 60 50 60Z"
            fill="#FDF9F3"
            stroke="#8A4C22"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M56 70C64 72 96 72 104 70"
            stroke="#E6E2DC"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M108 68C118 68 124 75 124 83C124 91 116 96 106 96"
            stroke="#8A4C22"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M38 110C50 116 110 116 122 110"
            stroke="#8A4C22"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <ellipse
            cx="44"
            cy="124"
            fill="#944925"
            rx="6"
            ry="4"
            transform="rotate(-25 44 124)"
          />
          <path
            d="M42 122C43 124 45 124 46 126"
            stroke="#FDF9F3"
            strokeLinecap="round"
            strokeWidth="1"
          />
          <ellipse
            cx="120"
            cy="128"
            fill="#8A4C22"
            rx="5"
            ry="3.5"
            transform="rotate(20 120 128)"
          />
          <path
            d="M118 126C120 128 121 128 122 130"
            stroke="#FDF9F3"
            strokeLinecap="round"
            strokeWidth="1"
          />
        </svg>
        <div className="absolute bottom-1 right-3 w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-[18px]">
            menu_book
          </span>
        </div>
      </div>

      {/* Tiêu đề & Mô tả chuẩn Empty State */}
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-xs font-bold tracking-tight max-w-xl">
        Thực đơn hiện chưa có món nào
      </h2>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-lg leading-relaxed">
        Vui lòng quay lại sau hoặc liên hệ với chúng tôi để được phục vụ tốt
        nhất.
      </p>

      {/* Nút bấm "Tải lại thực đơn" & Hotline hỗ trợ */}
      <div className="flex flex-col items-center gap-space-md w-full max-w-md justify-center">
        <button
          type="button"
          onClick={onReloadMenu}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary font-title-sm text-title-sm hover:bg-secondary transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-180">
            refresh
          </span>
          <span>Tải lại thực đơn</span>
        </button>

        <a
          className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
          href={`tel:${cleanHotline}`}
        >
          <span className="material-symbols-outlined text-[18px] text-primary">
            call
          </span>
          <span>
            Cần hỗ trợ? Gọi hotline:{" "}
            <strong className="font-semibold text-on-surface">{hotline}</strong>
          </span>
        </a>
      </div>
    </div>
  );
}
