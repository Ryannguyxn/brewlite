"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import ProductCard from "@/components/ProductCard";

import {
  MOCK_CATALOG_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_HERO_BANNER,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  type CategoryId,
  type CategoryOption,
  type HeroBannerData,
  type ProductListItem,
  type SelectOption,
  type SiteConfigData,
} from "@/mock-data";
import { fetchCatalogData } from "@/services/api.service";

export default function HomePage() {
  // ==========================================================================
  // PHẦN 1: QUẢN LÝ STATE & GỌI DỮ LIỆU TỪ SERVICE (CHUẨN API CONTRACT v1.0)
  // ==========================================================================
  const [products, setProducts] = useState<ProductListItem[]>(
    MOCK_CATALOG_PRODUCTS
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [categories, setCategories] =
    useState<CategoryOption[]>(MOCK_CATEGORIES);
  const [sortOptions, setSortOptions] =
    useState<SelectOption[]>(MOCK_SORT_OPTIONS);
  const [priceFilterOptions, setPriceFilterOptions] = useState<SelectOption[]>(
    MOCK_PRICE_FILTER_OPTIONS
  );
  const [heroBanner, setHeroBanner] =
    useState<HeroBannerData>(MOCK_HERO_BANNER);
  const [siteConfig, setSiteConfig] =
    useState<SiteConfigData>(MOCK_SITE_CONFIG);

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [sortBy, setSortBy] = useState("popular");
  const [priceRange, setPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadMenuData = useCallback(async () => {
    setErrorMessage(null);
    try {
      // Gọi fetchCatalogData() -> bên trong gọi getProducts() (`GET /products` trả về `{ items: ProductListItem[] }`)
      const catalogRes = await fetchCatalogData();
      setProducts(catalogRes.products);
      setCategories(catalogRes.categories);
      setSortOptions(catalogRes.sortOptions);
      setPriceFilterOptions(catalogRes.priceFilterOptions);
      setHeroBanner(catalogRes.heroBanner);
      setSiteConfig(catalogRes.siteConfig);
    } catch {
      setErrorMessage("Không thể tải thực đơn, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

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

            {/* Trạng thái Lỗi khi không gọi được GET /products (AC-US-CAT-01-03 & API Contract Mục 3.6) */}
            {errorMessage && (
              <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm text-center flex flex-col items-center justify-center gap-space-sm mb-space-lg">
                <span className="material-symbols-outlined text-[36px] text-error">
                  error
                </span>
                <p className="font-title-md text-title-md text-on-surface">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={loadMenuData}
                  className="mt-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Trạng thái Empty khi thực đơn trống (AC-US-CAT-01-02 & API Contract Mục 3.4) */}
            {!loading && !errorMessage && products.length === 0 && (
              <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm text-center">
                <p className="font-title-md text-title-md text-on-surface">
                  Hiện chưa có sản phẩm nào trong thực đơn
                </p>
              </div>
            )}

            {/* Danh sách thẻ sản phẩm (Product Grid) */}
            {!errorMessage && filteredProducts.length > 0 && (
              <div className="grid grid-cols-12 gap-gutter" id="menu-grid">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="col-span-12 sm:col-span-6 lg:col-span-3"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
