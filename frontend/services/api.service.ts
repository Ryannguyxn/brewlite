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
// GIẢ LẬP GỌI API BACKEND CHO TRANG THỰC ĐƠN (SPRINT 1 - SCRUM-26)
// Tuân thủ cấu trúc dữ liệu của docs/api/BrewLite_API_Contract_v1.0.md
// ============================================================================

const SIMULATED_NETWORK_DELAY_MS = 180;

function simulateDelay<T>(
  data: T,
  ms = SIMULATED_NETWORK_DELAY_MS
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(structuredClone(data));
    }, ms);
  });
}

/**
 * Giả lập gọi `GET /products` trả về `{ items: ProductListItem[] }` theo API Contract Mục 3.3
 */
export async function getProducts(): Promise<ProductListResponse> {
  return simulateDelay(MOCK_PRODUCTS_RESPONSE);
}

/**
 * Lấy danh sách sản phẩm và bộ lọc trang Thực đơn (Catalog)
 */
export async function fetchCatalogData(): Promise<{
  products: ProductListItem[];
  categories: CategoryOption[];
  sortOptions: SelectOption[];
  priceFilterOptions: SelectOption[];
  heroBanner: HeroBannerData;
  siteConfig: SiteConfigData;
}> {
  const response = await getProducts();
  return {
    products: response.items,
    categories: MOCK_CATEGORIES,
    sortOptions: MOCK_SORT_OPTIONS,
    priceFilterOptions: MOCK_PRICE_FILTER_OPTIONS,
    heroBanner: MOCK_HERO_BANNER,
    siteConfig: MOCK_SITE_CONFIG,
  };
}
