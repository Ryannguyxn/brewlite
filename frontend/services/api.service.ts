import {
  MOCK_CATEGORIES,
  MOCK_HERO_BANNER,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_PRODUCT_DETAILS,
  MOCK_PRODUCTS_RESPONSE,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  type CategoryOption,
  type DrinkSize,
  type HeroBannerData,
  type ProductDetail,
  type ProductListItem,
  type ProductListResponse,
  type SelectOption,
  type SiteConfigData,
  type ToppingOption,
} from "@/mock-data";

// ============================================================================
// BREWLITE SERVICE & BUSINESS RULES — SPRINT 1 (GALLERY & PRODUCT DETAIL)
// Đối chiếu chuẩn 100% với:
// - docs/api/BrewLite_API_Contract_v1.0.md (Mục 2, 3, 4, 5)
// - docs/api/BrewLite_API_Contract_v2.0.md (Mục 3, 4, 5, 8)
// - database/schema.dbml
// ============================================================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const FALLBACK_DRINK_IMAGE = "/images/product-placeholder.svg";

/**
 * Business Rules theo API Contract Mục 4.4 / 4.5 & database/schema.dbml:
 * - Size mặc định trên Frontend là S (100%)
 * - Mỗi ly chọn tối đa 3 loại Topping khác nhau; mỗi loại chỉ chọn 1 lần
 * - Số lượng mỗi dòng sản phẩm: 1 <= quantity <= 10
 */
export const DEFAULT_DRINK_SIZE: DrinkSize = "S";
export const MAX_TOPPINGS_PER_ITEM = 3;
export const MIN_ORDER_QUANTITY = 1;
export const MAX_ORDER_QUANTITY = 10;

/**
 * Định dạng số nguyên VND sang chuỗi hiển thị trên UI (API Contract Mục 2.1)
 */
export function formatVnd(amountVnd: number): string {
  return `${Math.round(amountVnd).toLocaleString("vi-VN")} đ`;
}

/**
 * Kiểm tra định dạng UUID hợp lệ (tương thích với ParseUUIDPipe của NestJS — Mục 5.5)
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id.trim()
  );
}

/**
 * Công thức tính giá theo Size (API Contract Mục 4.6):
 * sizePriceVnd = round_half_up(basePriceVnd * multiplierPercent / 100)
 */
export function calculateSizePriceVnd(
  basePriceVnd: number,
  multiplierPercent: number
): number {
  if (!Number.isSafeInteger(basePriceVnd) || basePriceVnd < 0) {
    return 0;
  }
  return Math.floor((basePriceVnd * multiplierPercent + 50) / 100);
}

/**
 * Chênh lệch giá của Size đang chọn so với giá cơ bản Size S (100%)
 */
export function calculateSizeExtraVnd(
  basePriceVnd: number,
  multiplierPercent: number
): number {
  return Math.max(
    0,
    calculateSizePriceVnd(basePriceVnd, multiplierPercent) - basePriceVnd
  );
}

/**
 * Công thức tính đơn giá 1 ly (API Contract Mục 4.6):
 * unitPriceVnd = round_half_up(basePriceVnd * multiplierPercent / 100) + sum(topping.priceVnd)
 * Lưu ý: Topping có giá cố định, không nhân hệ số Size.
 */
export function calculateUnitPriceVnd(
  basePriceVnd: number,
  multiplierPercent: number,
  selectedToppings: Pick<ToppingOption, "priceVnd">[]
): number {
  const sizePrice = calculateSizePriceVnd(basePriceVnd, multiplierPercent);
  const toppingSum = selectedToppings.reduce(
    (sum, item) =>
      sum + (Number.isSafeInteger(item.priceVnd) ? item.priceVnd : 0),
    0
  );
  return sizePrice + toppingSum;
}

/**
 * Công thức tính thành tiền theo số lượng (API Contract Mục 4.6):
 * lineTotalVnd = unitPriceVnd * quantity
 */
