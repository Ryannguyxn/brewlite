"use client";

import React from "react";

interface ProductErrorStateProps {
  onRetry: () => void;
  errorMessage?: string;
  errorCode?: number | null;
  errorTitle?: string;
  hotline?: string;
}

export default function ProductErrorState({
  onRetry,
  errorMessage = "Hệ thống kết nối đến quầy bar chi nhánh Saigon Center đang bị gián đoạn hoặc đường truyền không ổn định. Dữ liệu thực đơn và giá món chưa thể cập nhật theo thời gian thực.",
  errorCode,
  errorTitle,
  hotline = "1900 6868",
}: ProductErrorStateProps) {
  const cleanHotline = hotline.replace(/\s+/g, "");

  return (
    <div
      id="view-error"
      role="alert"
      aria-live="assertive"
      data-testid="product-error-state"
      className="w-full bg-surface-container-lowest rounded-3xl p-space-xl sm:p-14 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
    >
      {/* Hiệu ứng ánh sáng nền dịu nhẹ */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />

      {/* Minh họa bình pha cà phê thủ công ngắt kết nối màu đất nung (SVG từ thiết kế Stitch) */}
      <div className="relative mb-space-lg">
        <div className="w-24 h-24 rounded-3xl bg-surface-container-low flex items-center justify-center text-primary shadow-inner">
          <svg
            aria-hidden="true"
            className="w-12 h-12 text-primary"
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 14L18 30C18.6 31.2 19.8 32 21.2 32H26.8C28.2 32 29.4 31.2 30 30L38 14H10Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
            <path
              d="M8 38H40"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <path
              d="M16 38V41C16 41.6 16.4 42 17 42H31C31.6 42 32 41.6 32 41V38"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <circle cx="24" cy="35" fill="currentColor" r="1.5" />
            <path
              d="M20 7C20.5 5 21.8 4 23 4C24.5 4 25.2 5.5 25.5 7"
              stroke="#b15f00"
              strokeDasharray="2 3"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <path
              d="M16 9C16.8 6.5 18.5 5 20.5 5"
              opacity="0.6"
              stroke="#b15f00"
              strokeLinecap="round"
              strokeWidth="1.75"
            />
          </svg>
        </div>

        {/* Huy hiệu trạng thái ngắt kết nối (1 hàng ngang kèm icon) */}
        <div className="absolute -bottom-2 -right-4 bg-secondary-fixed text-on-secondary-fixed px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm whitespace-nowrap w-max">
          <span className="material-symbols-outlined text-[14px] shrink-0 leading-none">
            cloud_off
          </span>
          <span className="font-label-md text-[10px] uppercase font-bold tracking-wider whitespace-nowrap leading-none">
            Mất đồng bộ
          </span>
        </div>
      </div>

      {/* Hiển thị mã lỗi thật khi có, hoặc thông báo kết nối chung nếu không xác định được mã */}
      <div
        data-testid="error-code-badge"
        className="inline-flex items-center gap-space-xs bg-surface-container px-space-md py-1 rounded-full text-on-surface-variant font-label-md text-label-md mb-space-md"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
        <span className="font-mono tracking-tight font-semibold uppercase">
          {errorCode
            ? `MÃ LỖI: ${errorCode}${errorTitle ? ` ${errorTitle}` : errorCode === 500 ? " INTERNAL_SERVER_ERROR" : ""}`
            : "LỖI KẾT NỐI MÁY CHỦ"}
        </span>
      </div>

      {/* Tiêu đề & Mô tả chuẩn Error State */}
      <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight max-w-xl font-bold mb-space-xs">
        Không thể kết nối đến máy chủ
      </h2>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-lg leading-relaxed">
        {errorMessage}
      </p>

      {/* Duy nhất nút CTA "Thử lại" & Số hotline hỗ trợ 1900 6868 */}
      <div className="flex flex-col items-center gap-space-md w-full max-w-md justify-center">
        <button
          type="button"
          onClick={onRetry}
          data-testid="retry-button"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary font-title-sm text-title-sm hover:bg-secondary transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-180">
            refresh
          </span>
          <span>Thử lại</span>
        </button>

        <a
          className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
          href={`tel:${cleanHotline}`}
          data-testid="error-hotline-link"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">
            phone_in_talk
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
