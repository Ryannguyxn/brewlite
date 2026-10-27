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
// DỮ LIỆU SẢN PHẨM & TOPPING — ĐỒNG BỘ 100% VỚI backend/prisma/seed.ts
// VÀ docs/api/BrewLite_API_Contract_v2.1.md
// ============================================================================

export const MOCK_CATEGORIES: CategoryOption[] = [
  { id: "all", label: "Tất cả" },
  { id: "traditional", label: "Cà phê truyền thống" },
  { id: "espresso_coldbrew", label: "Espresso & Cold Brew" },
  { id: "tea_macchiato", label: "Trà & Macchiato" },
  { id: "bakery", label: "Bánh & Ăn nhẹ" },
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

/**
 * 9 sản phẩm thực tế từ backend/prisma/seed.ts (đồng bộ 100% với PostgreSQL)
 */
export const MOCK_CATALOG_PRODUCTS: ProductListItem[] = [
  {
    id: "a3000000-0000-4000-8000-000000000001",
    name: "Bạc Xỉu Kem Béo Phin",
    imageUrl: "/images/bac-xiu-kem-beo-phin.jpg",
    basePriceVnd: 42000,
    isAvailable: true,
    category: {
      code: "traditional",
      name: "Cà phê truyền thống",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: true,
    reviews: "Cà phê truyền thống",
    imageAlt: "Bạc Xỉu Kem Béo Phin BrewLite",
    originBadge: "Phin Truyền Thống",
    recipeTag: "Béo Ngậy",
    servingNote: "Phục vụ đá hoặc nóng",
  },
  {
    id: "a3000000-0000-4000-8000-000000000002",
    name: "Cà Phê Đen Đá Cầu Đất",
    imageUrl: "/images/ca-phe-den-da-cau-dat.jpg",
    basePriceVnd: 32000,
    isAvailable: true,
    category: {
      code: "traditional",
      name: "Cà phê truyền thống",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: true,
    reviews: "Cà phê truyền thống",
    imageAlt: "Cà Phê Đen Đá Cầu Đất BrewLite",
    originBadge: "Phin Truyền Thống",
    recipeTag: "Đậm Đà",
    servingNote: "Phục vụ đá hoặc nóng",
  },
  {
    id: "a3000000-0000-4000-8000-000000000003",
    name: "Cà Phê Muối Cố Đô",
    imageUrl: "/images/ca-phe-muoi-co-do.jpg",
    basePriceVnd: 39000,
    isAvailable: true,
    category: {
      code: "traditional",
      name: "Cà phê truyền thống",
    },
    description: null,
    rating: null,
    isNew: true,
    isBestseller: false,
    reviews: "Cà phê truyền thống",
    imageAlt: "Cà Phê Muối Cố Đô BrewLite",
    originBadge: "Đặc Sản Cố Đô",
    recipeTag: "Hài Hòa",
    servingNote: "Phục vụ lạnh",
  },
  {
    id: "a3000000-0000-4000-8000-000000000004",
    name: "Cà phê Sữa Đá Sài Gòn",
    imageUrl: "/images/ca-phe-sua-da-sai-gon.jpg",
    basePriceVnd: 35000,
    isAvailable: true,
    category: {
      code: "traditional",
      name: "Cà phê truyền thống",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: true,
    reviews: "Cà phê truyền thống",
    imageAlt: "Cà phê Sữa Đá Sài Gòn BrewLite",
    originBadge: "Phin Truyền Thống",
    recipeTag: "Đậm Vị",
    servingNote: "Phục vụ đá hoặc nóng",
  },
  {
    id: "a3000000-0000-4000-8000-000000000005",
    name: "Cold Brew Cam Sả Thảo Mộc",
    imageUrl: "/images/cold-brew-cam-sa-thao-moc.jpg",
    basePriceVnd: 49000,
    isAvailable: true,
    category: {
      code: "espresso_coldbrew",
      name: "Espresso & Cold Brew",
    },
    description: null,
    rating: null,
    isNew: true,
    isBestseller: false,
    reviews: "Espresso & Cold Brew",
    imageAlt: "Cold Brew Cam Sả Thảo Mộc BrewLite",
    originBadge: "Ủ Lạnh 16H",
    recipeTag: "Thanh Mát",
    servingNote: "Phục vụ lạnh",
  },
  {
    id: "a3000000-0000-4000-8000-000000000006",
    name: "Cold Brew Vải Hoa Hồng",
    imageUrl: "/images/cold-brew-vai-hoa-hong.jpg",
    basePriceVnd: 52000,
    isAvailable: true,
    category: {
      code: "espresso_coldbrew",
      name: "Espresso & Cold Brew",
    },
    description: null,
    rating: null,
    isNew: true,
    isBestseller: false,
    reviews: "Espresso & Cold Brew",
    imageAlt: "Cold Brew Vải Hoa Hồng BrewLite",
    originBadge: "Ủ Lạnh 16H",
    recipeTag: "Hương Hoa",
    servingNote: "Phục vụ lạnh",
  },
  {
    id: "a3000000-0000-4000-8000-000000000007",
    name: "Espresso Macchiato Caramel",
    imageUrl: "/images/espresso-macchiato-caramel.jpg",
    basePriceVnd: 45000,
    isAvailable: true,
    category: {
      code: "espresso_coldbrew",
      name: "Espresso & Cold Brew",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: false,
    reviews: "Espresso & Cold Brew",
    imageAlt: "Espresso Macchiato Caramel BrewLite",
    originBadge: "Pha Máy Thủ Công",
    recipeTag: "Ngọt Ngào",
    servingNote: "Phục vụ nóng hoặc đá",
  },
  {
    id: "a3000000-0000-4000-8000-000000000008",
    name: "Trà Đào Cam Sả Hoàng Gia",
    imageUrl: "/images/tra-dao-cam-sa-hoang-gia.jpg",
    basePriceVnd: 46000,
    isAvailable: true,
    category: {
      code: "tea_macchiato",
      name: "Trà & Macchiato",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: true,
    reviews: "Trà & Macchiato",
    imageAlt: "Trà Đào Cam Sả Hoàng Gia BrewLite",
    originBadge: "Trà Trái Cây",
    recipeTag: "Thanh Mát",
    servingNote: "Phục vụ lạnh",
  },
  {
    id: "a3000000-0000-4000-8000-000000000009",
    name: "Croissant Bơ Pháp Nướng",
    imageUrl: "/images/croissant-bo-phap-nuong.jpg",
    basePriceVnd: 38000,
    isAvailable: true,
    category: {
      code: "bakery",
      name: "Bánh & Ăn nhẹ",
    },
    description: null,
    rating: null,
    isNew: true,
    isBestseller: false,
    reviews: "Bánh & Ăn nhẹ",
    imageAlt: "Croissant Bơ Pháp Nướng BrewLite",
    originBadge: "Nướng Nóng Mỗi Ngày",
    recipeTag: "Giòn Tan",
    servingNote: "Dùng nóng",
  },
];

/**
 * Response mẫu của `GET /products` theo đúng API Contract v2.1 Mục 3.3 (`{ items: [...] }`)
 */
export const MOCK_PRODUCTS_RESPONSE: ProductListResponse = {
  items: MOCK_CATALOG_PRODUCTS,
};

/**
 * Cấu hình kích cỡ chuẩn S/M/L theo API Contract v2.1 Mục 4.3
 */
export const MOCK_PRODUCT_SIZES: ProductSizeOption[] = [
  { size: "S", multiplierPercent: 100 },
  { size: "M", multiplierPercent: 120 },
  { size: "L", multiplierPercent: 140 },
];

/**
 * 5 loại topping chuẩn từ backend/prisma/seed.ts
 */
export const MOCK_TOPPINGS: ToppingOption[] = [
  {
    id: "b2000000-0000-4000-8000-000000000001",
    code: "PEARL",
    name: "Trân châu",
    priceVnd: 5000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000002",
    code: "CHEESE_FOAM",
    name: "Kem cheese",
    priceVnd: 10000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000003",
    code: "EXTRA_SHOT",
    name: "Thêm shot espresso",
    priceVnd: 12000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000004",
    code: "GRASS_JELLY",
    name: "Sương sáo",
    priceVnd: 5000,
    isAvailable: true,
  },
  {
    id: "b2000000-0000-4000-8000-000000000005",
    code: "WHIPPED_CREAM",
    name: "Kem tươi",
    priceVnd: 8000,
    isAvailable: true,
  },
];

const TOPPING_BY_CODE = new Map(MOCK_TOPPINGS.map((t) => [t.code, t]));

/**
 * Bản đồ chi tiết sản phẩm chuẩn hóa theo `backend/prisma/seed.ts`:
 * - Croissant Bơ Pháp Nướng (`a3000000-...0009`): sizePolicy = "ONE_SIZE", sizes = [ONE_SIZE: 100%], toppings = []
 * - Các đồ uống khác (`a3000000-...0001`..`0008`): sizePolicy = "STANDARD", sizes = S/M/L, toppings lọc theo eligible toppingCodes
 * - Kèm legacy mapping `a1000000-...` để bảo đảm tương thích ngược với các bài test cũ.
 */
const REAL_PRODUCT_DETAILS: Record<string, ProductDetail> = {
  "a3000000-0000-4000-8000-000000000001": {
    ...MOCK_CATALOG_PRODUCTS[0],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: ["CHEESE_FOAM", "WHIPPED_CREAM", "EXTRA_SHOT"]
      .map((c) => TOPPING_BY_CODE.get(c)!)
      .filter(Boolean),
  },
  "a3000000-0000-4000-8000-000000000002": {
    ...MOCK_CATALOG_PRODUCTS[1],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: ["EXTRA_SHOT"]
      .map((c) => TOPPING_BY_CODE.get(c)!)
      .filter(Boolean),
  },
  "a3000000-0000-4000-8000-000000000003": {
    ...MOCK_CATALOG_PRODUCTS[2],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: ["CHEESE_FOAM", "EXTRA_SHOT"]
      .map((c) => TOPPING_BY_CODE.get(c)!)
      .filter(Boolean),
  },
  "a3000000-0000-4000-8000-000000000004": {
    ...MOCK_CATALOG_PRODUCTS[3],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: ["EXTRA_SHOT", "WHIPPED_CREAM"]
      .map((c) => TOPPING_BY_CODE.get(c)!)
      .filter(Boolean),
  },
  "a3000000-0000-4000-8000-000000000005": {
    ...MOCK_CATALOG_PRODUCTS[4],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: ["EXTRA_SHOT"]
      .map((c) => TOPPING_BY_CODE.get(c)!)
      .filter(Boolean),
  },
  "a3000000-0000-4000-8000-000000000006": {
    ...MOCK_CATALOG_PRODUCTS[5],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: [],
  },
  "a3000000-0000-4000-8000-000000000007": {
    ...MOCK_CATALOG_PRODUCTS[6],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: ["WHIPPED_CREAM", "EXTRA_SHOT"]
      .map((c) => TOPPING_BY_CODE.get(c)!)
      .filter(Boolean),
  },
  "a3000000-0000-4000-8000-000000000008": {
    ...MOCK_CATALOG_PRODUCTS[7],
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: ["GRASS_JELLY", "PEARL"]
      .map((c) => TOPPING_BY_CODE.get(c)!)
      .filter(Boolean),
  },
  "a3000000-0000-4000-8000-000000000009": {
    ...MOCK_CATALOG_PRODUCTS[8],
    sizePolicy: "ONE_SIZE",
    sizes: [{ size: "ONE_SIZE", multiplierPercent: 100 }],
    toppings: [],
  },
};

// Legacy fallback items for test compatibility
const LEGACY_PRODUCT_DETAILS: Record<string, ProductDetail> = {
  "a1000000-0000-4000-8000-000000000001": {
    id: "a1000000-0000-4000-8000-000000000001",
    name: "Cà phê đen",
    imageUrl: "/images/ca-phe-den-da-cau-dat.jpg",
    basePriceVnd: 30000,
    isAvailable: true,
    category: { code: "traditional", name: "Cà phê truyền thống" },
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: MOCK_TOPPINGS,
  },
  "a1000000-0000-4000-8000-000000000002": {
    id: "a1000000-0000-4000-8000-000000000002",
    name: "Cà phê sữa",
    imageUrl: "/images/ca-phe-sua-da-sai-gon.jpg",
    basePriceVnd: 35000,
    isAvailable: true,
    category: { code: "traditional", name: "Cà phê truyền thống" },
    sizePolicy: "STANDARD",
    sizes: MOCK_PRODUCT_SIZES,
    toppings: MOCK_TOPPINGS,
  },
};

export const MOCK_PRODUCT_DETAILS: Record<string, ProductDetail> = {
  ...REAL_PRODUCT_DETAILS,
  ...LEGACY_PRODUCT_DETAILS,
};
