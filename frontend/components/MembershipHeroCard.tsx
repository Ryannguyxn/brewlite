"use client";

import React from "react";
import {
  MOCK_GOLD_PERKS,
  MOCK_USER_PROFILE,
  type MembershipPerk,
  type UserProfile,
} from "@/mock-data";

interface MembershipHeroCardProps {
  points: number;
  userProfile?: UserProfile;
  perks?: MembershipPerk[];
  onOpenQr: () => void;
  onSwitchTab: (tab: "wallet" | "exchange" | "history") => void;
}

export default function MembershipHeroCard({
  points,
  userProfile = MOCK_USER_PROFILE,
  perks = MOCK_GOLD_PERKS,
  onOpenQr,
  onSwitchTab,
}: MembershipHeroCardProps) {
  const diamondTarget = userProfile.nextTierPoints;
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
                  {userProfile.fullName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md shadow-sm">
                  {userProfile.tierBadge}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-surface-container-high/80 mt-0.5">
                Mã hội viên: {userProfile.memberCode} • Thành viên từ{" "}
                {userProfile.memberSince}
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
                {userProfile.equivalentRewardHint}
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
                {userProfile.nextTierName}
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
              {userProfile.nextTierPerksSummary}
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
              Đặc quyền {userProfile.tierName} của bạn
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
          {perks.map((perk) => (
            <div
              key={perk.id}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low"
            >
              <div
                className={`w-8 h-8 rounded-lg ${perk.iconBgClass} flex items-center justify-center ${perk.iconTextClass} flex-shrink-0`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {perk.icon}
                </span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">
                  {perk.title}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {perk.description}
                </p>
              </div>
            </div>
          ))}
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
