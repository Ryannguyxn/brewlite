import type {
  CategoryOption,
  ProductListItem,
  ProductListResponse,
  SelectOption,
} from "./types";

// ============================================================================
// MOCK DATA: DANH MỤC, BỘ LỌC SẮP XẾP / KHOẢNG GIÁ & DANH SÁCH SẢN PHẨM MENU
// - Tất cả sản phẩm đều thuộc đúng danh mục đồ uống (traditional, espresso, tea)
// - Ảnh sản phẩm khớp chính xác với tên và loại đồ uống
// - Các trường id (UUID), name, imageUrl, basePriceVnd (bội số 5.000đ), isAvailable
//   tuân thủ đúng BrewLite_API_Contract_v1.0.md
// ============================================================================

export const MOCK_CATEGORIES: CategoryOption[] = [
  { id: "all", label: "Tất cả (8)" },
  { id: "traditional", label: "Cà phê truyền thống" },
  { id: "espresso", label: "Espresso & Cold Brew" },
  { id: "tea", label: "Trà & Macchiato" },
];

export const MOCK_SORT_OPTIONS: SelectOption[] = [
  { value: "popular", label: "Phổ biến nhất" },
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
    category: "traditional",
    rating: "4.7",
    reviews: "890 đánh giá",
    description:
      "Hòa quyện giữa sữa tươi thơm lừng, kem whipping béo ngậy và chút cà phê phin mộc dịu dàng.",
    basePriceVnd: 45000,
    isAvailable: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9hVqzfVvhs1qWlZSE960-Xz9ba0R80g5p8UkpPESUDOggsFJi1spIxbVUVJxVn-MohgHToKg_nlW6X3_3aOFoqJWzIJak3o760eryk9uBfe0qiAkrsH_1s9yO03ee6UPe15tdKa7NyVEdyCrXAhUTU_MEViD5wFm-g8DPUyj69EGVB74t-wBBPyoPXr6I5beQ5PhuPV15Cssn6zmE38_f3xNUfbO6jzjjyIXOfdTHgVqkGLksS04w",
    imageAlt:
      "Ly Bạc Xỉu truyền thống phân tầng đẹp mắt với sữa đặc, kem béo và cà phê phin nguyên chất.",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    name: "Cà Phê Đen Đá Cầu Đất",
    category: "traditional",
    rating: "4.8",
    reviews: "540 đánh giá",
    description:
      "Chiết xuất cà phê rang mộc đậm đà từ hạt Robusta Đắk Lắk và Arabica Cầu Đất, hậu vị ngọt sâu sảng khoái.",
    basePriceVnd: 35000,
    isAvailable: true,
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    imageAlt:
      "Ly cà phê đen đá nguyên bản đậm đặc với lớp bọt cà phê nâu óng ánh trên nền bàn gỗ quán cà phê.",
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    name: "Cà Phê Muối Cố Đô",
    category: "traditional",
    rating: "5.0",
    reviews: "2.1k đánh giá",
    description:
      "Công thức kem mặn cốt dừa độc quyền xứ Huế cân bằng hoàn hảo vị đắng đậm đà của cà phê.",
    basePriceVnd: 50000,
    isAvailable: true,
    badge: "Best Seller",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Gve-RqDkpafN_RG-yUg2T3pDm67IlsY-2_qFvXQNTJsjJybBXLPDXHqwzvAdcc131ntfX_I26GPfe_ZIHKyrhWyyaJF0Eb0w04JGD6SDglcqIuFC5DATgjq4B7jrCQ2BjgEU0s2LCtUAZXW8UeTK9_PEd-KVz1BxUiT2onF1Q8O4q8q0hOWonoXg6Q_Ln5YnBM7V3XhJoaaUiBajercbpMZt7GViJ5LJ3ytB6VhIW27QewsX1ISH",
    imageAlt:
      "Ly cà phê muối xứ Huế với lớp kem mặn sánh mịn phủ trên nền cà phê Robusta đậm đặc.",
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    name: "Cà phê Sữa Đá Sài Gòn",
    category: "traditional",
    rating: "4.9",
    reviews: "1.2k đánh giá",
    description:
      "Robusta Đắk Lắk ủ lạnh cùng sữa đặc ngọt thanh béo ngậy truyền thống, chuẩn vị sảng khoái.",
    basePriceVnd: 40000,
    isAvailable: true,
    badge: "Best Seller",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzPqOrPhhCzHcloM2uKm1XEgi-tjFoOSz2izs77CruoHqfl2jxlSHB-Lmk32TgfE5vohxZTqlHsJt-WY7D2J3zYTuTTcDS8yuJnHVIh--fpbrKXiWnNxNrILhx1hS1NvTVL93KBhx-IVsBuo0WGNyq1A7XeT7yF0Cf8DTpPm3XpAvvqSjT2ncqLOb6_Z8UN1sySN2guHg2vQl2hc5WpbB2wkIkGp1qUdKoFBxgvGCYVfyluswN5Hsh",
    imageAlt:
      "Ly cà phê sữa đá Sài Gòn mát lạnh hòa quyện giữa cà phê rang đậm và sữa đặc ngọt ngào.",
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    name: "Cold Brew Cam Sả Thảo Mộc",
    category: "espresso",
    rating: "4.9",
    reviews: "310 đánh giá",
    description:
      "Chiết xuất lạnh 16 giờ với hương sả đập dập thơm the và lát cam sành mọng nước thanh mát.",
    basePriceVnd: 60000,
    isAvailable: true,
    badge: "Mới",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYo3FoAt1qaudXwGWCT1rQdBzxp1CH-ojbRnYV5GcvRn8FMzlwdJFccQvdKR13KdREqdNB7c9CcTQTOxkXShaokdAZVhEQ26QgOiUPilj13A5cQ2sFo9UohyRxyU0WYPXv2NxAX0vnx1ugm7FrELX_Jp5lszQiewBQs2vYjM2BAe9Cov-63v9ul876RK6fAUlIcH9gabFkXgAHKdM9JNlrMjMowqVQn7PRoBe2p5YYJAfWM7Scam8V",
    imageAlt:
      "Ly Cold Brew ủ lạnh kết hợp lát cam vàng tươi và nhánh sả thơm mát.",
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    name: "Cold Brew Vải Hoa Hồng",
    category: "espresso",
    rating: "4.9",
    reviews: "180 đánh giá",
    description:
      "Nốt hương trái vải thơm ngát cùng chiết xuất cánh hoa hồng Damask chưng cất tự nhiên.",
    basePriceVnd: 65000,
    isAvailable: false,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqpxb9e0jPl7WxiFsALgagy43y8x4qKxO1NDEVmYeZYu4eBR1ZvrcLlc-dZIlPh1V8oHQC_aScquZOc3Johz76dFe7ZpeB_3sk7i2MphGxKYuxC6Bm4NK_SjTUQySxMdfVXQHwWrJ-viD81gyhoKD_252GxnEcE1vQOP8B1EtgTnBkCTJBqm5YX3LjFkovjIhnsFAfN5qDJc7lGg_bqrBYOgCUZSU1c_CpFfgC4R6Ofxec9Gd89rqZ",
    imageAlt:
      "Ly Cold Brew Vải Hoa Hồng thanh lịch với sắc đỏ dịu nhẹ từ cánh hoa hồng và trái vải tươi.",
  },
  {
    id: "11111111-1111-4111-8111-111111111107",
    name: "Espresso Macchiato Caramel",
    category: "espresso",
    rating: "4.8",
    reviews: "640 đánh giá",
    description:
      "Shot đôi Arabica Cầu Đất cùng lớp bọt sữa mịn màng, phủ sốt caramel muối béo thơm.",
    basePriceVnd: 55000,
    isAvailable: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKiusDa3WsTymaJ0fU4HocmlMRCP9kTWzhea3qEznYMsykkkYhWSqqdGhkZsmTzexA5-ocAFXAE4_kB_OfyWN-6-tdl79IswlyI-S7cWQFSC6c3LARIB6Y9uWOIabZM7rQ26e7TuXz8FsoZZGcz4Xp8v5DPpDOI9B3-Dgp8YL5_ftymilQmpG6JdU-FknuuaAhLRYwo_sfjzFk21Z4mz8p4qpHcoQYZnUNisQ-BZQ0B8Io798Y9o0V",
    imageAlt:
      "Tách gốm Espresso Macchiato với lớp bọt sữa mịn và sốt caramel trang trí tinh tế.",
  },
  {
    id: "11111111-1111-4111-8111-111111111108",
    name: "Trà Đào Cam Sả Hoàng Gia",
    category: "tea",
    rating: "4.8",
    reviews: "750 đánh giá",
    description:
      "Trà ô long thượng hạng ủ lạnh kết hợp đào miếng giòn ngọt, tinh dầu sả tươi và cam vàng.",
    basePriceVnd: 50000,
    isAvailable: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFrlRYbbFdaws-kSmMBj4gvBHQKhN22IxIUBXnmVpzdDUhxVgUXQm0iKNZ9H9LQNDLTRLZtBhSrN_40OYDNIsNUY7J8XCZJEdVKE4e7C0KKIRvjXgdOT1r32rCvgch9-wpU6yIcfiSK4QwOg7zP7_vXrG8FWFte2mcFT1iNS-fYZWhMtETF3TLN6IItebcwkkuLlyLTcWYuNPDLeNQh2TbcxDvgCPBg2ggpdIC7Oxet9XLoaVQUq7Q",
    imageAlt:
      "Ly Trà Đào Cam Sả mát lạnh với miếng đào vàng ươm, lát cam tươi và sả cây.",
  },
];

export const MOCK_PRODUCTS_RESPONSE: ProductListResponse = {
  items: MOCK_CATALOG_PRODUCTS,
};
