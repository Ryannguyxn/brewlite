"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilterBar, { type CategoryId } from "@/components/CategoryFilterBar";
import ProductCard, { type ProductItem } from "@/components/ProductCard";
import PaginationBar from "@/components/PaginationBar";
import RewardsBanner from "@/components/RewardsBanner";
import CartDrawer, {
  INITIAL_CART_ITEMS,
  type CartItem,
} from "@/components/CartDrawer";

const CATALOG_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "Cà phê Sữa Đá Sài Gòn",
    category: "traditional",
    rating: "4.9",
    reviews: "1.2k đánh giá",
    description:
      "Robusta Đắk Lắk ủ lạnh cùng sữa đặc ngọt thanh béo ngậy truyền thống, chuẩn vị sảng khoái.",
    price: 39000,
    badge: "Best Seller",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzPqOrPhhCzHcloM2uKm1XEgi-tjFoOSz2izs77CruoHqfl2jxlSHB-Lmk32TgfE5vohxZTqlHsJt-WY7D2J3zYTuTTcDS8yuJnHVIh--fpbrKXiWnNxNrILhx1hS1NvTVL93KBhx-IVsBuo0WGNyq1A7XeT7yF0Cf8DTpPm3XpAvvqSjT2ncqLOb6_Z8UN1sySN2guHg2vQl2hc5WpbB2wkIkGp1qUdKoFBxgvGCYVfyluswN5Hsh",
    imageAlt:
      "A cold glass of authentic Vietnamese iced milk coffee with condensation droplets, dark roasted Robusta layered with sweet condensed milk, ice cubes, shot on natural oak cafe table in soft morning light.",
  },
  {
    id: "prod-2",
    name: "Espresso Macchiato Caramel",
    category: "espresso",
    rating: "4.8",
    reviews: "640 đánh giá",
    description:
      "Shot đôi Arabica Cầu Đất cùng lớp bọt sữa mịn màng, phủ sốt caramel muối béo thơm.",
    price: 55000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKiusDa3WsTymaJ0fU4HocmlMRCP9kTWzhea3qEznYMsykkkYhWSqqdGhkZsmTzexA5-ocAFXAE4_kB_OfyWN-6-tdl79IswlyI-S7cWQFSC6c3LARIB6Y9uWOIabZM7rQ26e7TuXz8FsoZZGcz4Xp8v5DPpDOI9B3-Dgp8YL5_ftymilQmpG6JdU-FknuuaAhLRYwo_sfjzFk21Z4mz8p4qpHcoQYZnUNisQ-BZQ0B8Io798Y9o0V",
    imageAlt:
      "Espresso Macchiato in a minimal artisanal ceramic cup with delicate micro-foam, delicate caramel swirl drizzled on top, velvety texture against a clean beige aesthetic background.",
  },
  {
    id: "prod-3",
    name: "Cold Brew Cam Sả Thảo Mộc",
    category: "espresso",
    rating: "4.9",
    reviews: "310 đánh giá",
    description:
      "Chiết xuất lạnh 16 giờ với hương sả đập dập thơm the và lát cam sành mọng nước thanh mát.",
    price: 62000,
    badge: "Mới",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYo3FoAt1qaudXwGWCT1rQdBzxp1CH-ojbRnYV5GcvRn8FMzlwdJFccQvdKR13KdREqdNB7c9CcTQTOxkXShaokdAZVhEQ26QgOiUPilj13A5cQ2sFo9UohyRxyU0WYPXv2NxAX0vnx1ugm7FrELX_Jp5lszQiewBQs2vYjM2BAe9Cov-63v9ul876RK6fAUlIcH9gabFkXgAHKdM9JNlrMjMowqVQn7PRoBe2p5YYJAfWM7Scam8V",
    imageAlt:
      "Artisanal glass carafe of cold brew coffee infused with fresh orange slice and lemongrass stalk, crystalline clear ice, warm ambient light on polished stone cafe surface.",
  },
  {
    id: "prod-4",
    name: "Bạc Xỉu Kem Béo Phin",
    category: "traditional",
    rating: "4.7",
    reviews: "890 đánh giá",
    description:
      "Hòa quyện giữa sữa tươi thơm lừng, kem whipping béo ngậy và chút cà phê phin mộc dịu dàng.",
    price: 45000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9hVqzfVvhs1qWlZSE960-Xz9ba0R80g5p8UkpPESUDOggsFJi1spIxbVUVJxVn-MohgHToKg_nlW6X3_3aOFoqJWzIJak3o760eryk9uBfe0qiAkrsH_1s9yO03ee6UPe15tdKa7NyVEdyCrXAhUTU_MEViD5wFm-g8DPUyj69EGVB74t-wBBPyoPXr6I5beQ5PhuPV15Cssn6zmE38_f3xNUfbO6jzjjyIXOfdTHgVqkGLksS04w",
    imageAlt:
      "Traditional Vietnamese Bac Xiu layered iced coffee with distinct condensed milk bottom, rich cream layer and aromatic coffee top layer in a tall fluted glass, cafe ambiance.",
  },
  {
    id: "prod-5",
    name: "Cà Phê Muối Cố Đô",
    category: "traditional",
    rating: "5.0",
    reviews: "2.1k đánh giá",
    description:
      "Công thức kem mặn cốt dừa độc quyền xứ Huế cân bằng hoàn hảo vị đắng đậm đà của cà phê.",
    price: 49000,
    badge: "Best Seller",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Gve-RqDkpafN_RG-yUg2T3pDm67IlsY-2_qFvXQNTJsjJybBXLPDXHqwzvAdcc131ntfX_I26GPfe_ZIHKyrhWyyaJF0Eb0w04JGD6SDglcqIuFC5DATgjq4B7jrCQ2BjgEU0s2LCtUAZXW8UeTK9_PEd-KVz1BxUiT2onF1Q8O4q8q0hOWonoXg6Q_Ln5YnBM7V3XhJoaaUiBajercbpMZt7GViJ5LJ3ytB6VhIW27QewsX1ISH",
    imageAlt:
      "Traditional Hue salted cream coffee in vintage ceramic mug, thick savory sweet cream layer on dark robusta coffee, sprinkle of cocoa powder, serene atmospheric daylight.",
  },
  {
    id: "prod-6",
    name: "Trà Đào Cam Sả Hoàng Gia",
    category: "tea",
    rating: "4.8",
    reviews: "750 đánh giá",
    description:
      "Trà ô long thượng hạng ủ lạnh kết hợp đào miếng giòn ngọt, tinh dầu sả tươi và cam vàng.",
    price: 52000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFrlRYbbFdaws-kSmMBj4gvBHQKhN22IxIUBXnmVpzdDUhxVgUXQm0iKNZ9H9LQNDLTRLZtBhSrN_40OYDNIsNUY7J8XCZJEdVKE4e7C0KKIRvjXgdOT1r32rCvgch9-wpU6yIcfiSK4QwOg7zP7_vXrG8FWFte2mcFT1iNS-fYZWhMtETF3TLN6IItebcwkkuLlyLTcWYuNPDLeNQh2TbcxDvgCPBg2ggpdIC7Oxet9XLoaVQUq7Q",
    imageAlt:
      "Vibrant peach iced tea with orange slice and fresh lemongrass in a highball glass, golden hour backlight highlighting juicy peach chunks and glistening condensation.",
  },
  {
    id: "prod-7",
    name: "Cold Brew Vải Hoa Hồng",
    category: "espresso",
    rating: "4.9",
    reviews: "180 đánh giá",
    description:
      "Nốt hương trái vải thơm ngát cùng chiết xuất cánh hoa hồng Damask chưng cất tự nhiên.",
    price: 65000,
    outOfStock: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqpxb9e0jPl7WxiFsALgagy43y8x4qKxO1NDEVmYeZYu4eBR1ZvrcLlc-dZIlPh1V8oHQC_aScquZOc3Johz76dFe7ZpeB_3sk7i2MphGxKYuxC6Bm4NK_SjTUQySxMdfVXQHwWrJ-viD81gyhoKD_252GxnEcE1vQOP8B1EtgTnBkCTJBqm5YX3LjFkovjIhnsFAfN5qDJc7lGg_bqrBYOgCUZSU1c_CpFfgC4R6Ofxec9Gd89rqZ",
    imageAlt:
      "Cold brew coffee infused with lychee and dried rose petals in a modern stemless glass, delicate red botanical notes, soft cinematic cafe studio shot.",
  },
  {
    id: "prod-8",
    name: "Croissant Bơ Pháp Nướng",
    category: "bakery",
    rating: "4.6",
    reviews: "420 đánh giá",
    description:
      "Vỏ ngàn lớp giòn rụm nướng nóng hổi mỗi sáng, dùng bơ Isigny Pháp thơm ngậy cao cấp.",
    price: 38000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD2GIXbK_gjHDiFDwZkAZAs73C3wK4ab5Lmc5cE75nVHuWfcEhLuEvSSVghnIHrnBle5wifQ_WjdQEJ2_7ZjgUkayLlCY2-YHiHFWHNGzMfraKlZ3FawYmqKam8sGgMRhLqB5AHBd8l1hgTdDQ6c0xDricuCmnTpGO5Sulyvnc8iiwpAce1xHH3aHsDyH6K5_QFaqpjkosbyIuxKlYgLpFutCcXtoPsBMsNXNT3laP64_5AcdFkdaCx",
    imageAlt:
      "Golden crisp French buttery croissant fresh from the oven on a ceramic plate beside hot espresso, flaky layers, artisan cafe bakery lighting.",
  },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [sortBy, setSortBy] = useState("popular");
  const [priceRange, setPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART_ITEMS);
  const [cartBounceKey, setCartBounceKey] = useState(0);
  const [addedToast, setAddedToast] = useState<{
    visible: boolean;
    productName: string;
    image: string;
  }>({ visible: false, productName: "", image: "" });

  const totalCartQty = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const filteredProducts = useMemo(() => {
    let list = [...CATALOG_PRODUCTS];

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
  }, [activeCategory, searchQuery, priceRange, sortBy]);

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
    setCartItems(INITIAL_CART_ITEMS);
  };

  const handleAddUpsell = () => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === "cartItemUpsell");
      if (existing) {
        return prev.map((i) =>
          i.id === "cartItemUpsell" ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: "cartItemUpsell",
          name: "Bánh Quy Bơ Hạnh Nhân",
          unitPrice: 18000,
          qty: 1,
          image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCEGhGqvQFCMTt4S_1bFUl-uGRXw8MVCXbawPjxWNnD81K9caHnZK4_WuPC1gdWPGOZgHErFgihRB-bV0bEKz6wNt8SyuZgdf3ILKQUM2nYaTioYTYHutAJGAXRpCpMnANkaDzWchuO3srZEHf_T-SIrPK39x0p9gcaw5y4hjC4JQTHHA23PtmWSx9OhIcAydVDjCJ3J4kwm-KlMQl166cAsZZLCNZYSYDoONFyhETPvOmmyViV0K0W",
          imageAlt: "Bánh Quy Bơ Hạnh Nhân giòn thơm",
          customizations: [
            {
              text: "Ưu đãi mua kèm Cold Brew",
              dotColor: "bg-tertiary",
            },
          ],
        },
      ];
    });
    setCartBounceKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface">
      <Header
        cartCount={totalCartQty}
        cartBounceKey={cartBounceKey}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeNav="thuc-don"
      />

      <main className="w-full pt-20 bg-background min-h-screen flex-1">
        <div className="flex flex-col w-full">
          <HeroBanner />

          <CategoryFilterBar
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
                  {filteredProducts.length} trên tổng số 24 công thức đặc trưng
                </span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                Giao nhanh trong 20 phút tại nội thành
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
              totalItems={24}
              onPageChange={setCurrentPage}
            />
          </section>

          <RewardsBanner />
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
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onRestoreDefaultCart={handleRestoreDefaultCart}
        onAddUpsell={handleAddUpsell}
      />

      <Footer />
    </div>
  );
}
