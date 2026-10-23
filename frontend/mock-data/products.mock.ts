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
// MOCK DATA SẢN PHẨM THỰC ĐƠN & CHI TIẾT ĐỒ UỐNG (DÙNG CHUNG CHO GALLERY & DETAIL):
// - Giữ nguyên toàn bộ hình ảnh sản phẩm (URL ảnh gốc đúng loại sản phẩm)
// - Trường dữ liệu tuân thủ đúng API Contract v1.0 & v2.0 (`GET /products` & `GET /products/:id`):
//   + `id`: UUID hợp lệ
//   + `name`: Tên sản phẩm
//   + `imageUrl`: Link ảnh sản phẩm
//   + `basePriceVnd`: Giá gốc VND (bội số của 5.000đ theo AC-US-CAT-05-04)
//   + `isAvailable`: true (Còn hàng) / false (Hết hàng) theo US-CAT-04
//   + `sizes`: S (100%), M (120%), L (140%)
//   + `toppings`: Danh sách topping dùng chung có giá cố định (VND)
// ============================================================================

export const MOCK_CATEGORIES: CategoryOption[] = [
  { id: "all", label: "Tất cả (9)" },
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
    originBadge: "Phin Truyền Thống",
    recipeTag: "Công thức Độc Quyền",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Ba tầng hương vị rõ nét: sữa đặc ngọt dịu, kem béo mịn màng và lớp bọt cà phê phin thơm nồng nàn chuẩn vị Sài Gòn.",
    intensity: "2/5 • Dịu nhẹ",
    beanType: "Robusta & Arabica",
    processMethod: "Natural",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    name: "Cà Phê Đen Đá Cầu Đất",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWVIQjOqtVh8C9EqOs7xdWBS95lyArl3pWpWD6ksginfLTDne3OYFhwVnT317QMxuFegjEw5VlQC1Ep-tPavpkGVapFwKuNSPITGRzm61CuDrKNUqdejYez7lzM47REmolwL2EB4OjvxGNc8IC4iHN1ObQ4GECvwLww8kJLmG0Gu8TODigW2NVT6jcj6hirCjXqmhz6gPr4yUTMMJ38iVsoiZAiDh-8plFQaWhx4q13dJR1R0z7bUn",
    basePriceVnd: 35000,
    isAvailable: true,
    category: "traditional",
    rating: "4.6",
    reviews: "420 đánh giá",
    description:
      "Chiết xuất cà phê rang mộc đậm đà hương vị nguyên bản Tây Nguyên, hậu vị ngọt sâu.",
    imageAlt:
      "Artisanal Vietnamese dark roasted coffee from Cau Dat with rich crema and roasted coffee beans on a warm oak cafe table.",
    originBadge: "Rang mộc Cầu Đất",
    recipeTag: "Nguyên Bản Tây Nguyên",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Đậm vị cà phê rang mộc nguyên chất, hương khói nhẹ đặc trưng cùng hậu vị ngọt thanh kéo dài nơi cuống họng.",
    intensity: "5/5 • Rất đậm",
    beanType: "Robusta",
    processMethod: "Full Washed",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
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
    originBadge: "Đặc sản Cố Đô",
    recipeTag: "Công thức Độc Quyền",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Lớp kem muối biển mặn dịu béo ngậy hòa quyện hoàn hảo cùng nền cà phê phin Buôn Ma Thuột đắng êm hậu ngọt.",
    intensity: "4/5 • Đậm",
    beanType: "Robusta",
    processMethod: "Honey",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
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
    originBadge: "Ủ lạnh 16 giờ",
    recipeTag: "Cold Brew Đặc Sản",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Vị thanh mát của cam vàng tươi hòa quyện tinh dầu sả thảo mộc và nền Cold Brew Arabica Cầu Đất êm mượt ít axit.",
    intensity: "3/5 • Thanh mát",
    beanType: "Arabica",
    processMethod: "Cold Steep",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
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
    originBadge: "Ủ lạnh 18 giờ",
    recipeTag: "Signature Floral",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Sự kết hợp tinh tế giữa vị ngọt thanh của vải thiều chín mọng, hương hoa hồng Damask dịu nhẹ và Cold Brew Arabica.",
    intensity: "3/5 • Dịu êm",
    beanType: "Arabica",
    processMethod: "Cold Steep",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
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
    originBadge: "Arabica Cầu Đất",
    recipeTag: "Pha Máy Thủ Công",
    servingNote: "Phục vụ nóng / lạnh",
    flavorNotes:
      "Hương caramel cháy dịu, chua thanh nhẹ của Arabica Cầu Đất kết hợp lớp bọt sữa micro-foam mịn như nhung.",
    intensity: "3/5 • Cân bằng",
    beanType: "Arabica",
    processMethod: "Washed",
    sustainabilityNote: "Hạt canh tác bền vững theo tiêu chuẩn UTZ",
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
    originBadge: "Ô Long Bảo Lộc",
    recipeTag: "Trà Trái Cây Tươi",
    servingNote: "Phục vụ lạnh",
    flavorNotes:
      "Nền trà Ô Long Bảo Lộc chát nhẹ hậu ngọt, quyện cùng đào ngâm giòn, cam vàng mọng nước và hương sả tươi mát.",
    intensity: "2/5 • Thanh dịu",
    beanType: "Ô Long",
    processMethod: "Cold Brew Tea",
    sustainabilityNote: "Nguyên liệu tuyển chọn từ nông trại Bảo Lộc",
  },
  {
    id: "11111111-1111-4111-8111-111111111109",
    name: "Croissant Bơ Pháp Nướng",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD2GIXbK_gjHDiFDwZkAZAs73C3wK4ab5Lmc5cE75nVHuWfcEhLuEvSSVghnIHrnBle5wifQ_WjdQEJ2_7ZjgUkayLlCY2-YHiHFWHNGzMfraKlZ3FawYmqKam8sGgMRhLqB5AHBd8l1hgTdDQ6c0xDricuCmnTpGO5Sulyvnc8iiwpAce1xHH3aHsDyH6K5_QFaqpjkosbyIuxKlYgLpFutCcXtoPsBMsNXNT3laP64_5AcdFkdaCx",
    basePriceVnd: 40000,
    isAvailable: true,
    category: "bakery",
    rating: "4.6",
    reviews: "420 đánh giá",
    description:
      "Vỏ ngàn lớp giòn rụm nướng nóng hổi mỗi sáng, dùng bơ Isigny Pháp thơm ngậy cao cấp.",
    imageAlt:
      "Golden crisp French buttery croissant fresh from the oven on a ceramic plate beside hot espresso, flaky layers, artisan cafe bakery lighting.",
    originBadge: "Bơ Isigny Pháp",
    recipeTag: "Bánh Nướng Trong Ngày",
    servingNote: "Phục vụ nóng giòn",
    flavorNotes:
      "Lớp vỏ ngàn lớp vàng ươm giòn tan, bên trong mềm ẩm dậy mùi bơ Isigny AOP Pháp thượng hạng.",
    intensity: "4/5 • Béo thơm",
    beanType: "Bơ Isigny",
    processMethod: "Ủ bột 24h",
    sustainabilityNote: "Nướng tươi mới mỗi sáng tại quầy BrewLite",
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
        toppings: MOCK_TOPPINGS.filter((t) => t.isAvailable !== false),
      },
    ])
  );
