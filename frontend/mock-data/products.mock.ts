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
 * 8 sản phẩm chuẩn từ backend/prisma/seed.ts
 */
export const MOCK_CATALOG_PRODUCTS: ProductListItem[] = [
  {
    id: "a1000000-0000-4000-8000-000000000001",
    name: "Cà phê đen",
    imageUrl: "/images/product-placeholder.svg",
    basePriceVnd: 30000,
    isAvailable: true,
    category: {
      code: "traditional",
      name: "Cà phê truyền thống",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: false,
    reviews: "Cà phê truyền thống",
    imageAlt: "Cà phê đen phin truyền thống BrewLite",
    originBadge: "Phin Truyền Thống",
    recipeTag: "Nguyên Bản",
    servingNote: "Phục vụ đá hoặc nóng",
  },
  {
    id: "a1000000-0000-4000-8000-000000000002",
    name: "Cà phê sữa",
    imageUrl: "/images/product-placeholder.svg",
    basePriceVnd: 35000,
    isAvailable: true,
    category: {
      code: "traditional",
      name: "Cà phê truyền thống",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: false,
    reviews: "Cà phê truyền thống",
    imageAlt: "Cà phê sữa pha phin BrewLite",
    originBadge: "Phin Truyền Thống",
    recipeTag: "Đậm Đà",
    servingNote: "Phục vụ đá hoặc nóng",
  },
  {
    id: "a1000000-0000-4000-8000-000000000003",
    name: "Bạc xỉu",
    imageUrl: "/images/product-placeholder.svg",
    basePriceVnd: 40000,
    isAvailable: true,
    category: {
      code: "traditional",
      name: "Cà phê truyền thống",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: false,
    reviews: "Cà phê truyền thống",
    imageAlt: "Bạc xỉu ba tầng BrewLite",
    originBadge: "Phin Truyền Thống",
    recipeTag: "Dịu Ngọt",
    servingNote: "Phục vụ lạnh",
  },
  {
    id: "a1000000-0000-4000-8000-000000000004",
    name: "Cappuccino",
    imageUrl: "/images/product-placeholder.svg",
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
    imageAlt: "Cappuccino bọt sữa nghệ thuật BrewLite",
    originBadge: "Pha Máy Thủ Công",
    recipeTag: "Cân Bằng",
    servingNote: "Phục vụ nóng hoặc đá",
  },
  {
    id: "a1000000-0000-4000-8000-000000000005",
    name: "Latte",
    imageUrl: "/images/product-placeholder.svg",
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
    imageAlt: "Latte béo mịn thơm ngậy BrewLite",
    originBadge: "Pha Máy Thủ Công",
    recipeTag: "Béo Ngậy",
    servingNote: "Phục vụ nóng hoặc đá",
  },
  {
    id: "a1000000-0000-4000-8000-000000000006",
    name: "Trà đào cam sả",
    imageUrl: "/images/product-placeholder.svg",
    basePriceVnd: 42000,
    isAvailable: true,
    category: {
      code: "tea_macchiato",
      name: "Trà & Macchiato",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: false,
    reviews: "Trà & Macchiato",
    imageAlt: "Trà đào cam sả thanh mát BrewLite",
    originBadge: "Trà Trái Cây",
    recipeTag: "Thanh Mát",
    servingNote: "Phục vụ lạnh",
  },
  {
    id: "a1000000-0000-4000-8000-000000000007",
    name: "Matcha Latte",
    imageUrl: "/images/product-placeholder.svg",
    basePriceVnd: 50000,
    isAvailable: true,
    category: {
      code: "tea_macchiato",
      name: "Trà & Macchiato",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: false,
    reviews: "Trà & Macchiato",
    imageAlt: "Matcha Latte thơm lừng BrewLite",
    originBadge: "Trà & Macchiato",
    recipeTag: "Thượng Hạng",
    servingNote: "Phục vụ lạnh",
  },
  {
    id: "a1000000-0000-4000-8000-000000000008",
    name: "Trà sữa truyền thống",
    imageUrl: "/images/product-placeholder.svg",
    basePriceVnd: 40000,
    // stock = 0 trong seed.ts -> isAvailable = false
    isAvailable: false,
    category: {
      code: "tea_macchiato",
      name: "Trà & Macchiato",
    },
    description: null,
    rating: null,
    isNew: false,
    isBestseller: false,
    reviews: "Trà & Macchiato",
    imageAlt: "Trà sữa truyền thống đậm vị BrewLite",
    originBadge: "Trà & Macchiato",
    recipeTag: "Đậm Vị",
    servingNote: "Phục vụ lạnh",
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

export const MOCK_PRODUCT_DETAILS: Record<string, ProductDetail> =
  Object.fromEntries(
    MOCK_CATALOG_PRODUCTS.map((product) => [
      product.id,
      {
        ...product,
        sizePolicy: "STANDARD",
        sizes: MOCK_PRODUCT_SIZES,
        toppings: MOCK_TOPPINGS.filter((t) => t.isAvailable !== false),
      },
    ])
  );
