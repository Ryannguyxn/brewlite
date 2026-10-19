"use client";

import React from "react";

export type CategoryId =
  | "all"
  | "traditional"
  | "espresso"
  | "tea"
  | "bakery";

export interface CategoryOption {
  id: CategoryId;
  label: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: "all", label: "Tất cả (24)" },
  { id: "traditional", label: "Cà phê truyền thống" },
  { id: "espresso", label: "Espresso & Cold Brew" },
  { id: "tea", label: "Trà & Macchiato" },
  { id: "bakery", label: "Bánh & Tráng miệng" },
];

interface CategoryFilterBarProps {
  activeCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  priceRange: string;
  onPriceRangeChange: (val: string) => void;
}

export default function CategoryFilterBar({
  activeCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
}: CategoryFilterBarProps) {
  return (
    <div className="max-w-[1320px] mx-auto px-margin w-full -mt-6 relative z-20">
      <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-md flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-label-lg text-label-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
                type="button"
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-space-sm ml-auto">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-outline text-[18px]">
              sort
            </span>
            <label
              className="font-body-sm text-body-sm text-on-surface-variant"
              htmlFor="sort-select"
            >
              Sắp xếp:
            </label>
            <select
              className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="newest">Mới nhất</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-outline text-[18px]">
              tune
            </span>
            <label
              className="font-body-sm text-body-sm text-on-surface-variant"
              htmlFor="price-filter"
            >
              Khoảng giá:
            </label>
            <select
              className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
              id="price-filter"
              value={priceRange}
              onChange={(e) => onPriceRangeChange(e.target.value)}
            >
              <option value="all">Tất cả mức giá</option>
              <option value="under-45">Dưới 45.000đ</option>
              <option value="45-60">45.000đ - 60.000đ</option>
              <option value="above-60">Trên 60.000đ</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
