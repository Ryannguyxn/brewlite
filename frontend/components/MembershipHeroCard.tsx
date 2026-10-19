"use client";

import React from "react";

interface MembershipHeroCardProps {
  points: number;
  onOpenQr: () => void;
  onSwitchTab: (tab: "wallet" | "exchange" | "history") => void;
}

export default function MembershipHeroCard({
  points,
  onOpenQr,
  onSwitchTab,
}: MembershipHeroCardProps) {
  const diamondTarget = 300;
  const progressPercent = Math.min(
    100,
    Math.round((points / diamondTarget) * 100)
  );
  const pointsRemaining = Math.max(0, diamondTarget - points);

  return (
    <div className="grid grid-cols-12 gap-gutter items-stretch">
      {/* High Luxury Gold Tier Card (Left 7 Cols) */}
      <div className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-container via-primary to-on-primary-fixed-variant text-on-primary p-space-lg shadow-xl flex flex-col justify-between min-h-[300px]">
        {/* Subtle luxury decorative watermark */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none" />
        <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[200px] leading-none">
            local_cafe
          </span>
        </div>

        {/* Card Top Bar */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-container-lowest/20 backdrop-blur-md p-1 shadow-inner flex items-center justify-center">
              <span
                className="material-symbols-outlined text-tertiary-fixed text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-md text-headline-md tracking-tight font-bold text-surface-container-lowest">
                  Nguyễn Hải Đăng
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md shadow-sm">
                  ★ HẠNG VÀNG
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-surface-container-high/80 mt-0.5">
                Mã hội viên: #BL-8942-GLD • Thành viên từ 03/2023
              </p>
            </div>
          </div>
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 backdrop-blur-sm text-surface-container-lowest font-label-md text-label-md transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              qr_code_2
            </span>
            <span>QR Tích điểm</span>
          </button>
        </div>

        {/* Card Mid: Points Balance */}
        <div className="relative z-10 my-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-body-sm text-body-sm text-surface-container-highest tracking-wide uppercase">
              Số dư điểm khả dụng
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display-lg text-display-lg font-bold text-surface-container-lowest leading-none">
                {points}
              </span>
              <span className="font-title-md text-title-md text-tertiary-fixed font-semibold">
                BrewPoints
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-surface-container-high/90 mt-1">
              ≈ Đổi được{" "}
              <span className="font-semibold text-tertiary-fixed underline underline-offset-2">
                02 ly Specialty Coffee
              </span>{" "}
              tại quầy
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSwitchTab("exchange")}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-md hover:bg-surface-container-low transition-all cursor-pointer"
              type="button"
            >
              Đổi quà ngay
            </button>
            <a
              className="px-3 py-2 rounded-lg bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 backdrop-blur-sm text-surface-container-lowest font-label-md text-label-md flex items-center gap-1 transition-colors"
              href="#rules"
            >
              Quy chế hạng
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
            </a>
          </div>
        </div>

        {/* Card Bottom: Diamond Tier Progression Bar */}
        <div className="relative z-10 pt-3 bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-3.5">
          <div className="flex items-center justify-between text-body-sm font-body-sm mb-1.5">
            <span className="text-surface-container-lowest font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">
                diamond
              </span>
              Tiến độ thăng hạng:{" "}
              <strong className="text-tertiary-fixed font-bold">
                HẠNG KIM CƯƠNG
              </strong>
            </span>
            <span className="text-surface-container-highest font-semibold">
              {points} / {diamondTarget} điểm
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-container-lowest/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-tertiary-fixed to-secondary-fixed rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 font-body-sm text-[11px] text-surface-container-high/90">
            <span>
              Còn <strong>{pointsRemaining} điểm</strong> nữa để thăng hạng
            </span>
            <span className="text-tertiary-fixed font-medium">
              Đặc quyền mới: Tích x1.5 điểm • Free Upsize • Quà sinh nhật
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Next Tier Perks Info (Right 5 Cols) */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-between gap-space-sm bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              workspace_premium
            </span>
            <h3 className="font-title-md text-title-md text-on-surface">
              Đặc quyền Hạng Vàng của bạn
            </h3>
          </div>
          <a
            href="#rules"
            className="text-primary font-label-md text-label-md cursor-pointer hover:underline"
          >
            Chi tiết
          </a>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                percent
              </span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface">
                Tích lũy 8% trên giá trị hóa đơn
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Mỗi 10.000 đ thanh toán quy đổi thành 1 BrewPoint.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low">
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                cake
              </span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface">
                Tặng 01 Bánh ngọt Specialty sinh nhật
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Voucher tự động kích hoạt vào tháng sinh nhật của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low">
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                local_shipping
              </span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface">
                Ưu tiên giao hàng &amp; Voucher FreeShip
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Nhận 02 mã Freeship bán kính 5km vào ngày 1 hàng tháng.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-space-xs flex items-center justify-between bg-surface-container p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              history
            </span>
            <span className="font-label-lg text-label-lg text-on-surface">
              Kiểm tra lịch sử giao dịch?
            </span>
          </div>
          <button
            onClick={() => onSwitchTab("history")}
            className="font-label-md text-label-md text-primary font-bold hover:underline cursor-pointer"
            type="button"
          >
            Xem sao kê điểm →
          </button>
        </div>
      </div>
    </div>
  );
}
