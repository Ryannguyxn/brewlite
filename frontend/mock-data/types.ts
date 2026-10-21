// ============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES / INTERFACES) CHO BREWLITE FRONTEND
// Đối chiếu chuẩn 100% với:
// - docs/api/BrewLite_API_Contract_v1.0.md (Mục 2, 3, 4, 5.1)
// - docs/requirements/BrewLite_Requirements_Specification.docx (BR-011 .. BR-017)
// ============================================================================

export type CategoryId =
  | "all"
  | "traditional"
  | "espresso"
  | "tea"
  | "bakery";

export interface CategoryOption {
  id: CategoryId;
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Kích cỡ đồ uống hợp lệ theo API Contract Mục 4.2 & BR-011:
 * - S: 100% giá gốc (Mặc định)
 * - M: 120% giá gốc
 * - L: 140% giá gốc
 */
export type DrinkSize = "S" | "M" | "L";

export type SizeMultiplierPercent = 100 | 120 | 140;

/**
 * 1 phần tử đồ uống trả về từ `GET /products` (API Contract Mục 3.2 & 5.1)
 * - 5 trường bắt buộc theo API Contract: `id`, `name`, `imageUrl`, `basePriceVnd`, `isAvailable`
 * - Các trường phụ trợ UI (`category`, `rating`, `reviews`, `description`, `badge`, `imageAlt`)
 *   để dạng optional (`?`) nhằm giữ nguyên giao diện thẻ sản phẩm của trang cũ khi đọc từ mock-data
 *   nhưng vẫn tương thích 100% khi ghép nối response thật từ Backend.
 */
export interface ProductListItem {
  /** UUID v4 của sản phẩm */
  id: string;
  /** Tên hiển thị của đồ uống */
  name: string;
  /** Đường dẫn ảnh sản phẩm (API Contract Mục 3.2) */
  imageUrl: string;
  /** Giá gốc ứng với Size S (100%), số nguyên VND > 0, bội số của 5.000đ (AC-US-CAT-05-04) */
  basePriceVnd: number;
  /** `true` = còn hàng, `false` = tạm hết hàng (US-CAT-04) */
  isAvailable: boolean;

  // Các trường UI bổ trợ (optional để không bắt buộc Backend phải trả về)
  category?: CategoryId;
  rating?: string;
  reviews?: string;
  description?: string;
  badge?: "Best Seller" | "Mới";
  imageAlt?: string;
}

/** Alias tương thích cho các component gọi ProductItem */
export type ProductItem = ProductListItem;

/**
 * Response 200 OK của `GET /products` (API Contract Mục 3.3 & 3.7)
 */
export interface ProductListResponse {
  items: ProductListItem[];
}

/**
 * Cấu hình kích cỡ trong `GET /products/:id` (API Contract Mục 4.2 & 5.1 — dành cho Task 4)
 */
export interface ProductSizeOption {
  size: DrinkSize;
  multiplierPercent: SizeMultiplierPercent;
}

/**
 * Cấu hình topping trong `GET /products/:id` (API Contract Mục 4.2 & 5.1 — dành cho Task 4)
 */
export interface ToppingOption {
  id: string;
  name: string;
  priceVnd: number;
  isAvailable: boolean;
}

/**
 * Response 200 OK của `GET /products/:id` (API Contract Mục 4.2 & 4.4 — dành cho Task 4)
 */
export interface ProductDetail extends ProductListItem {
  sizes: ProductSizeOption[];
  toppings: ToppingOption[];
}

/**
 * Cấu trúc lỗi HTTP mặc định của NestJS (API Contract Mục 1.4 & 5.1)
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
