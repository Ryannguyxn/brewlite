"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import ProductCard from "@/components/ProductCard";
import PaginationBar from "@/components/PaginationBar";
import ProductSkeletonGrid from "@/components/ProductSkeletonGrid";
import ProductEmptyState from "@/components/ProductEmptyState";
import ProductErrorState from "@/components/ProductErrorState";

import {
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
  // PHẦN 1: QUẢN LÝ STATE & TẢI DỮ LIỆU BẤT ĐỒNG BỘ (LOADING -> DATA / EMPTY / ERROR)
  // ==========================================================================
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

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
    let isCancelled = false;

    // Hỗ trợ Tester kiểm thử nhanh qua query param (?state=empty | ?state=error | ?state=loading)
    const searchParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const stateParam = searchParams?.get("state")?.toLowerCase();

    if (stateParam === "loading") {
      return () => {
        isCancelled = true;
      };
    }

    fetchCatalogData({
      forceEmpty: stateParam === "empty",
      forceError: stateParam === "error",
    })
      .then((catalogRes) => {
        if (isCancelled) return;
        setProducts(catalogRes.products);
        setCategories(catalogRes.categories);
        setSortOptions(catalogRes.sortOptions);
        setPriceFilterOptions(catalogRes.priceFilterOptions);
        setHeroBanner(catalogRes.heroBanner);
        setSiteConfig(catalogRes.siteConfig);
        setErrorMessage(null);
      })
      .catch(() => {
        if (isCancelled) return;
        setProducts([]);
        setCategories(
          MOCK_CATEGORIES.map((cat) =>
            cat.id === "all" ? { ...cat, label: "Tất cả (0)" } : cat
          )
        );
        setSiteConfig((prev) => ({
          ...prev,
          totalCatalogCount: 0,
        }));
        setErrorMessage(
          "Hệ thống kết nối đến quầy bar chi nhánh Saigon Center đang bị gián đoạn hoặc đường truyền không ổn định. Dữ liệu thực đơn và giá món chưa thể cập nhật theo thời gian thực."
        );
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const handleRetryLoad = () => {
    setActiveCategory("all");
    setSortBy("popular");
    setPriceRange("all");
    setSearchQuery("");
    setCurrentPage(1);
    setIsLoading(true);
    setErrorMessage(null);
    setProducts([]);
    setReloadKey((prev) => prev + 1);
  };

  // Lọc và sắp xếp danh sách sản phẩm theo đúng trường chuẩn của API Contract (`basePriceVnd`, `name`, `id`, `isAvailable`)
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
          {/* Thanh trạng thái đồng bộ thời gian thực — CHỈ hiển thị khi đang loading chưa nhận dữ liệu */}
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              className="w-full bg-gradient-to-r from-surface-container-low via-surface to-surface-container-low py-space-xs px-margin shadow-sm"
            >
              <div className="max-w-[1320px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                  <span className="font-medium text-on-surface">
                    Đang đồng bộ thực đơn theo thời gian thực:
                  </span>
                  <span>
                    Dữ liệu máy chủ chi nhánh Saigon Center đang được tải
                    xuống...
                  </span>
                </div>
                <div className="hidden lg:flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">
                    bolt
                  </span>
                  <span>
                    Phiên kết nối SCA-API v2.4 • Độ trễ dự kiến: ~420ms
                  </span>
                </div>
              </div>
            </div>
          )}

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
              <div className="flex items-baseline gap-space-sm flex-wrap">
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                  Thực Đơn Chọn Lọc
                </h2>
                {isLoading ? (
                  <span
                    id="state-counter"
                    className="bg-surface-container px-2.5 py-0.5 rounded-md text-primary font-body-sm text-body-sm font-medium"
                  >
                    8 thẻ mẫu vị trí
                  </span>
                ) : (
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {filteredProducts.length} trên tổng số{" "}
                    {siteConfig.totalCatalogCount} công thức đặc trưng
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center gap-1.5 text-tertiary font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    sync
                  </span>
                  <span>Tự động làm mới khi có dữ liệu</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                  {siteConfig.deliveryHighlight}
                </div>
              )}
            </div>

            {/* 1. TRẠNG THÁI LOADING (SKELETON SHIMMER) — Chỉ hiển thị khi đang tải chưa nhận dữ liệu */}
            {isLoading && <ProductSkeletonGrid />}

            {/* 2. TRẠNG THÁI LỖI KẾT NỐI (ERROR STATE — API Contract Mục 5.6 & 5.7) */}
            {!isLoading && errorMessage && (
              <ProductErrorState
                onRetry={handleRetryLoad}
                errorMessage={errorMessage}
                errorCode={500}
                hotline={siteConfig.hotline}
              />
            )}

            {/* 3. TRẠNG THÁI EMPTY STATE (Mảng dữ liệu rỗng items: [] khi GET /products trả về 200 OK — API Contract Mục 3.5 & 5.7) */}
            {!isLoading && !errorMessage && filteredProducts.length === 0 && (
              <ProductEmptyState
                onReloadMenu={handleRetryLoad}
                hotline={siteConfig.hotline}
              />
            )}

            {/* 4. DANH SÁCH THẺ SẢN PHẨM (PRODUCT GRID) — Hiển thị khi đã nhận dữ liệu */}
            {!isLoading && !errorMessage && filteredProducts.length > 0 && (
              <>
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
              </>
            )}
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
