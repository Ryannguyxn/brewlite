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
// DANH SÁCH 8 SẢN PHẨM & 5 TOPPING ĐỒNG BỘ 100% VỚI DATABASE SQL (`brewlite_db`)
// Nguồn chuẩn: `backend/prisma/seed.ts` & API `GET /products`, `GET /products/:id`
// ============================================================================

export const MOCK_CATEGORIES: CategoryOption[] = [
  { id: "all", label: "Tất cả (8)" },
  { id: "traditional", label: "Cà phê truyền thống" },
  { id: "espresso", label: "Espresso & Latte" },
  { id: "tea", label: "Trà & Matcha" },
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
    id: "a1000000-0000-4000-8000-000000000001",
    name: "Cà phê đen",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWVIQjOqtVh8C9EqOs7xdWBS95lyArl3pWpWD6ksginfLTDne3OYFhwVnT317QMxuFegjEw5VlQC1Ep-tPavpkGVapFwKuNSPITGRzm61CuDrKNUqdejYez7lzM47REmolwL2EB4OjvxGNc8IC4iHN1ObQ4GECvwLww8kJLmG0Gu8TODigW2NVT6jcj6hirCjXqmhz6gPr4yUTMMJ38iVsoiZAiDh-8plFQaWhx4q13dJR1R0z7bUn",
    basePriceVnd: 30000,
    isAvailable: true,
    category: "traditional",
    rating: "4.8",
    reviews: "520 đánh giá",
    description:
      "Chiết xuất cà phê rang mộc đậm đà hương vị nguyên bản Tây Nguyên, hậu vị ngọt sâu.",
    imageAlt:
      "Artisanal Vietnamese dark roasted coffee with rich crema and roasted coffee beans on a warm oak cafe table.",
    originBadge: "Rang mộc Cầu Đất",
    recipeTag: "Nguyên Bản Tây Nguyên",
    servingNote: "Phục vụ lạnh / nóng",
    flavorNotes:
      "Đậm vị cà phê rang mộc nguyên chất, hương khói nhẹ đặc trưng cùng hậu vị ngọt thanh kéo dài nơi cuống họng.",
    intensity: "5/5 • Rất đậm",
    beanType: "Robusta",
    processMethod: "Full Washed",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
  },
  {
    id: "a1000000-0000-4000-8000-000000000002",
    name: "Cà phê sữa",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzPqOrPhhCzHcloM2uKm1XEgi-tjFoOSz2izs77CruoHqfl2jxlSHB-Lmk32TgfE5vohxZTqlHsJt-WY7D2J3zYTuTTcDS8yuJnHVIh--fpbrKXiWnNxNrILhx1hS1NvTVL93KBhx-IVsBuo0WGNyq1A7XeT7yF0Cf8DTpPm3XpAvvqSjT2ncqLOb6_Z8UN1sySN2guHg2vQl2hc5WpbB2wkIkGp1qUdKoFBxgvGCYVfyluswN5Hsh",
    basePriceVnd: 35000,
    isAvailable: true,
    category: "traditional",
    rating: "4.9",
    reviews: "1.2k đánh giá",
    description:
      "Robusta Đắk Lắk ủ đậm cùng sữa đặc ngọt thanh béo ngậy truyền thống, chuẩn vị sảng khoái.",
    badge: "Best Seller",
    imageAlt:
      "A cold glass of authentic Vietnamese iced milk coffee with condensation droplets, dark roasted Robusta layered with sweet condensed milk.",
    originBadge: "Rang mộc Đắk Lắk",
    recipeTag: "Công thức Độc Quyền",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Hương vị sô-cô-la đen, đắng dịu êm ái, hậu ngọt mật ong đậm đà hòa quyện cùng sữa đặc béo ngậy chuẩn gu Sài Thành.",
    intensity: "4/5 • Đậm",
    beanType: "Robusta",
    processMethod: "Honey",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
  },
  {
    id: "a1000000-0000-4000-8000-000000000003",
    name: "Bạc xỉu",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9hVqzfVvhs1qWlZSE960-Xz9ba0R80g5p8UkpPESUDOggsFJi1spIxbVUVJxVn-MohgHToKg_nlW6X3_3aOFoqJWzIJak3o760eryk9uBfe0qiAkrsH_1s9yO03ee6UPe15tdKa7NyVEdyCrXAhUTU_MEViD5wFm-g8DPUyj69EGVB74t-wBBPyoPXr6I5beQ5PhuPV15Cssn6zmE38_f3xNUfbO6jzjjyIXOfdTHgVqkGLksS04w",
    basePriceVnd: 40000,
    isAvailable: true,
    category: "traditional",
    rating: "4.8",
    reviews: "890 đánh giá",
    description:
      "Hòa quyện giữa sữa tươi thơm lừng, sữa đặc béo ngậy và lớp bọt cà phê phin mộc dịu dàng.",
    badge: "Best Seller",
    imageAlt:
      "Traditional Vietnamese Bac Xiu layered iced coffee in a tall fluted glass.",
    originBadge: "Phin Truyền Thống",
    recipeTag: "Công thức Độc Quyền",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Ba tầng hương vị rõ nét: sữa đặc ngọt dịu, sữa tươi béo mịn và lớp bọt cà phê phin thơm nồng nàn chuẩn vị Sài Gòn.",
    intensity: "2/5 • Dịu nhẹ",
    beanType: "Robusta & Arabica",
    processMethod: "Natural",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
  },
  {
    id: "a1000000-0000-4000-8000-000000000004",
    name: "Cappuccino",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKiusDa3WsTymaJ0fU4HocmlMRCP9kTWzhea3qEznYMsykkkYhWSqqdGhkZsmTzexA5-ocAFXAE4_kB_OfyWN-6-tdl79IswlyI-S7cWQFSC6c3LARIB6Y9uWOIabZM7rQ26e7TuXz8FsoZZGcz4Xp8v5DPpDOI9B3-Dgp8YL5_ftymilQmpG6JdU-FknuuaAhLRYwo_sfjzFk21Z4mz8p4qpHcoQYZnUNisQ-BZQ0B8Io798Y9o0V",
    basePriceVnd: 45000,
    isAvailable: true,
    category: "espresso",
    rating: "4.8",
    reviews: "640 đánh giá",
    description:
      "Shot Espresso Arabica Cầu Đất cân bằng cùng sữa tươi đánh nóng và lớp bọt sữa dày mịn màng.",
    imageAlt:
      "Artisanal Cappuccino in a ceramic cup with delicate micro-foam.",
    originBadge: "Arabica Cầu Đất",
    recipeTag: "Pha Máy Thủ Công",
    servingNote: "Phục vụ nóng / lạnh",
    flavorNotes:
      "Hương thơm hạt rang vừa quyện cùng vị ngọt tự nhiên của sữa tươi thanh trùng và lớp bọt micro-foam bồng bềnh.",
    intensity: "3/5 • Cân bằng",
    beanType: "100% Arabica",
    processMethod: "Washed",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
  },
  {
    id: "a1000000-0000-4000-8000-000000000005",
    name: "Latte",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Gve-RqDkpafN_RG-yUg2T3pDm67IlsY-2_qFvXQNTJsjJybBXLPDXHqwzvAdcc131ntfX_I26GPfe_ZIHKyrhWyyaJF0Eb0w04JGD6SDglcqIuFC5DATgjq4B7jrCQ2BjgEU0s2LCtUAZXW8UeTK9_PEd-KVz1BxUiT2onF1Q8O4q8q0hOWonoXg6Q_Ln5YnBM7V3XhJoaaUiBajercbpMZt7GViJ5LJ3ytB6VhIW27QewsX1ISH",
    basePriceVnd: 45000,
    isAvailable: true,
    category: "espresso",
    rating: "4.9",
    reviews: "710 đánh giá",
    description:
      "Sự kết hợp êm mượt giữa nền Espresso thơm dịu và lượng sữa tươi dồi dào, nhẹ nhàng dễ uống.",
    imageAlt: "Smooth cafe latte in ceramic mug with latte art.",
    originBadge: "Arabica Đà Lạt",
    recipeTag: "Pha Máy Thủ Công",
    servingNote: "Phục vụ nóng / lạnh",
    flavorNotes:
      "Vị béo thanh của sữa tươi hòa quyện cùng nốt hương hạt dẻ và caramel dịu nhẹ từ hạt Arabica Đà Lạt.",
    intensity: "2/5 • Êm dịu",
    beanType: "100% Arabica",
    processMethod: "Honey",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
  },
  {
    id: "a1000000-0000-4000-8000-000000000006",
    name: "Trà đào cam sả",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFrlRYbbFdaws-kSmMBj4gvBHQKhN22IxIUBXnmVpzdDUhxVgUXQm0iKNZ9H9LQNDLTRLZtBhSrN_40OYDNIsNUY7J8XCZJEdVKE4e7C0KKIRvjXgdOT1r32rCvgch9-wpU6yIcfiSK4QwOg7zP7_vXrG8FWFte2mcFT1iNS-fYZWhMtETF3TLN6IItebcwkkuLlyLTcWYuNPDLeNQh2TbcxDvgCPBg2ggpdIC7Oxet9XLoaVQUq7Q",
    basePriceVnd: 42000,
    isAvailable: true,
    category: "tea",
    rating: "4.9",
    reviews: "950 đánh giá",
    description:
      "Trà ô long thượng hạng ủ lạnh kết hợp đào miếng giòn ngọt, tinh dầu sả tươi và cam vàng.",
    badge: "Mới",
    imageAlt:
      "Vibrant peach iced tea with orange slice and fresh lemongrass in a highball glass.",
    originBadge: "Ô Long Bảo Lộc",
    recipeTag: "Trà Trái Cây Tươi",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Nền trà Ô Long Bảo Lộc chát nhẹ hậu ngọt, quyện cùng đào ngâm giòn, cam vàng mọng nước và hương sả tươi mát.",
    intensity: "2/5 • Thanh dịu",
    beanType: "Trà Ô Long",
    processMethod: "Cold Steep",
    sustainabilityNote: "Nguyên liệu tuyển chọn từ nông trại Bảo Lộc",
  },
  {
    id: "a1000000-0000-4000-8000-000000000007",
    name: "Matcha Latte",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYo3FoAt1qaudXwGWCT1rQdBzxp1CH-ojbRnYV5GcvRn8FMzlwdJFccQvdKR13KdREqdNB7c9CcTQTOxkXShaokdAZVhEQ26QgOiUPilj13A5cQ2sFo9UohyRxyU0WYPXv2NxAX0vnx1ugm7FrELX_Jp5lszQiewBQs2vYjM2BAe9Cov-63v9ul876RK6fAUlIcH9gabFkXgAHKdM9JNlrMjMowqVQn7PRoBe2p5YYJAfWM7Scam8V",
    basePriceVnd: 50000,
    isAvailable: true,
    category: "tea",
    rating: "4.9",
    reviews: "680 đánh giá",
    description:
      "Bột trà xanh Matcha Uji Nhật Bản đánh bông thủ công cùng sữa tươi thanh trùng béo dịu.",
    badge: "Mới",
    imageAlt: "Layered iced matcha latte with rich green tea and milk.",
    originBadge: "Matcha Uji Nhật Bản",
    recipeTag: "Công thức Độc Quyền",
    servingNote: "Phục vụ lạnh / nóng",
    flavorNotes:
      "Vị umami thanh tao đặc trưng của trà xanh Uji thu hoạch vụ đầu, hậu ngọt dịu hòa quyện cùng sữa tươi mịn màng.",
    intensity: "3/5 • Đậm vị trà",
    beanType: "Matcha Uji",
    processMethod: "Nghiền cối đá",
    sustainabilityNote: "Trà xanh canh tác hữu cơ chuẩn Nhật Bản",
  },
  {
    id: "a1000000-0000-4000-8000-000000000008",
    name: "Trà sữa truyền thống",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqpxb9e0jPl7WxiFsALgagy43y8x4qKxO1NDEVmYeZYu4eBR1ZvrcLlc-dZIlPh1V8oHQC_aScquZOc3Johz76dFe7ZpeB_3sk7i2MphGxKYuxC6Bm4NK_SjTUQySxMdfVXQHwWrJ-viD81gyhoKD_252GxnEcE1vQOP8B1EtgTnBkCTJBqm5YX3LjFkovjIhnsFAfN5qDJc7lGg_bqrBYOgCUZSU1c_CpFfgC4R6Ofxec9Gd89rqZ",
    basePriceVnd: 40000,
    isAvailable: false,
    category: "tea",
    rating: "4.7",
    reviews: "540 đánh giá",
    description:
      "Hồng trà nguyên lá ủ đậm vị kết hợp cùng sữa béo thơm lừng, gợi nhớ hương vị truyền thống.",
    imageAlt: "Traditional iced milk tea in glass.",
    originBadge: "Hồng Trà Bảo Lộc",
    recipeTag: "Trà SữaỦ Lạnh",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Hương hồng trà rang thơm nồng nàn, vị chát dịu quyện cùng độ béo ngậy vừa phải, không ngấy.",
    intensity: "3/5 • Đậm đà",
    beanType: "Hồng Trà",
    processMethod: "Ủ nhiệt chuẩn",
    sustainabilityNote: "Lá trà thu hái thủ công từ nông trại Bảo Lộc",
  },
];

/**
 * Response mẫu của `GET /products` theo đúng API Contract Mục 3.3 (`{ items: [...] }`)
 */
export const MOCK_PRODUCTS_RESPONSE: ProductListResponse = {
  items: MOCK_CATALOG_PRODUCTS,
};

/**
 * Dữ liệu Size S/M/L và Topping chuẩn API Contract Mục 4 (`GET /products/:id`)
 */
export const MOCK_PRODUCT_SIZES: ProductSizeOption[] = [
  { size: "S", multiplierPercent: 100 },
  { size: "M", multiplierPercent: 120 },
  { size: "L", multiplierPercent: 140 },
];

export const MOCK_TOPPINGS: ToppingOption[] = [
  {
    id: "b2000000-0000-4000-8000-000000000001",
    name: "Trân châu",
    priceVnd: 5000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000002",
    name: "Kem cheese",
    priceVnd: 10000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000003",
    name: "Thêm shot espresso",
    priceVnd: 12000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000004",
    name: "Sương sáo",
    priceVnd: 5000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000005",
    name: "Kem tươi",
    priceVnd: 8000,
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
        toppings: MOCK_TOPPINGS.filter((t) => t.isAvailable !== false),
      },
    ])
  );
