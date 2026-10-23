// ============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES / INTERFACES) CHO BREWLITE FRONTEND
// Đối chiếu chuẩn 100% với:
// - docs/api/BrewLite_API_Contract_v2.1.md (Mục 2, 3, 4, 5.1)
// - backend/prisma/seed.ts & Migration 5 (product_catalog_schema_upgrade)
// - database/schema.dbml
// ============================================================================

export type CategoryId =
  | "all"
  | "traditional"
  | "espresso_coldbrew"
  | "tea_macchiato"
  | "bakery"
  // Legacy aliases for backward compatibility with mock & SCRUM-32
  | "espresso"
  | "tea";

export interface CategoryOption {
  id: CategoryId;
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ProductCategory {
  code: string;
  name: string;
  isActive?: boolean;
}

/**
 * Kích cỡ đồ uống hợp lệ theo API Contract v2.1 Mục 2.3, 4.4 & BR-011:
 * - S: 100% giá gốc (Mặc định cho STANDARD)
 * - M: 120% giá gốc
 * - L: 140% giá gốc
 * - ONE_SIZE: 100% giá gốc
 */
export type DrinkSize = "S" | "M" | "L" | "ONE_SIZE";

export type ProductSizePolicy = "STANDARD" | "ONE_SIZE";

export type SizeMultiplierPercent = 100 | 120 | 140;

/**
 * 1 phần tử đồ uống trả về từ `GET /products` (API Contract v2.1 Mục 3.3)
 * Cấu trúc API Contract v2.1:
 * - id: UUID string
 * - name: string
 * - imageUrl: string ("/images/...")
 * - basePriceVnd: number
 * - isAvailable: boolean (stock > 0 && category.isActive)
 * - category: { code: string, name: string }
 * - description: string | null
 * - rating: number | null (0-5)
 * - isNew: boolean
 * - isBestseller: boolean
 */
export interface ProductListItem {
  /** UUID v4 của sản phẩm */
  id: string;
  /** Tên hiển thị của đồ uống */
  name: string;
  /** Đường dẫn ảnh sản phẩm (API Contract Mục 2.3 & 3.3) */
  imageUrl: string;
  /** Giá gốc ứng với Size S / ONE_SIZE (100%), số nguyên VND */
  basePriceVnd: number;
  /** true = còn hàng và danh mục đang hoạt động, false = hết hàng hoặc ngừng kinh doanh */
  isAvailable: boolean;

  /** Danh mục đồ uống: hỗ trợ object {code, name} từ API v2.1 và string mã danh mục từ mock */
  category?: ProductCategory | CategoryId | string;
  /** Mô tả chi tiết (nullable theo API Contract v2.1) */
  description?: string | null;
  /** Điểm đánh giá (hỗ trợ number/null theo v2.1 và string từ mock) */
  rating?: number | string | null;
  /** Badge sản phẩm mới */
  isNew?: boolean;
  /** Badge bán chạy */
  isBestseller?: boolean;

  // Các trường UI bổ trợ (tương thích với mock-data và SCRUM-32)
  reviews?: string;
  badge?: "Best Seller" | "Mới" | string;
  imageAlt?: string;
  originBadge?: string;
  recipeTag?: string;
  servingNote?: string;
  flavorNotes?: string;
  intensity?: string;
  beanType?: string;
  processMethod?: string;
  sustainabilityNote?: string;
}

/** Alias tương thích cho các component gọi ProductItem */
export type ProductItem = ProductListItem;

/**
 * Response 200 OK của `GET /products` (API Contract v2.1 Mục 3.3)
 */
export interface ProductListResponse {
  items: ProductListItem[];
}

/**
 * Cấu hình kích cỡ trong `GET /products/:id` (API Contract v2.1 Mục 4.3)
 */
export interface ProductSizeOption {
  size: DrinkSize;
  multiplierPercent: number;
}

/**
 * Cấu hình topping trong `GET /products/:id` và seed.ts (API Contract v2.1 Mục 4.3)
 */
export interface ToppingOption {
  id: string;
  code?: string;
  name: string;
  priceVnd: number;
  isAvailable?: boolean;
}

/**
 * Response 200 OK của `GET /products/:id` (API Contract v2.1 Mục 4.3)
 */
export interface ProductDetail extends ProductListItem {
  sizePolicy?: ProductSizePolicy;
  sizes: ProductSizeOption[];
  toppings: ToppingOption[];
}

/**
 * Cấu trúc lỗi HTTP mặc định của NestJS (API Contract Mục 5.1 & 5.2)
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  memberCode: string;
  memberSince: string;
  tierName: string;
  tierBadge: string;
  nextTierName: string;
  points: number;
  nextTierPoints: number;
  savedThisMonth: number;
  avatarUrl: string;
  nextTierPerksSummary: string;
  equivalentRewardHint: string;
}

export interface HeroBannerData {
  seasonBadge: string;
  roastSubtitle: string;
  headlineLine1: string;
  headlineHighlight: string;
  description: string;
  featuredLabel: string;
  featuredDrinkName: string;
  featuredPromoText: string;
}

export interface BranchInfo {
  id: string;
  name: string;
  address: string;
}

export interface QuickLink {
  label: string;
  href: string;
}

export interface SiteConfigData {
  brandName: string;
  logoUrl: string;
  selectedBranch: string;
  searchPlaceholder: string;
  hotline: string;
  brandStory: string;
  copyright: string;
  tagline: string;
  deliveryHighlight: string;
  totalCatalogCount: number;
  branches: BranchInfo[];
  quickLinks: QuickLink[];
}
