import {
  MOCK_CATEGORIES,
  MOCK_HERO_BANNER,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_PRODUCTS_RESPONSE,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  type CategoryOption,
  type HeroBannerData,
  type ProductListItem,
  type ProductListResponse,
  type SelectOption,
  type SiteConfigData,
} from "@/mock-data";

// ============================================================================
// GIẢ LẬP GỌI API BACKEND CHO TRANG THỰC ĐƠN (SPRINT 1 - SCRUM-26 & SCRUM-27)
// Tuân thủ cấu trúc dữ liệu của docs/api/BrewLite_API_Contract_v1.0.md
// ============================================================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const FALLBACK_DRINK_IMAGE = "/images/product-placeholder.svg";

/** Độ trễ mô phỏng quá trình tải dữ liệu từ máy chủ (~420ms theo thiết kế Stitch) */
export const SIMULATED_LOADING_DELAY_MS = 420;

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

function waitDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Lấy danh sách đồ uống từ Mock Data cho giao diện Menu (`GET /products`)
 * Hỗ trợ trả về `{ items: [] }` (200 OK) khi kiểm thử trạng thái Empty State
 * và ném lỗi HTTP 500 khi kiểm thử trạng thái Error State
 */
export async function getProducts(options?: {
  delayMs?: number;
  forceEmpty?: boolean;
  forceError?: boolean;
}): Promise<ProductListResponse> {
  const delayMs = options?.delayMs ?? SIMULATED_LOADING_DELAY_MS;
  if (delayMs > 0) {
    await waitDelay(delayMs);
  }
  if (options?.forceError) {
    throw new Error("Internal server error");
  }
  if (options?.forceEmpty) {
    return { items: [] };
  }
  return {
    items: sortProductsByContract(MOCK_PRODUCTS_RESPONSE.items),
  };
}

/**
 * Lấy dữ liệu cấu hình và danh sách sản phẩm đồng bộ từ Mock Data
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
    categories: MOCK_CATEGORIES.map((cat) =>
      cat.id === "all" ? { ...cat, label: `Tất cả (${sortedItems.length})` } : cat
    ),
    sortOptions: MOCK_SORT_OPTIONS,
    priceFilterOptions: MOCK_PRICE_FILTER_OPTIONS,
    heroBanner: MOCK_HERO_BANNER,
    siteConfig: {
      ...MOCK_SITE_CONFIG,
      totalCatalogCount: sortedItems.length,
    },
  };
}

/**
 * Tải dữ liệu trang Thực đơn bất đồng bộ (`GET /products`)
 */
export async function fetchCatalogData(options?: {
  delayMs?: number;
  forceEmpty?: boolean;
  forceError?: boolean;
}): Promise<{
  products: ProductListItem[];
  categories: CategoryOption[];
  sortOptions: SelectOption[];
  priceFilterOptions: SelectOption[];
  heroBanner: HeroBannerData;
  siteConfig: SiteConfigData;
}> {
  const productListResponse = await getProducts(options);
  const items = productListResponse.items;
  return {
    products: items,
    categories: MOCK_CATEGORIES.map((cat) =>
      cat.id === "all" ? { ...cat, label: `Tất cả (${items.length})` } : cat
    ),
    sortOptions: MOCK_SORT_OPTIONS,
    priceFilterOptions: MOCK_PRICE_FILTER_OPTIONS,
    heroBanner: MOCK_HERO_BANNER,
    siteConfig: {
      ...MOCK_SITE_CONFIG,
      totalCatalogCount: items.length,
    },
  };
}