export function calculateLineTotalVnd(
  unitPriceVnd: number,
  quantity: number
): number {
  const clampedQty = Math.max(
    MIN_ORDER_QUANTITY,
    Math.min(MAX_ORDER_QUANTITY, Math.trunc(quantity))
  );
  return unitPriceVnd * clampedQty;
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
 * Lấy danh sách đồ uống từ Mock Data cho giao diện Menu (dành cho trang Gallery khi chưa nối GET /products)
 */
export async function getProducts(): Promise<ProductListResponse> {
  return {
    items: sortProductsByContract(MOCK_PRODUCTS_RESPONSE.items),
  };
}

/**
 * Kiểu kết quả trả về từ API `GET /products/:id` theo chuẩn HTTP status của API Contract Mục 4 & Mục 5:
 * - 200 OK: Trả về `ProductDetail` đầy đủ (`id`, `name`, `imageUrl`, `basePriceVnd`, `isAvailable`, `sizes`, `toppings`)
 * - 400 Bad Request: ID không đúng định dạng UUID (`Validation failed (uuid is expected)`)
 * - 404 Not Found: ID đúng UUID nhưng không tồn tại trong DB (`Product not found`)
 * - 500 Internal Server Error / Network Error: Lỗi phía server hoặc không kết nối được tới Backend
 */
export type ProductDetailLookupResult =
  | {
      status: 200;
      data: ProductDetail;
    }
  | {
      status: 400;
      message: string;
      error: "Bad Request";
    }
  | {
      status: 404;
      message: string;
      error: "Not Found";
    }
  | {
      status: 500;
      message: string;
      error: "Internal Server Error";
    };

/**
 * Gọi thực tế API Backend `GET /products/:id` (Integrate Product Detail API):
 * - Gửi request tới `${API_BASE_URL}/products/:id` (tự động fallback qua Next.js rewrite `/api/backend/products/:id` nếu gặp chặn CORS)
 * - Xử lý đầy đủ các mã trạng thái HTTP: 200 OK, 400 Bad Request, 404 Not Found, 500 Internal Server Error & lỗi mạng
 */
export async function fetchProductDetailById(
  id: string,
  signal?: AbortSignal
): Promise<ProductDetailLookupResult> {
  const trimmedId = (id || "").trim();

  // Kiểm tra nhanh định dạng UUID trước hoặc để Backend ParseUUIDPipe trả về 400
  if (!isValidUuid(trimmedId)) {
    return {
      status: 400,
      message: "Validation failed (uuid is expected)",
      error: "Bad Request",
    };
  }

  const encodedId = encodeURIComponent(trimmedId);
  const directUrl = `${API_BASE_URL}/products/${encodedId}`;
  const proxyUrl = `/api/backend/products/${encodedId}`;

  let response: Response;
  try {
    response = await fetch(directUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    });
  } catch (directErr) {
    if (signal?.aborted) {
      throw directErr;
    }
    // Nếu trình duyệt chặn CORS khi gọi trực tiếp cổng 3001, tự động gọi qua Next.js Rewrite Proxy
    try {
      response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      });
    } catch (proxyErr) {
      if (signal?.aborted) {
        throw proxyErr;
      }
      return {
        status: 500,
        message:
          "Không thể kết nối tới máy chủ Backend (GET /products/:id). Vui lòng kiểm tra server Backend tại cổng 3001.",
        error: "Internal Server Error",
      };
    }
  }

  if (response.status === 400) {
    const errBody = await response.json().catch(() => null);
    return {
      status: 400,
      message:
        typeof errBody?.message === "string"
          ? errBody.message
          : "Validation failed (uuid is expected)",
      error: "Bad Request",
    };
  }

  if (response.status === 404) {
    const errBody = await response.json().catch(() => null);
    return {
      status: 404,
      message:
        typeof errBody?.message === "string"
          ? errBody.message
          : "Product not found",
      error: "Not Found",
    };
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    return {
      status: 500,
      message:
        typeof errBody?.message === "string"
          ? errBody.message
          : `Lỗi máy chủ khi tải chi tiết sản phẩm (HTTP ${response.status}).`,
      error: "Internal Server Error",
    };
  }

  const apiData = (await response.json()) as ProductDetail;

  // Bổ sung metadata trình bày UI (ảnh chất lượng cao của Stitch, flavorNotes, originBadge...)
  // nếu trong DB đang để ảnh placeholder mặc định `/images/product-placeholder.svg`,
  // nhưng vẫn giữ nguyên 100% các trường nghiệp vụ chuẩn từ API (`id`, `name`, `basePriceVnd`, `isAvailable`, `sizes`, `toppings`).
  const uiMetadata = MOCK_PRODUCT_DETAILS[apiData.id];
  const resolvedImageUrl =
    apiData.imageUrl &&
    apiData.imageUrl !== "/images/product-placeholder.svg"
      ? apiData.imageUrl
      : uiMetadata?.imageUrl || FALLBACK_DRINK_IMAGE;

  return {
    status: 200,
    data: {
      ...uiMetadata,
      id: apiData.id,
      name: apiData.name,
      imageUrl: resolvedImageUrl,
      basePriceVnd: Number(apiData.basePriceVnd),
      isAvailable: Boolean(apiData.isAvailable),
      sizes: Array.isArray(apiData.sizes) ? apiData.sizes : [],
      toppings: Array.isArray(apiData.toppings) ? apiData.toppings : [],
    },
  };
}

/**
 * Hàm tra cứu đồng bộ từ Mock Data (giữ lại để tương thích ngược nếu cần)
 */
export function lookupProductDetailById(id: string): ProductDetailLookupResult {
  const trimmedId = (id || "").trim();
  if (!isValidUuid(trimmedId)) {
    return {
      status: 400,
      message: "Validation failed (uuid is expected)",
      error: "Bad Request",
    };
  }
  const detail = MOCK_PRODUCT_DETAILS[trimmedId];
  if (!detail) {
    return {
      status: 404,
      message: "Product not found",
      error: "Not Found",
    };
  }
  return {
    status: 200,
    data: detail,
  };
}

/**
 * Lấy dữ liệu cấu hình và danh sách sản phẩm từ Mock Data cho trang Thực đơn (Product Gallery)
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
