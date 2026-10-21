import type {
  CategoryOption,
  ProductDetail,
  ProductListItem,
  ProductListResponse,
  ProductSizeOption,
  SelectOption,
  ToppingOption,
} from "./types";

// ============================================================================
// MOCK DATA SẢN PHẨM THỰC ĐƠN:
// - Giữ nguyên toàn bộ hình ảnh sản phẩm (URL ảnh gốc từ trang trước)
// - Trường dữ liệu tuân thủ đúng API Contract v1.0 (`GET /products`):
//   + `id`: UUID hợp lệ
//   + `name`: Tên sản phẩm
//   + `imageUrl`: Link ảnh sản phẩm
//   + `basePriceVnd`: Giá gốc VND (bội số của 5.000đ theo AC-US-CAT-05-04)
//   + `isAvailable`: true (Còn hàng) / false (Hết hàng) theo US-CAT-04
// ============================================================================

export const MOCK_CATEGORIES: CategoryOption[] = [
  { id: "all", label: "Tất cả (8)" },
  { id: "traditional", label: "Cà phê truyền thống" },
  { id: "espresso", label: "Espresso & Cold Brew" },
  { id: "tea", label: "Trà & Macchiato" },
  { id: "bakery", label: "Bánh & Tráng miệng" },
];

export const MOCK_SORT_OPTIONS: SelectOption[] = [
  { value: "popular", label: "Mặc định (Tên A → Z)" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "newest", label: "Mới nhất" },
];

export const MOCK_PRICE_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "Tất cả mức giá" },
  { value: "under-45", label: "Dưới 45.000đ" },
  { value: "45-60", label: "45.000đ - 60.000đ" },
  { value: "above-60", label: "Trên 60.000đ" },
];

