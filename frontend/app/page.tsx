"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import ProductCard from "@/components/ProductCard";
import PaginationBar from "@/components/PaginationBar";
import RewardsBanner from "@/components/RewardsBanner";
import CartDrawer from "@/components/CartDrawer";

import {
  MOCK_CART_CONFIG,
  MOCK_CATALOG_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_HERO_BANNER,
  MOCK_INITIAL_CART_ITEMS,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  MOCK_UPSELL_OFFER,
  type CartConfig,
  type CartItem,
  type CategoryId,
  type CategoryOption,
  type HeroBannerData,
  type ProductItem,
  type SelectOption,
  type SiteConfigData,
  type UpsellOffer,
} from "@/mock-data";
import { fetchCartData, fetchCatalogData } from "@/services/api.service";

export default function HomePage() {
  // ==========================================================================
  // PHẦN 1: QUẢN LÝ STATE & GỌI DỮ LIỆU TỪ SERVICE (LOGIC TÁCH BIỆT UI)
  // ==========================================================================
  const [products, setProducts] = useState<ProductItem[]>(MOCK_CATALOG_PRODUCTS);
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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(
    MOCK_INITIAL_CART_ITEMS
  );
  const [upsellOffer, setUpsellOffer] =
    useState<UpsellOffer>(MOCK_UPSELL_OFFER);
  const [cartConfig, setCartConfig] = useState<CartConfig>(MOCK_CART_CONFIG);

  const [cartBounceKey, setCartBounceKey] = useState(0);
  const [addedToast, setAddedToast] = useState<{
    visible: boolean;
    productName: string;
    image: string;
  }>({ visible: false, productName: "", image: "" });

  // Gọi hàm giả lập API khi khởi tạo trang
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      // TODO: Thay thế fetchCatalogData() & fetchCartData() trong services/api.service.ts
      // bằng axios.get('http://localhost:3001/products') khi ghép nối Backend thật.
      const [catalogRes, cartRes] = await Promise.all([
        fetchCatalogData(),
        fetchCartData(),
      ]);

      if (!isMounted) return;
      setProducts(catalogRes.products);
      setCategories(catalogRes.categories);
      setSortOptions(catalogRes.sortOptions);
      setPriceFilterOptions(catalogRes.priceFilterOptions);
      setHeroBanner(catalogRes.heroBanner);
      setSiteConfig(catalogRes.siteConfig);

      setCartItems(cartRes.items);
      setUpsellOffer(cartRes.upsellOffer);
      setCartConfig(cartRes.cartConfig);
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tính tổng số lượng sản phẩm trong giỏ
  const totalCartQty = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

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
      list = list.filter((p) => p.price < 45000);
    } else if (priceRange === "45-60") {
      list = list.filter((p) => p.price >= 45000 && p.price <= 60000);
    } else if (priceRange === "above-60") {
      list = list.filter((p) => p.price > 60000);
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      list.sort(
        (a, b) => (b.badge === "Mới" ? 1 : 0) - (a.badge === "Mới" ? 1 : 0)
      );
    }

    return list;
  }, [products, activeCategory, searchQuery, priceRange, sortBy]);

  // Các hàm xử lý sự kiện Giỏ hàng (Handlers)
  const handleAddToCart = (product: ProductItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.name === product.name);
      if (existing) {
        return prev.map((item) =>
          item.name === product.name ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${product.id}`,
          name: product.name,
          unitPrice: product.price,
          qty: 1,
          image: product.image,
          imageAlt: product.imageAlt,
          customizations: [
            {
              text: "Size M (Tiêu chuẩn) • 70% đường",
              dotColor: "bg-primary/60",
            },
          ],
        },
      ];
    });

    setCartBounceKey((prev) => prev + 1);
    setAddedToast({
      visible: true,
      productName: product.name,
      image: product.image,
    });
    setTimeout(() => {
      setAddedToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleRestoreDefaultCart = () => {
    setCartItems(MOCK_INITIAL_CART_ITEMS);
  };

  const handleAddUpsell = () => {
    const upsellItem = upsellOffer.item;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === upsellItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === upsellItem.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...upsellItem }];
    });
    setCartBounceKey((prev) => prev + 1);
  };

  // ==========================================================================
  // PHẦN 2: HIỂN THỊ GIAO DIỆN (UI RENDERING)
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface">
      <Header
        cartCount={totalCartQty}
        cartBounceKey={cartBounceKey}
        onOpenCart={() => setIsCartOpen(true)}
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
                    onAddToCart={handleAddToCart}
                  />
                </div>
              ))}
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={3}
              showingCount={filteredProducts.length}
              totalItems={siteConfig.totalCatalogCount}
              onPageChange={setCurrentPage}
            />
          </section>

          <RewardsBanner bannerData={siteConfig.rewardsBanner} />
        </div>
      </main>

      {/* Added to Cart Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-40 bg-on-surface text-surface-container-lowest p-3 pr-4 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all duration-300 ${
          addedToast.visible
            ? "translate-y-0 opacity-100"
            : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        {addedToast.image && (
          <img
            src={addedToast.image}
            alt={addedToast.productName}
            className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-primary/40"
          />
        )}
        <div className="flex flex-col">
          <span className="font-label-md text-[11px] text-secondary-fixed flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              check_circle
            </span>
            Đã thêm vào giỏ hàng
          </span>
          <span className="font-title-sm text-title-sm text-surface-container-lowest font-semibold">
            {addedToast.productName}
          </span>
        </div>
        <button
          onClick={() => {
            setAddedToast((prev) => ({ ...prev, visible: false }));
            setIsCartOpen(true);
          }}
          className="ml-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors cursor-pointer"
          type="button"
        >
          Xem giỏ
        </button>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        upsellOffer={upsellOffer}
        cartConfig={cartConfig}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onRestoreDefaultCart={handleRestoreDefaultCart}
        onAddUpsell={handleAddUpsell}
      />

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
