"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import ProductCard from "@/components/ProductCard";
import PaginationBar from "@/components/PaginationBar";

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
  type ProductItem,
  type SelectOption,
  type SiteConfigData,
} from "@/mock-data";
import { fetchCatalogData } from "@/services/api.service";

export default function HomePage() {
  // ==========================================================================
  // PHẦN 1: QUẢN LÝ STATE & GỌI DỮ LIỆU TỪ SERVICE (LOGIC TÁCH BIỆT UI)
  // ==========================================================================
  const [products, setProducts] = useState<ProductItem[]>(
    MOCK_CATALOG_PRODUCTS
  );
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
  const [currentPage, setCurrentPage] = useState(1);

  // Toast thông báo nhẹ khi người dùng tương tác các tính năng ngoài scope Sprint 1
  const [featureToast, setFeatureToast] = useState<{
    visible: boolean;
    title: string;
    subtitle: string;
    imageUrl?: string;
  }>({ visible: false, title: "", subtitle: "" });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const catalogRes = await fetchCatalogData();
      if (!isMounted) return;
      setProducts(catalogRes.products);
      setCategories(catalogRes.categories);
      setSortOptions(catalogRes.sortOptions);
      setPriceFilterOptions(catalogRes.priceFilterOptions);
      setHeroBanner(catalogRes.heroBanner);
      setSiteConfig(catalogRes.siteConfig);
    }

    loadInitialData();
    return () => {
      isMounted = false;
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Lọc và sắp xếp danh sách sản phẩm theo state người dùng chọn
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory !== "all") {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
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
      list.sort((a, b) => a.basePriceVnd - b.basePriceVnd);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.basePriceVnd - a.basePriceVnd);
    } else if (sortBy === "newest") {
      list.sort(
        (a, b) => (b.badge === "Mới" ? 1 : 0) - (a.badge === "Mới" ? 1 : 0)
      );
    }

    return list;
  }, [products, activeCategory, searchQuery, priceRange, sortBy]);

  const showPendingToast = (
    title: string,
    subtitle: string,
    imageUrl?: string
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setFeatureToast({
      visible: true,
      title,
      subtitle,
      imageUrl,
    });
    toastTimerRef.current = setTimeout(() => {
      setFeatureToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  };

  const handleAddToCartClick = (product: ProductItem) => {
    showPendingToast(
      "Tính năng đang hoàn thiện",
      `Giỏ hàng cho "${product.name}" sẽ được mở ở Sprint tiếp theo.`,
      product.imageUrl
    );
  };

  const handleHeaderFeatureNotice = (featureLabel: string) => {
    showPendingToast(
      "Tính năng đang hoàn thiện",
      `Chức năng "${featureLabel}" sẽ được cập nhật ở Sprint tiếp theo.`
    );
  };

  // ==========================================================================
  // PHẦN 2: HIỂN THỊ GIAO DIỆN (UI RENDERING)
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface">
      <Header
        cartCount={0}
        onOpenCart={() => handleHeaderFeatureNotice("Giỏ hàng")}
        onFeatureNotice={handleHeaderFeatureNotice}
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

            <div className="grid grid-cols-12 gap-gutter" id="menu-grid">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="col-span-12 sm:col-span-6 lg:col-span-3"
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCartClick}
                  />
                </div>
              ))}
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={1}
              showingCount={filteredProducts.length}
              totalItems={siteConfig.totalCatalogCount}
              onPageChange={setCurrentPage}
            />
          </section>
        </div>
      </main>

      {/* Toast thông báo nhẹ khi bấm vào nút Thêm vào giỏ / + / các tính năng chưa thuộc Sprint 1 */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-40 bg-on-surface text-surface-container-lowest p-3 pr-4 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all duration-300 ${
          featureToast.visible
            ? "translate-y-0 opacity-100"
            : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        {featureToast.imageUrl && (
          <img
            src={featureToast.imageUrl}
            alt={featureToast.title}
            className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-primary/40"
          />
        )}
        <div className="flex flex-col">
          <span className="font-label-md text-[11px] text-secondary-fixed flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">info</span>
            {featureToast.title}
          </span>
          <span className="font-body-sm text-body-sm text-surface-container-lowest">
            {featureToast.subtitle}
          </span>
        </div>
        <button
          onClick={() =>
            setFeatureToast((prev) => ({ ...prev, visible: false }))
          }
          className="ml-2 p-1 rounded-lg hover:bg-white/10 text-surface-container-lowest/80 hover:text-surface-container-lowest transition-colors cursor-pointer"
          type="button"
          aria-label="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