export const MOCK_CATALOG_PRODUCTS: ProductListItem[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    name: "Bạc Xỉu Kem Béo Phin",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9hVqzfVvhs1qWlZSE960-Xz9ba0R80g5p8UkpPESUDOggsFJi1spIxbVUVJxVn-MohgHToKg_nlW6X3_3aOFoqJWzIJak3o760eryk9uBfe0qiAkrsH_1s9yO03ee6UPe15tdKa7NyVEdyCrXAhUTU_MEViD5wFm-g8DPUyj69EGVB74t-wBBPyoPXr6I5beQ5PhuPV15Cssn6zmE38_f3xNUfbO6jzjjyIXOfdTHgVqkGLksS04w",
    basePriceVnd: 45000,
    isAvailable: true,
    category: "traditional",
    rating: "4.7",
    reviews: "890 đánh giá",
    description:
      "Hòa quyện giữa sữa tươi thơm lừng, kem whipping béo ngậy và chút cà phê phin mộc dịu dàng.",
    imageAlt:
      "Traditional Vietnamese Bac Xiu layered iced coffee with distinct condensed milk bottom, rich cream layer and aromatic coffee top layer in a tall fluted glass, cafe ambiance.",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    name: "Cà Phê Đen Đá Cầu Đất",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD2GIXbK_gjHDiFDwZkAZAs73C3wK4ab5Lmc5cE75nVHuWfcEhLuEvSSVghnIHrnBle5wifQ_WjdQEJ2_7ZjgUkayLlCY2-YHiHFWHNGzMfraKlZ3FawYmqKam8sGgMRhLqB5AHBd8l1hgTdDQ6c0xDricuCmnTpGO5Sulyvnc8iiwpAce1xHH3aHsDyH6K5_QFaqpjkosbyIuxKlYgLpFutCcXtoPsBMsNXNT3laP64_5AcdFkdaCx",
    basePriceVnd: 35000,
    isAvailable: true,
    category: "bakery",
    rating: "4.6",
    reviews: "420 đánh giá",
    description:
      "Chiết xuất cà phê rang mộc đậm đà hương vị nguyên bản Tây Nguyên, hậu vị ngọt sâu.",
    imageAlt:
      "Golden crisp French buttery croissant fresh from the oven on a ceramic plate beside hot espresso, flaky layers, artisan cafe bakery lighting.",
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    name: "Cà Phê Muối Cố Đô",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Gve-RqDkpafN_RG-yUg2T3pDm67IlsY-2_qFvXQNTJsjJybBXLPDXHqwzvAdcc131ntfX_I26GPfe_ZIHKyrhWyyaJF0Eb0w04JGD6SDglcqIuFC5DATgjq4B7jrCQ2BjgEU0s2LCtUAZXW8UeTK9_PEd-KVz1BxUiT2onF1Q8O4q8q0hOWonoXg6Q_Ln5YnBM7V3XhJoaaUiBajercbpMZt7GViJ5LJ3ytB6VhIW27QewsX1ISH",
    basePriceVnd: 50000,
    isAvailable: true,
    category: "traditional",
    rating: "5.0",
    reviews: "2.1k đánh giá",
    description:
      "Công thức kem mặn cốt dừa độc quyền xứ Huế cân bằng hoàn hảo vị đắng đậm đà của cà phê.",
    badge: "Best Seller",
    imageAlt:
      "Traditional Hue salted cream coffee in vintage ceramic mug, thick savory sweet cream layer on dark robusta coffee, sprinkle of cocoa powder, serene atmospheric daylight.",
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    name: "Cà phê Sữa Đá Sài Gòn",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzPqOrPhhCzHcloM2uKm1XEgi-tjFoOSz2izs77CruoHqfl2jxlSHB-Lmk32TgfE5vohxZTqlHsJt-WY7D2J3zYTuTTcDS8yuJnHVIh--fpbrKXiWnNxNrILhx1hS1NvTVL93KBhx-IVsBuo0WGNyq1A7XeT7yF0Cf8DTpPm3XpAvvqSjT2ncqLOb6_Z8UN1sySN2guHg2vQl2hc5WpbB2wkIkGp1qUdKoFBxgvGCYVfyluswN5Hsh",
    basePriceVnd: 40000,
    isAvailable: true,
    category: "traditional",
    rating: "4.9",
    reviews: "1.2k đánh giá",
    description:
      "Robusta Đắk Lắk ủ lạnh cùng sữa đặc ngọt thanh béo ngậy truyền thống, chuẩn vị sảng khoái.",
    badge: "Best Seller",
    imageAlt:
      "A cold glass of authentic Vietnamese iced milk coffee with condensation droplets, dark roasted Robusta layered with sweet condensed milk, ice cubes, shot on natural oak cafe table in soft morning light.",
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    name: "Cold Brew Cam Sả Thảo Mộc",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYo3FoAt1qaudXwGWCT1rQdBzxp1CH-ojbRnYV5GcvRn8FMzlwdJFccQvdKR13KdREqdNB7c9CcTQTOxkXShaokdAZVhEQ26QgOiUPilj13A5cQ2sFo9UohyRxyU0WYPXv2NxAX0vnx1ugm7FrELX_Jp5lszQiewBQs2vYjM2BAe9Cov-63v9ul876RK6fAUlIcH9gabFkXgAHKdM9JNlrMjMowqVQn7PRoBe2p5YYJAfWM7Scam8V",
    basePriceVnd: 60000,
    isAvailable: true,
    category: "espresso",
    rating: "4.9",
    reviews: "310 đánh giá",
    description:
      "Chiết xuất lạnh 16 giờ với hương sả đập dập thơm the và lát cam sành mọng nước thanh mát.",
    badge: "Mới",
    imageAlt:
      "Artisanal glass carafe of cold brew coffee infused with fresh orange slice and lemongrass stalk, crystalline clear ice, warm ambient light on polished stone cafe surface.",
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    name: "Cold Brew Vải Hoa Hồng",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqpxb9e0jPl7WxiFsALgagy43y8x4qKxO1NDEVmYeZYu4eBR1ZvrcLlc-dZIlPh1V8oHQC_aScquZOc3Johz76dFe7ZpeB_3sk7i2MphGxKYuxC6Bm4NK_SjTUQySxMdfVXQHwWrJ-viD81gyhoKD_252GxnEcE1vQOP8B1EtgTnBkCTJBqm5YX3LjFkovjIhnsFAfN5qDJc7lGg_bqrBYOgCUZSU1c_CpFfgC4R6Ofxec9Gd89rqZ",
    basePriceVnd: 65000,
    isAvailable: false,
    category: "espresso",
    rating: "4.9",
    reviews: "180 đánh giá",
    description:
      "Nốt hương trái vải thơm ngát cùng chiết xuất cánh hoa hồng Damask chưng cất tự nhiên.",
    imageAlt:
      "Cold brew coffee infused with lychee and dried rose petals in a modern stemless glass, delicate red botanical notes, soft cinematic cafe studio shot.",
  },
  {
    id: "11111111-1111-4111-8111-111111111107",
    name: "Espresso Macchiato Caramel",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKiusDa3WsTymaJ0fU4HocmlMRCP9kTWzhea3qEznYMsykkkYhWSqqdGhkZsmTzexA5-ocAFXAE4_kB_OfyWN-6-tdl79IswlyI-S7cWQFSC6c3LARIB6Y9uWOIabZM7rQ26e7TuXz8FsoZZGcz4Xp8v5DPpDOI9B3-Dgp8YL5_ftymilQmpG6JdU-FknuuaAhLRYwo_sfjzFk21Z4mz8p4qpHcoQYZnUNisQ-BZQ0B8Io798Y9o0V",
    basePriceVnd: 55000,
    isAvailable: true,
    category: "espresso",
    rating: "4.8",
    reviews: "640 đánh giá",
    description:
      "Shot đôi Arabica Cầu Đất cùng lớp bọt sữa mịn màng, phủ sốt caramel muối béo thơm.",
    imageAlt:
      "Espresso Macchiato in a minimal artisanal ceramic cup with delicate micro-foam, delicate caramel swirl drizzled on top, velvety texture against a clean beige aesthetic background.",
  },
  {
    id: "11111111-1111-4111-8111-111111111108",
    name: "Trà Đào Cam Sả Hoàng Gia",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFrlRYbbFdaws-kSmMBj4gvBHQKhN22IxIUBXnmVpzdDUhxVgUXQm0iKNZ9H9LQNDLTRLZtBhSrN_40OYDNIsNUY7J8XCZJEdVKE4e7C0KKIRvjXgdOT1r32rCvgch9-wpU6yIcfiSK4QwOg7zP7_vXrG8FWFte2mcFT1iNS-fYZWhMtETF3TLN6IItebcwkkuLlyLTcWYuNPDLeNQh2TbcxDvgCPBg2ggpdIC7Oxet9XLoaVQUq7Q",
    basePriceVnd: 50000,
    isAvailable: true,
    category: "tea",
    rating: "4.8",
    reviews: "750 đánh giá",
    description:
      "Trà ô long thượng hạng ủ lạnh kết hợp đào miếng giòn ngọt, tinh dầu sả tươi và cam vàng.",
    imageAlt:
      "Vibrant peach iced tea with orange slice and fresh lemongrass in a highball glass, golden hour backlight highlighting juicy peach chunks and glistening condensation.",
  },
];

