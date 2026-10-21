// ============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES / INTERFACES) CHO BREWLITE FRONTEND
// Đồng봉 với BrewLite_API_Contract_v1.0.md (Mục 3 & 5.1)
// ============================================================================

export type CategoryId = "all" | "traditional" | "espresso" | "tea";

export interface CategoryOption {
  id: CategoryId;
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Cấu trúc 1 đồ uống trong danh sách thực đơn (`GET /products` — API Contract Mục 3.2 & 5.1)
 */
export interface ProductListItem {
  /** UUID của sản phẩm */
  id: string;
  /** Tên hiển thị của đồ uống */
  name: string;
  /** Đường dẫn ảnh sản phẩm */
  imageUrl: string;
  /** Giá gốc ứng với Size S (100%), số nguyên VND > 0, bội số của 5.000đ (AC-US-CAT-05-04) */
  basePriceVnd: number;
  /** `true` = còn hàng, `false` = tạm hết hàng (US-CAT-04) */
  isAvailable: boolean;

  // Các trường hiển thị UI trên thẻ sản phẩm (Catalog Card)
  category: Exclude<CategoryId, "all">;
  rating: string;
  reviews: string;
  description: string;
  imageAlt: string;
  badge?: "Best Seller" | "Mới";
}

export type ProductItem = ProductListItem;

/**
 * Response chuẩn của `GET /products` theo API Contract Mục 3.3
 */
export interface ProductListResponse {
  items: ProductListItem[];
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
