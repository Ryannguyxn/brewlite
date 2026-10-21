"use client";

import React from "react";

interface SkeletonCardConfig {
  id: string;
  shimmerClass: string;
  badgeWidth: string;
  tagWidths: string[];
  titleWidth: string;
  subtitleWidth: string;
  descWidth: string;
  priceWidth: string;
  priceLabelWidth: string;
}

const SKELETON_CARDS: SkeletonCardConfig[] = [
  {
    id: "skeleton-1",
    shimmerClass: "animate-[shimmer_1.8s_infinite]",
    badgeWidth: "w-16",
    tagWidths: ["w-20", "w-12"],
    titleWidth: "w-3/4",
    subtitleWidth: "w-1/2",
    descWidth: "w-4/5",
    priceWidth: "w-24",
    priceLabelWidth: "w-14",
  },
  {
    id: "skeleton-2",
    shimmerClass: "animate-[shimmer_1.8s_infinite_100ms]",
    badgeWidth: "w-20",
    tagWidths: ["w-16"],
    titleWidth: "w-4/5",
    subtitleWidth: "w-2/5",
    descWidth: "w-3/4",
    priceWidth: "w-20",
    priceLabelWidth: "w-12",
  },
  {
    id: "skeleton-3",
    shimmerClass: "animate-[shimmer_1.8s_infinite_200ms]",
    badgeWidth: "w-14",
    tagWidths: ["w-24"],
    titleWidth: "w-2/3",
    subtitleWidth: "w-1/2",
    descWidth: "w-5/6",
    priceWidth: "w-28",
    priceLabelWidth: "w-16",
  },
  {
    id: "skeleton-4",
    shimmerClass: "animate-[shimmer_1.8s_infinite_300ms]",
    badgeWidth: "w-24",
    tagWidths: ["w-16", "w-16"],
    titleWidth: "w-5/6",
    subtitleWidth: "w-3/5",
    descWidth: "w-2/3",
    priceWidth: "w-24",
    priceLabelWidth: "w-14",
  },
  {
    id: "skeleton-5",
    shimmerClass: "animate-[shimmer_1.8s_infinite_400ms]",
    badgeWidth: "w-16",
    tagWidths: ["w-20"],
    titleWidth: "w-3/4",
    subtitleWidth: "w-1/2",
    descWidth: "w-4/5",
    priceWidth: "w-20",
    priceLabelWidth: "w-14",
  },
  {
    id: "skeleton-6",
    shimmerClass: "animate-[shimmer_1.8s_infinite_500ms]",
    badgeWidth: "w-20",
    tagWidths: ["w-14"],
    titleWidth: "w-4/5",
    subtitleWidth: "w-2/3",
    descWidth: "w-3/5",
    priceWidth: "w-24",
    priceLabelWidth: "w-12",
  },
  {
    id: "skeleton-7",
    shimmerClass: "animate-[shimmer_1.8s_infinite_600ms]",
    badgeWidth: "w-16",
    tagWidths: ["w-20", "w-14"],
    titleWidth: "w-2/3",
    subtitleWidth: "w-1/2",
    descWidth: "w-4/5",
    priceWidth: "w-28",
    priceLabelWidth: "w-16",
  },
  {
    id: "skeleton-8",
    shimmerClass: "animate-[shimmer_1.8s_infinite_700ms]",
    badgeWidth: "w-16",
    tagWidths: ["w-16"],
    titleWidth: "w-3/4",
    subtitleWidth: "w-2/5",
    descWidth: "w-3/4",
    priceWidth: "w-24",
    priceLabelWidth: "w-14",
  },
];

export default function ProductSkeletonGrid() {
  return (
    <div
      id="view-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách sản phẩm"
      className="w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {SKELETON_CARDS.map((card) => (
          <div
            key={card.id}
            data-testid="product-skeleton-card"
            className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col gap-space-md shadow-sm relative overflow-hidden group"
          >
            {/* Khung ảnh Skeleton */}
            <div className="relative w-full h-48 rounded-lg bg-surface-container-high overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
              />
              <div
                className={`absolute top-2.5 left-2.5 ${card.badgeWidth} h-5 rounded-full bg-surface-container overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/80 to-transparent -translate-x-full ${card.shimmerClass}`}
                />
              </div>
            </div>

            {/* Khung thông tin sản phẩm Skeleton */}
            <div className="flex flex-col gap-2 flex-grow">
              <div className="flex items-center gap-2">
                {card.tagWidths.map((tagWidth, index) => (
                  <div
                    key={index}
                    className={`${tagWidth} h-4 rounded-full ${
                      index === 0
                        ? "bg-surface-container-high"
                        : "bg-surface-container"
                    } relative overflow-hidden`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                    />
                  </div>
                ))}
              </div>

              <div
                className={`${card.titleWidth} h-5 rounded-md bg-surface-container-high relative overflow-hidden mt-1`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                />
              </div>

              <div
                className={`${card.subtitleWidth} h-4 rounded-md bg-surface-container relative overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                />
              </div>

              <div className="space-y-1.5 mt-2">
                <div className="w-full h-3 rounded-md bg-surface-container-low relative overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                  />
                </div>
                <div
                  className={`${card.descWidth} h-3 rounded-md bg-surface-container-low relative overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                  />
                </div>
              </div>
            </div>

            {/* Khung giá bán và nút hành động Skeleton */}
            <div className="pt-space-sm flex items-center justify-between mt-auto">
              <div className="flex flex-col gap-1">
                <div
                  className={`${card.priceWidth} h-6 rounded-md bg-surface-container-high relative overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                  />
                </div>
                <div
                  className={`${card.priceLabelWidth} h-3 rounded-md bg-surface-container relative overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                  />
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container-high relative overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent via-surface/60 to-transparent -translate-x-full ${card.shimmerClass}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
