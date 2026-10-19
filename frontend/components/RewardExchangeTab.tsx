"use client";

import React, { useState } from "react";
import {
  MOCK_REWARD_CATALOG,
  type RewardCatalogItem,
} from "@/mock-data";

export type { RewardCatalogItem };
export const REWARD_CATALOG = MOCK_REWARD_CATALOG;

interface RewardExchangeTabProps {
  userPoints: number;
  rewards?: RewardCatalogItem[];
  onRedeem: (reward: RewardCatalogItem) => void;
}

export default function RewardExchangeTab({
  userPoints,
  rewards = MOCK_REWARD_CATALOG,
  onRedeem,
}: RewardExchangeTabProps) {
  const [rangeFilter, setRangeFilter] = useState<
    "all" | "under100" | "100to200" | "over200"
  >("all");

  const filteredRewards = rewards.filter((item) => {
    if (rangeFilter === "under100") return item.points < 100;
    if (rangeFilter === "100to200")
      return item.points >= 100 && item.points <= 200;
    if (rangeFilter === "over200") return item.points > 200;
    return true;
  });

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              storefront
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Cửa hàng Đổi quà BrewPoints
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Số dư khả dụng hiện tại:{" "}
            <strong className="text-primary font-bold">
              {userPoints} BrewPoints
            </strong>
            . Điểm sau khi đổi sẽ lập tức chuyển thành voucher trong ví.
          </p>
        </div>

        {/* Filter range buttons */}
        <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg shadow-sm overflow-x-auto">
          <button
            onClick={() => setRangeFilter("all")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "all"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            Tất cả
          </button>
          <button
            onClick={() => setRangeFilter("under100")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "under100"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            Dưới 100 điểm
          </button>
          <button
            onClick={() => setRangeFilter("100to200")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "100to200"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            100 - 200 điểm
          </button>
          <button
            onClick={() => setRangeFilter("over200")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "over200"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            Trên 200 điểm
          </button>
        </div>
      </div>

      {/* Reward Exchange Grid (6 Rewards - 3 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filteredRewards.map((reward) => {
          const canRedeem = userPoints >= reward.points;
          const missingPoints = Math.max(0, reward.points - userPoints);
          const progressPct = Math.min(
            100,
            Math.round((userPoints / reward.points) * 100)
          );

          return (
            <div
              key={reward.id}
              className={`bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between group relative overflow-hidden transition-all ${
                canRedeem ? "hover:shadow-md" : "opacity-85"
              }`}
            >
              {!canRedeem && (
                <div className="absolute inset-0 bg-surface-container/20 pointer-events-none" />
              )}

              <div>
                <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container-low mb-space-sm">
                  <img
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      canRedeem
                        ? "group-hover:scale-105"
                        : "grayscale-[20%] group-hover:scale-100"
                    }`}
                    alt={reward.imageAlt}
                    src={reward.image}
                  />
                  <span
                    className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full font-label-md text-[11px] font-bold shadow-sm ${
                      reward.popular
                        ? "bg-primary text-on-primary"
                        : reward.physical
                        ? "bg-inverse-surface text-inverse-on-surface"
                        : "bg-surface-container-lowest/90 backdrop-blur-md text-primary"
                    }`}
                  >
                    {reward.tag}
                  </span>

                  <span
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full font-label-md text-[11px] font-semibold ${
                      canRedeem
                        ? "bg-secondary-fixed text-on-secondary-fixed"
                        : "bg-error-container text-on-error-container"
                    }`}
                  >
                    {canRedeem ? "Đủ điểm đổi" : `Thiếu ${missingPoints} điểm`}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1.5 font-title-sm text-title-sm font-bold ${
                    canRedeem ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {canRedeem ? "monetization_on" : "lock"}
                  </span>
                  <span>{reward.points} BrewPoints</span>
                </div>

                <h3 className="font-title-md text-title-md text-on-surface font-bold mt-1">
                  {reward.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                  {reward.description}
                </p>

                {!canRedeem && (
                  <div className="mt-3 bg-surface-container-low p-2.5 rounded-lg">
                    <div className="flex items-center justify-between text-[11px] font-label-md text-on-surface-variant mb-1">
                      <span>Tiến độ tích lũy</span>
                      <span className="font-bold text-primary">
                        {userPoints} / {reward.points} điểm
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-2 flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-outline">
                  {reward.stockText}
                </span>
                {canRedeem ? (
                  <button
                    onClick={() => onRedeem(reward)}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
                    type="button"
                  >
                    Đổi quà ngay
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 rounded-lg bg-surface-container-high text-outline cursor-not-allowed font-label-md text-label-md"
                    type="button"
                  >
                    Chưa đủ điểm
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
