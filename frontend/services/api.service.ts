import {
  MOCK_CATEGORIES,
  MOCK_HERO_BANNER,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_PRODUCT_DETAILS,
  MOCK_PRODUCTS_RESPONSE,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  type ApiErrorResponse,
  type CategoryOption,
  type HeroBannerData,
  type ProductDetail,
  type ProductListItem,
  type ProductListResponse,
  type SelectOption,
  type SiteConfigData,
} from "@/mock-data";

// ============================================================================
// BREWLITE API SERVICE — CHUẨN BREWLITE API CONTRACT v1.0 (SPRINT 1)
// Base URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
// ============================================================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const DEFAULT_USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

export const FALLBACK_DRINK_IMAGE = "/images/fallback-drink.jpg";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ApiContractError extends Error {
  public readonly statusCode: number;
  public readonly error?: string;
  public readonly payload: ApiErrorResponse;

  constructor(payload: ApiErrorResponse) {
    const msg = Array.isArray(payload.message)
      ? payload.message.join("; ")
      : payload.message;
    super(msg);
    this.name = "ApiContractError";
    this.statusCode = payload.statusCode;
    this.error = payload.error;
    this.payload = payload;
  }
}

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
 * Kiểm tra UUID hợp lệ (khớp với ParseUUIDPipe của NestJS — API Contract Mục 4.2 & 4.6)
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

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
 * Endpoint 1 (Task 2 & Task 3): `GET /products`
 * Lấy toàn bộ danh sách đồ uống trong menu (API Contract Mục 3)
 * Response 200 OK: `{ items: ProductListItem[] }`
 */
export async function getProducts(options?: {
  useMock?: boolean;
}): Promise<ProductListResponse> {
  const useMock = options?.useMock ?? DEFAULT_USE_MOCK;

  if (!useMock) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorPayload: ApiErrorResponse = {
        statusCode: response.status,
        message: "Internal server error",
      };
      try {
        errorPayload = (await response.json()) as ApiErrorResponse;
      } catch {
        // Giữ nguyên fallback lỗi mặc định
      }
      throw new ApiContractError(errorPayload);
    }

    const data = (await response.json()) as ProductListResponse;
    return {
      items: Array.isArray(data?.items)
        ? sortProductsByContract(data.items)
        : [],
    };
  }

  const res = await simulateDelay(MOCK_PRODUCTS_RESPONSE);
  return {
    items: sortProductsByContract(res.items),
  };
}

/**
 * Endpoint 2 (Task 2 & Task 4): `GET /products/:id`
 * Dành cho teammate phát triển phần Chi tiết sản phẩm & Tùy chọn Size/Topping
 */
export async function getProductById(
  id: string,
  options?: { useMock?: boolean }
): Promise<ProductDetail> {
  const useMock = options?.useMock ?? DEFAULT_USE_MOCK;
  const trimmedId = (id || "").trim();

  if (!isValidUuid(trimmedId)) {
    throw new ApiContractError({
      statusCode: 400,
      message: "Validation failed (uuid is expected)",
      error: "Bad Request",
    });
  }

  if (!useMock) {
    const response = await fetch(`${API_BASE_URL}/products/${trimmedId}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorPayload: ApiErrorResponse = {
        statusCode: response.status,
        message:
          response.status === 404
            ? `Product with ID ${trimmedId} not found`
            : "Internal server error",
        error:
          response.status === 404
            ? "Not Found"
            : response.status === 400
              ? "Bad Request"
              : undefined,
      };
      try {
        errorPayload = (await response.json()) as ApiErrorResponse;
      } catch {
        // Giữ nguyên fallback lỗi
      }
      throw new ApiContractError(errorPayload);
    }

    return (await response.json()) as ProductDetail;
  }

  const detail = MOCK_PRODUCT_DETAILS[trimmedId];
  if (!detail) {
    throw new ApiContractError({
      statusCode: 404,
      message: `Product with ID ${trimmedId} not found`,
      error: "Not Found",
    });
  }

  return simulateDelay(detail);
}

/**
 * Hàm lấy dữ liệu trang Thực đơn (gọi `getProducts()` từ API Contract kết hợp cấu hình giao diện)
 */
export async function fetchCatalogData(options?: {
  useMock?: boolean;
}): Promise<{
  products: ProductListItem[];
  categories: CategoryOption[];
  sortOptions: SelectOption[];
  priceFilterOptions: SelectOption[];
  heroBanner: HeroBannerData;
  siteConfig: SiteConfigData;
}> {
  const productListResponse = await getProducts(options);
  return {
    products: productListResponse.items,
    categories: MOCK_CATEGORIES,
    sortOptions: MOCK_SORT_OPTIONS,
    priceFilterOptions: MOCK_PRICE_FILTER_OPTIONS,
    heroBanner: MOCK_HERO_BANNER,
    siteConfig: {
      ...MOCK_SITE_CONFIG,
      totalCatalogCount: productListResponse.items.length,
    },
  };
}
