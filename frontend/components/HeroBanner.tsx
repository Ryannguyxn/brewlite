import React from "react";
import { MOCK_HERO_BANNER, type HeroBannerData } from "@/mock-data";

interface HeroBannerProps {
  data?: HeroBannerData;
}

export default function HeroBanner({
  data = MOCK_HERO_BANNER,
}: HeroBannerProps) {
  return (
    <section className="w-full relative overflow-hidden bg-surface-container-low py-space-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
      <div className="max-w-[1320px] mx-auto px-margin relative z-10">
        <div className="grid grid-cols-12 gap-gutter items-center">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                {data.seasonBadge}
              </span>
              <span className="text-on-surface-variant font-body-sm text-body-sm">
                {data.roastSubtitle}
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
              {data.headlineLine1} <br />
              <span className="text-primary italic font-headline-xl text-headline-xl">
                {data.headlineHighlight}
              </span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              {data.description}
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 flex justify-end">
            <div className="p-space-lg rounded-xl bg-surface-container shadow-sm flex items-center gap-space-md w-full max-w-xs">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
                <span
                  className="material-symbols-outlined text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_cafe
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">
                  {data.featuredLabel}
                </span>
                <span className="font-title-sm text-title-sm text-on-surface">
                  {data.featuredDrinkName}
                </span>
                <span className="font-body-sm text-body-sm text-primary font-semibold">
                  {data.featuredPromoText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