/**
 * Response mẫu của `GET /products` theo đúng API Contract Mục 3.3 (`{ items: [...] }`)
 */
export const MOCK_PRODUCTS_RESPONSE: ProductListResponse = {
  items: MOCK_CATALOG_PRODUCTS,
};

/**
 * Dữ liệu Size S/M/L và Topping chuẩn API Contract Mục 4 (để sẵn cho teammate làm Task 4 `GET /products/:id`)
 */
export const MOCK_PRODUCT_SIZES: ProductSizeOption[] = [
  { size: "S", multiplierPercent: 100 },
  { size: "M", multiplierPercent: 120 },
  { size: "L", multiplierPercent: 140 },
];

export const MOCK_TOPPINGS: ToppingOption[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    name: "Đào miếng",
    priceVnd: 10000,
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    name: "Hạt sen",
    priceVnd: 10000,
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    name: "Kem cheese",
    priceVnd: 15000,
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222204",
    name: "Shot Espresso",
    priceVnd: 15000,
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222205",
    name: "Thạch cà phê",
    priceVnd: 10000,
    isAvailable: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222206",
    name: "Trân châu trắng",
    priceVnd: 10000,
    isAvailable: true,
  },
];

export const MOCK_PRODUCT_DETAILS: Record<string, ProductDetail> =
  Object.fromEntries(
    MOCK_CATALOG_PRODUCTS.map((product) => [
      product.id,
      {
        ...product,
        sizes: MOCK_PRODUCT_SIZES,
        toppings: MOCK_TOPPINGS.filter((t) => t.isAvailable),
      },
    ])
  );
