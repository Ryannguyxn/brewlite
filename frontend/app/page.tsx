"use client";

import React, { useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import ProductCard from "@/components/ProductCard";

import { type CategoryId, type ProductListItem } from "@/mock-data";
import { getCatalogData } from "@/services/api.service";

export default function HomePage() {
  // ==========================================================================
  // PHẦN 1: QUẢN LÝ STATE & DỮ LIỆU MOCK (SPRINT 1 — SCRUM-26)
  // ==========================================================================
  const {
    products,
    categories,
    sortOptions,
    priceFilterOptions,
    heroBanner,
    siteConfig,
  } = useMemo(() => getCatalogData(), []);

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [sortBy, setSortBy] = useState("popular");
  const [priceRange, setPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Thông báo khi tương tác với nút "Thêm vào giỏ" hoặc ô "Giỏ hàng"
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCartUnderConstructionNotice = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const handleAddToCart = (_product: ProductListItem) => {
    showCartUnderConstructionNotice();
  };

  const handleDismissToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastVisible(false);
  };

  // Lọc và sắp xếp danh sách sản phẩm theo đúng trường chuẩn của API Contract (`basePriceVnd`, `name`, `id`, `isAvailable`)
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory !== "all") {
      list = list.filter((p) => !p.category || p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (priceRange === "under-45") {
      list = list.filter((p) => p.basePriceVnd < 45000);
    } else if (priceRange === "45-60") {
      list = list.filter(
        (p) => p.basePriceVnd >= 45000 && p.basePriceVnd <= 60000
      );
    } else if (priceRange === "above-60") {
      list = list.filter((p) => p.basePriceVnd > 60000);
    }

    if (sortBy === "price-asc") {
      list.sort(
        (a, b) =>
          a.basePriceVnd - b.basePriceVnd ||
          a.name.localeCompare(b.name, "vi") ||
          a.id.localeCompare(b.id)
      );
    } else if (sortBy === "price-desc") {
      list.sort(
        (a, b) =>
          b.basePriceVnd - a.basePriceVnd ||
          a.name.localeCompare(b.name, "vi") ||
          a.id.localeCompare(b.id)
      );
    } else if (sortBy === "newest") {
      list.sort(
        (a, b) => (b.badge === "Mới" ? 1 : 0) - (a.badge === "Mới" ? 1 : 0)
      );
    } else {
      // Mặc định theo API Contract Mục 3.5 & BR-017: sắp xếp theo `name` ASC, sau đó `id` ASC
      list.sort(
        (a, b) =>
          a.name.localeCompare(b.name, "vi") || a.id.localeCompare(b.id)
      );
    }

    return list;
  }, [products, activeCategory, searchQuery, priceRange, sortBy]);

  // ==========================================================================
  // PHẦN 2: HIỂN THỊ GIAO DIỆN (UI RENDERING)
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface">
      <Header
        onCartClick={showCartUnderConstructionNotice}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeNav="thuc-don"
        siteConfig={siteConfig}
      />

      <main className="w-full pt-20 bg-background min-h-screen flex-1">
        <div className="flex flex-col w-full">
          <HeroBanner data={heroBanner} />

          <CategoryFilterBar
            categories={categories}
            sortOptions={sortOptions}
            priceFilterOptions={priceFilterOptions}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />

          <section className="max-w-[1320px] mx-auto px-margin w-full py-space-xl">
            <div className="flex items-center justify-between mb-space-lg">
              <div className="flex items-baseline gap-space-sm">
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  Thực Đơn Chọn Lọc
                </h2>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {filteredProducts.length} trên tổng số{" "}
                  {siteConfig.totalCatalogCount} công thức đặc trưng
                </span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                {siteConfig.deliveryHighlight}
              </div>
            </div>

            {/* Danh sách thẻ sản phẩm (Product Grid) */}
            <div className="grid grid-cols-12 gap-gutter" id="menu-grid">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="col-span-12 sm:col-span-6 lg:col-span-3"
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Toast thông báo mục giỏ hàng đang trong quá trình xây dựng */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-50 bg-on-surface text-surface-container-lowest px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 ${
          toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
          info
        </span>
        <span className="font-title-sm text-title-sm text-surface-container-lowest">
          Mục giỏ hàng hiện đang trong quá trình xây dựng
        </span>
        <button
          type="button"
          onClick={handleDismissToast}
          aria-label="Đóng thông báo"
          className="ml-2 p-1 rounded-lg text-surface-variant hover:text-surface-container-lowest transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
