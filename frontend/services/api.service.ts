import {
  MOCK_CATEGORIES,
  MOCK_HERO_BANNER,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_PRODUCT_DETAILS,
  MOCK_PRODUCTS_RESPONSE,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  type CategoryOption,
  type HeroBannerData,
  type ProductDetail,
  type ProductListItem,
  type ProductListResponse,
  type SelectOption,
  type SiteConfigData,
} from "@/mock-data";

// ============================================================================
// BREWLITE MOCK SERVICE — SPRINT 1 (SCRUM-26: PRODUCT CARD & MENU UI)
// ============================================================================

export const FALLBACK_DRINK_IMAGE = "/file.svg";

/**
 * Định dạng số nguyên VND sang chuỗi hiển thị trên UI (API Contract Mục 2.1)
 */
export function formatVnd(amountVnd: number): string {
  return `${Math.round(amountVnd).toLocaleString("vi-VN")} đ`;
}

/**
 * Sắp xếp danh sách sản phẩm theo đúng quy tắc BR-017 & API Contract Mục 3.5:
 * Theo `name` tăng dần (A -> Z), nếu trùng tên thì theo `id` tăng dần.
 */
export function sortProductsByContract(
  items: ProductListItem[]
): ProductListItem[] {
  return [...items].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "vi");
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Lấy danh sách đồ uống từ Mock Data cho giao diện Menu (SCRUM-26)
 */
export async function getProducts(): Promise<ProductListResponse> {
  return {
    items: sortProductsByContract(MOCK_PRODUCTS_RESPONSE.items),
  };
}

/**
 * Lấy chi tiết đồ uống từ Mock Data theo ID
 */
export async function getProductById(id: string): Promise<ProductDetail | null> {
  const trimmedId = (id || "").trim();
  return MOCK_PRODUCT_DETAILS[trimmedId] ?? null;
}

/**
 * Lấy dữ liệu cấu hình và danh sách sản phẩm từ Mock Data cho trang Thực đơn
 */
export function getCatalogData(): {
  products: ProductListItem[];
  categories: CategoryOption[];
  sortOptions: SelectOption[];
  priceFilterOptions: SelectOption[];
  heroBanner: HeroBannerData;
  siteConfig: SiteConfigData;
} {
  const sortedItems = sortProductsByContract(MOCK_PRODUCTS_RESPONSE.items);
  return {
    products: sortedItems,
    categories: MOCK_CATEGORIES,
    sortOptions: MOCK_SORT_OPTIONS,
    priceFilterOptions: MOCK_PRICE_FILTER_OPTIONS,
    heroBanner: MOCK_HERO_BANNER,
    siteConfig: {
      ...MOCK_SITE_CONFIG,
      totalCatalogCount: sortedItems.length,
    },
  };
}

export async function fetchCatalogData() {
  return getCatalogData();
}
