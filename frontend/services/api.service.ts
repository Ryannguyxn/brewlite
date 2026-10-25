import {
  AUTH_VALIDATION_RULES,
  MOCK_CATEGORIES,
  MOCK_HERO_BANNER,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_PRODUCT_DETAILS,
  MOCK_PRODUCTS_RESPONSE,
  MOCK_REGISTERED_USERS,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  MOCK_TOPPINGS,
  type AuthApiErrorResponse,
  type AuthMode,
  type CategoryOption,
  type CreateOrderItemRequestDto,
  type CreateOrderRequestDto,
  type DrinkSize,
  type HeroBannerData,
  type InsufficientStockDetail,
  type InvalidCartDetail,
  type LoginRequestDto,
  type LoginResponseDto,
  type MockRegisteredUser,
  type OrderApiErrorResponse,
  type OrderErrorCode,
  type OrderItemSnapshotDto,
  type OrderResponseDto,
  type ProductDetail,
  type ProductListItem,
  type ProductListResponse,
  type RegisterRequestDto,
  type RegisterResponseDto,
  type SelectOption,
  type SiteConfigData,
  type ToppingOption,
} from "@/mock-data";

// ============================================================================
// BREWLITE SERVICE & BUSINESS RULES — SPRINT 2 (CATALOG, AUTH & CREATE ORDER)
// Đối chiếu chuẩn 100% với:
// - docs/api/BrewLite_API_Contract_v2.1.md (Mục 2, 3, 4, 5, 6, 7, 8, 9)
// - backend/prisma/seed.ts
// - database/schema.dbml
// ============================================================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const FALLBACK_DRINK_IMAGE = "/images/product-placeholder.svg";

/** Độ trễ mô phỏng quá trình tải dữ liệu từ máy chủ nếu cần (~420ms theo thiết kế Stitch) */
export const SIMULATED_LOADING_DELAY_MS = 420;

/**
 * Business Rules theo API Contract v2.1 Mục 4.4 & database/schema.dbml:
 * - Size mặc định trên Frontend là S (100%) hoặc ONE_SIZE (100%)
 * - Mỗi ly chọn tối đa 3 loại Topping khác nhau; mỗi loại chỉ chọn 1 lần
 * - Số lượng mỗi dòng sản phẩm: 1 <= quantity <= 10
 */
export const DEFAULT_DRINK_SIZE: DrinkSize = "S";
export const MAX_TOPPINGS_PER_ITEM = 3;
export const MIN_ORDER_QUANTITY = 1;
export const MAX_ORDER_QUANTITY = 10;

// Lưu bộ nhớ tạm các sản phẩm tải từ Backend (`GET /products`) để đối chiếu khi tạo Order
let cachedCatalogProducts: ProductListItem[] = [...MOCK_PRODUCTS_RESPONSE.items];

/**
 * Định dạng số nguyên VND sang chuỗi hiển thị trên UI (API Contract Mục 2.3)
 */
export function formatVnd(amountVnd: number): string {
  return `${Math.round(amountVnd).toLocaleString("vi-VN")} đ`;
}

/**
 * Kiểm tra định dạng UUID hợp lệ (tương thích với ParseUUIDPipe của NestJS — Mục 4.2 / 5.1)
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id.trim()
  );
}

/**
 * Công thức tính giá theo Size (API Contract Mục 4.5 & 8.3):
 * sizePriceVnd = floor(basePriceVnd * multiplierPercent / 100)
 */
export function calculateSizePriceVnd(
  basePriceVnd: number,
  multiplierPercent: number
): number {
  if (!Number.isSafeInteger(basePriceVnd) || basePriceVnd < 0) {
    return 0;
  }
  return Math.floor((basePriceVnd * multiplierPercent) / 100);
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
 * Công thức tính đơn giá 1 ly (API Contract Mục 4.5 & 8.3):
 * unitPriceVnd = floor(basePriceVnd * multiplierPercent / 100) + sum(topping.priceVnd)
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
 * Công thức tính thành tiền theo số lượng (API Contract Mục 4.5 & 8.3):
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
 * Sắp xếp danh sách sản phẩm theo đúng quy tắc BR-017 & API Contract Mục 3.4:
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
 * Lấy danh sách đồ uống từ API Backend (`GET /products`)
 * Tuân thủ API Contract v2.1 Mục 3.
 */
export async function getProducts(options?: {
  delayMs?: number;
  forceEmpty?: boolean;
  forceError?: boolean;
}): Promise<ProductListResponse> {
  if (options?.forceError) {
    const err = new Error("Lỗi máy chủ nội bộ (Internal Server Error)");
    (err as { statusCode?: number }).statusCode = 500;
    (err as { errorTitle?: string }).errorTitle = "INTERNAL_SERVER_ERROR";
    throw err;
  }
  if (options?.forceEmpty) {
    return { items: [] };
  }
  if (options?.delayMs && options.delayMs > 0) {
    await waitDelay(options.delayMs);
  }

  const isBrowser = typeof window !== "undefined";
  const primaryUrl = isBrowser
    ? "/api/backend/products"
    : `${API_BASE_URL}/products`;
  const fallbackUrl = isBrowser
    ? `${API_BASE_URL}/products`
    : "/api/backend/products";

  let response: Response;
  try {
    response = await fetch(primaryUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (primaryErr) {
    try {
      response = await fetch(fallbackUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch {
      throw primaryErr;
    }
  }

  if (!response.ok) {
    let errorDetail = `Lỗi yêu cầu API: HTTP ${response.status} ${response.statusText}`;
    let statusCode: number = response.status;
    let errorTitle: string | undefined = undefined;
    try {
      const errorJson = await response.json();
      if (typeof errorJson?.statusCode === "number") {
        statusCode = errorJson.statusCode;
      }
      if (typeof errorJson?.error === "string") {
        errorTitle = errorJson.error;
      }
      if (errorJson?.message) {
        errorDetail = Array.isArray(errorJson.message)
          ? errorJson.message.join(", ")
          : String(errorJson.message);
      }
    } catch {
      // Bỏ qua lỗi parse JSON nếu response không phải JSON
    }
    const err = new Error(errorDetail);
    (err as { statusCode?: number }).statusCode = statusCode;
    if (errorTitle) {
      (err as { errorTitle?: string }).errorTitle = errorTitle;
    }
    throw err;
  }

  const data: ProductListResponse = await response.json();

  if (!data || !Array.isArray(data.items)) {
    throw new Error(
      "Dữ liệu danh sách sản phẩm không hợp lệ: phản hồi từ máy chủ không chứa mảng 'items'."
    );
  }

  const sorted = sortProductsByContract(data.items);
  cachedCatalogProducts = sorted;
  return {
    items: sorted,
  };
}

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
 * Gọi thực tế API Backend `GET /products/:id` (SCRUM-32: Integrate Product Detail API)
 * - Tuân thủ API Contract v2.1 Mục 4.
 */
export async function fetchProductDetailById(
  id: string,
  signal?: AbortSignal
): Promise<ProductDetailLookupResult> {
  const trimmedId = (id || "").trim();

  if (!isValidUuid(trimmedId)) {
    return {
      status: 400,
      message: "Validation failed (uuid is expected)",
      error: "Bad Request",
    };
  }

  const isBrowser = typeof window !== "undefined";
  const encodedId = encodeURIComponent(trimmedId);
  const primaryUrl = isBrowser
    ? `/api/backend/products/${encodedId}`
    : `${API_BASE_URL}/products/${encodedId}`;
  const fallbackUrl = isBrowser
    ? `${API_BASE_URL}/products/${encodedId}`
    : `/api/backend/products/${encodedId}`;

  let response: Response;
  try {
    response = await fetch(primaryUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    });
  } catch (primaryErr) {
    if (signal?.aborted) throw primaryErr;
    try {
      response = await fetch(fallbackUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      });
    } catch (fallbackErr) {
      if (signal?.aborted) throw fallbackErr;
      return {
        status: 500,
        message:
          "Không thể kết nối đến máy chủ Backend (GET /products/:id). Vui lòng kiểm tra lại dịch vụ Backend.",
        error: "Internal Server Error",
      };
    }
  }

  if (response.status === 400) {
    const errorJson = await response.json().catch(() => null);
    return {
      status: 400,
      message:
        typeof errorJson?.message === "string"
          ? errorJson.message
          : "Validation failed (uuid is expected)",
      error: "Bad Request",
    };
  }

  if (response.status === 404) {
    const errorJson = await response.json().catch(() => null);
    return {
      status: 404,
      message:
        typeof errorJson?.message === "string"
          ? errorJson.message
          : "Product not found",
      error: "Not Found",
    };
  }

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    return {
      status: 500,
      message:
        typeof errorJson?.message === "string"
          ? errorJson.message
          : `Lỗi máy chủ khi tải chi tiết sản phẩm (HTTP ${response.status}).`,
      error: "Internal Server Error",
    };
  }

  const apiData = (await response.json()) as ProductDetail;
  const uiMeta = MOCK_PRODUCT_DETAILS[apiData.id];

  return {
    status: 200,
    data: {
      ...uiMeta,
      ...apiData,
      id: apiData.id,
      name: apiData.name,
      imageUrl: apiData.imageUrl || uiMeta?.imageUrl || FALLBACK_DRINK_IMAGE,
      basePriceVnd: Number(apiData.basePriceVnd),
      isAvailable: Boolean(apiData.isAvailable),
      sizePolicy:
        apiData.sizePolicy ||
        (apiData.sizes?.length === 1 && apiData.sizes[0]?.size === "ONE_SIZE"
          ? "ONE_SIZE"
          : "STANDARD"),
      sizes: Array.isArray(apiData.sizes)
        ? apiData.sizes.map((s) => ({
            size: s.size,
            multiplierPercent: Number(s.multiplierPercent),
          }))
        : [],
      toppings: Array.isArray(apiData.toppings)
        ? apiData.toppings.map((t) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            priceVnd: Number(t.priceVnd),
            isAvailable: t.isAvailable !== false,
          }))
        : [],
    },
  };
}

/**
 * Lấy chi tiết đồ uống theo ID (`GET /products/:id`)
 */
export async function getProductById(
  id: string
): Promise<ProductDetail | null> {
  const result = await fetchProductDetailById(id);
  return result.status === 200 ? result.data : null;
}

/**
 * Tra cứu chi tiết sản phẩm từ Mock Data (giữ lại hỗ trợ fallback / test offline)
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
 * Lấy dữ liệu cấu hình và danh sách sản phẩm mẫu cho trang Thực đơn
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
  const categoryCounts = sortedItems.reduce<Record<string, number>>(
    (acc, item) => {
      const code =
        typeof item.category === "object" && item.category !== null
          ? item.category.code
          : (item.category as string);
      if (code) {
        acc[code] = (acc[code] || 0) + 1;
      }
      return acc;
    },
    {}
  );

  return {
    products: sortedItems,
    categories: MOCK_CATEGORIES.map((cat) => {
      if (cat.id === "all") {
        return { ...cat, label: `Tất cả (${sortedItems.length})` };
      }
      const count = categoryCounts[cat.id] ?? 0;
      return {
        ...cat,
        label: `${cat.label.replace(/\s*\(\d+\)/, "")} (${count})`,
      };
    }),
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
 * Tải dữ liệu trang Thực đơn bất đồng bộ kết nối API thật (`GET /products`)
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

  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    const code =
      typeof item.category === "object" && item.category !== null
        ? item.category.code
        : (item.category as string);
    if (code) {
      acc[code] = (acc[code] || 0) + 1;
    }
    return acc;
  }, {});

  const dynamicCategories: CategoryOption[] = MOCK_CATEGORIES.map((cat) => {
    if (cat.id === "all") {
      return { ...cat, label: `Tất cả (${items.length})` };
    }
    const count = categoryCounts[cat.id] ?? 0;
    return {
      ...cat,
      label: `${cat.label.replace(/\s*\(\d+\)/, "")} (${count})`,
    };
  });

  return {
    products: items,
    categories: dynamicCategories,
    sortOptions: MOCK_SORT_OPTIONS,
    priceFilterOptions: MOCK_PRICE_FILTER_OPTIONS,
    heroBanner: MOCK_HERO_BANNER,
    siteConfig: {
      ...MOCK_SITE_CONFIG,
      totalCatalogCount: items.length,
    },
  };
}

// ============================================================================
// AUTHENTICATION BUSINESS RULES & SESSION SERVICE — SPRINT 2 (SCRUM-41 & CHECKOUT)
// Đối chiếu chuẩn 100% với `docs/api/BrewLite_API_Contract_v2.1.md`:
// - Mục 2.5: JWT TTL 3600s, `tokenType: "Bearer"`, `sub = User UUID`
// - Mục 5.2 & 5.3: `VALIDATION_ERROR` (400), `EMAIL_ALREADY_EXISTS` (409), `INVALID_CREDENTIALS` (401)
// - Mục 6 (`POST /auth/register`) & Mục 7 (`POST /auth/login`)
// - Mục 7.5 & 9.2: Lưu token, giữ nguyên Cart khi login/logout hoặc khi token hết hạn
// ============================================================================

export const AUTH_TOKEN_STORAGE_KEY = "brewlite_access_token";
export const AUTH_USER_STORAGE_KEY = "brewlite_auth_user";
export const AUTH_CHANGED_EVENT = "brewlite:auth-changed";
export const AUTH_OPEN_MODAL_EVENT = "brewlite:open-auth-modal";
export const CHECKOUT_RESUME_EVENT = "brewlite:resume-checkout";

export interface OpenAuthModalEventDetail {
  mode?: AuthMode;
  returnToCheckout?: boolean;
}

// Bộ nhớ tạm trong phiên cho danh sách khách hàng đăng ký (khởi tạo từ MOCK_REGISTERED_USERS)
const sessionRegisteredUsers: MockRegisteredUser[] = [
  ...MOCK_REGISTERED_USERS,
];

/**
 * Chuẩn hóa email theo API Contract v2.1 Mục 6.2 & 7.2: `trim().toLowerCase()`
 */
export function normalizeAuthEmail(rawEmail: string): string {
  return (rawEmail || "").trim().toLowerCase();
}

/**
 * Kiểm tra định dạng email hợp lệ và độ dài tối đa 255 ký tự (API Contract v2.1 Mục 6.2)
 */
export function isValidAuthEmail(normalizedEmail: string): boolean {
  if (
    !normalizedEmail ||
    normalizedEmail.length > AUTH_VALIDATION_RULES.EMAIL_MAX_LENGTH
  ) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}

/**
 * Tạo chuỗi JWT mô phỏng theo chuẩn `header.payload.signature` chứa `sub = userId` và `exp` (+3600s)
 */
function createMockJwtToken(userId: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + AUTH_VALIDATION_RULES.JWT_EXPIRES_IN_SECONDS;
  const encodeBase64Url = (obj: Record<string, unknown>) =>
    typeof window !== "undefined"
      ? window
          .btoa(JSON.stringify(obj))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

  const header = encodeBase64Url({ alg: "HS256", typ: "JWT" });
  const payload = encodeBase64Url({
    sub: userId,
    iat: issuedAt,
    exp: expiresAt,
  });
  return `${header}.${payload}.brewlite-mock-signature`;
}

/**
 * Giải mã payload của JWT để kiểm tra `sub` (User UUID) và `exp` (thời hạn token — Mục 2.5 & 7.5)
 */
export function decodeJwtPayload(
  token: string | null | undefined
): { sub?: string; exp?: number; iat?: number } | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const jsonStr =
      typeof window !== "undefined"
        ? window.atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(jsonStr);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra JWT hiện tại có hợp lệ và chưa hết hạn hay không (API Contract v2.1 Mục 2.5 & 7.5)
 */
export function isJwtTokenValid(token: string | null | undefined): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (typeof payload.sub !== "string" || !isValidUuid(payload.sub)) {
    return false;
  }
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowSeconds;
}

/**
 * Đọc JWT Access Token từ localStorage
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Đọc thông tin User đang đăng nhập từ localStorage
 */
export function getStoredAuthUser(): RegisterResponseDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string"
    ) {
      return {
        id: parsed.id,
        email: parsed.email,
        fullName: typeof parsed.fullName === "string" ? parsed.fullName : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra người dùng đã đăng nhập với JWT còn hiệu lực hay chưa.
 * Nếu token hết hạn, tự động xóa token cũ nhưng GIỮ NGUYÊN Cart (Mục 7.5 & 9.2).
 */
export function isAuthenticatedWithValidJwt(): boolean {
  const token = getStoredAccessToken();
  if (!token) return false;
  if (!isJwtTokenValid(token)) {
    clearAuthSession();
    return false;
  }
  return true;
}

/**
 * Xóa phiên đăng nhập (Logout hoặc khi token hết hạn) mà KHÔNG xóa Cart (Mục 7.5 & 9.1)
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  } catch {
    // Bỏ qua lỗi localStorage
  }
}

/**
 * Phát sự kiện mở màn hình Đăng nhập / Đăng ký (hỗ trợ cờ `returnToCheckout` để sau khi login quay lại Checkout)
 */
export function requestOpenAuthModal(
  detail: OpenAuthModalEventDetail = { mode: "login", returnToCheckout: false }
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenAuthModalEventDetail>(AUTH_OPEN_MODAL_EVENT, { detail })
  );
}

/**
 * Phát sự kiện yêu cầu mở lại màn hình Checkout ngay sau khi đăng nhập thành công
 */
export function notifyResumeCheckoutAfterLogin(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHECKOUT_RESUME_EVENT));
}

function saveAuthSession(
  accessToken: string,
  user: RegisterResponseDto
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage
  }
}

export type AuthRegisterResult =
  | {
      ok: true;
      statusCode: 201;
      requestPayload: RegisterRequestDto;
      data: RegisterResponseDto;
    }
  | {
      ok: false;
      errorResponse: AuthApiErrorResponse;
    };

export type AuthLoginResult =
  | {
      ok: true;
      statusCode: 200;
      requestPayload: LoginRequestDto;
      data: LoginResponseDto;
      user: RegisterResponseDto;
    }
  | {
      ok: false;
      errorResponse: AuthApiErrorResponse;
    };

/**
 * Xử lý nghiệp vụ Đăng ký khách hàng (`POST /auth/register` — API Contract v2.1 Mục 6):
 * - Validate `email` (trim/lowercase, hợp lệ, <= 255 ký tự)
 * - Validate `password` (tối thiểu 8 ký tự, KHÔNG trim/normalize)
 * - Validate `fullName` (optional, <= 255 ký tự)
 * - Ưu tiên gọi API thật `/api/backend/auth/register` và đồng bộ với bộ nhớ phiên
 * - Trả về `201 Created` với `{ id, email, fullName }`; tuyệt đối KHÔNG phát JWT / KHÔNG tự động login
 */
export async function submitRegisterMock(
  input: RegisterRequestDto
): Promise<AuthRegisterResult> {
  const normalizedEmail = normalizeAuthEmail(input.email);
  // Theo API Contract v2.1 Mục 6.2: KHÔNG trim/normalize password trước khi hash
  const rawPassword = typeof input.password === "string" ? input.password : "";
  const trimmedFullName =
    typeof input.fullName === "string" ? input.fullName.trim() : "";

  const validationErrors: string[] = [];

  if (!normalizedEmail) {
    validationErrors.push("Email là bắt buộc.");
  } else if (normalizedEmail.length > AUTH_VALIDATION_RULES.EMAIL_MAX_LENGTH) {
    validationErrors.push(
      `Email không được vượt quá ${AUTH_VALIDATION_RULES.EMAIL_MAX_LENGTH} ký tự.`
    );
  } else if (!isValidAuthEmail(normalizedEmail)) {
    validationErrors.push(
      "Định dạng email không hợp lệ (ví dụ: customer@example.com)."
    );
  }

  if (!rawPassword) {
    validationErrors.push("Mật khẩu là bắt buộc.");
  } else if (rawPassword.length < AUTH_VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    validationErrors.push(
      `Mật khẩu phải có tối thiểu ${AUTH_VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự (theo API Contract v2.1 Mục 6.2).`
    );
  }

  if (trimmedFullName.length > AUTH_VALIDATION_RULES.FULL_NAME_MAX_LENGTH) {
    validationErrors.push(
      `Họ và tên không được vượt quá ${AUTH_VALIDATION_RULES.FULL_NAME_MAX_LENGTH} ký tự.`
    );
  }

  if (validationErrors.length > 0) {
    return {
      ok: false,
      errorResponse: {
        statusCode: 400,
        message: validationErrors,
        error: "Bad Request",
        code: "VALIDATION_ERROR",
      },
    };
  }

  // Chỉ đóng gói đúng 3 trường được phép trong Request Body (không gửi role, loyaltyPoints, passwordHash)
  const sanitizedRequestPayload: RegisterRequestDto = {
    email: normalizedEmail,
    password: rawPassword,
    ...(trimmedFullName ? { fullName: trimmedFullName } : {}),
  };

  // Thử gọi Backend API thật (`POST /auth/register`) trước
  const isBrowser = typeof window !== "undefined";
  const registerUrl = isBrowser
    ? "/api/backend/auth/register"
    : `${API_BASE_URL}/auth/register`;

  try {
    const response = await fetch(registerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(sanitizedRequestPayload),
    });

    if (response.status === 201) {
      const data = (await response.json()) as RegisterResponseDto;
      const existingIdx = sessionRegisteredUsers.findIndex(
        (u) => normalizeAuthEmail(u.email) === normalizedEmail
      );
      const userRecord: MockRegisteredUser = {
        id: data.id,
        email: data.email,
        password: rawPassword,
        fullName: data.fullName ?? (trimmedFullName || null),
      };
      if (existingIdx >= 0) {
        sessionRegisteredUsers[existingIdx] = userRecord;
      } else {
        sessionRegisteredUsers.push(userRecord);
      }
      return {
        ok: true,
        statusCode: 201,
        requestPayload: sanitizedRequestPayload,
        data,
      };
    }

    if (response.status === 409 || response.status === 400) {
      const errJson = await response.json().catch(() => null);
      return {
        ok: false,
        errorResponse: {
          statusCode: response.status as 400 | 409,
          message:
            response.status === 409
              ? "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc chuyển sang Đăng nhập."
              : errJson?.message || "Dữ liệu đăng ký không hợp lệ.",
          error: response.status === 409 ? "Conflict" : "Bad Request",
          code:
            errJson?.code ||
            (response.status === 409
              ? "EMAIL_ALREADY_EXISTS"
              : "VALIDATION_ERROR"),
        },
      };
    }
  } catch {
    // Nếu Backend không phản hồi, fallback sang xử lý Mock nội bộ bên dưới
  }

  await waitDelay(250);

  // Kiểm tra email đã tồn tại trong Mock (409 EMAIL_ALREADY_EXISTS — Mục 6.4)
  const existingUser = sessionRegisteredUsers.find(
    (u) => normalizeAuthEmail(u.email) === normalizedEmail
  );
  if (existingUser) {
    return {
      ok: false,
      errorResponse: {
        statusCode: 409,
        message:
          "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc chuyển sang Đăng nhập.",
        error: "Conflict",
        code: "EMAIL_ALREADY_EXISTS",
      },
    };
  }

  const newUserId = `550e8400-e29b-41d4-a716-${String(
    446655440000 + sessionRegisteredUsers.length + 1
  ).slice(-12)}`;

  const createdUser: MockRegisteredUser = {
    id: newUserId,
    email: normalizedEmail,
    password: rawPassword,
    fullName: trimmedFullName || null,
  };

  sessionRegisteredUsers.push(createdUser);

  return {
    ok: true,
    statusCode: 201,
    requestPayload: sanitizedRequestPayload,
    data: {
      id: createdUser.id,
      email: createdUser.email,
      fullName: createdUser.fullName,
    },
  };
}

/**
 * Xử lý nghiệp vụ Đăng nhập (`POST /auth/login` — API Contract v2.1 Mục 7):
 * - Chuẩn hóa `email` (`trim().toLowerCase()`)
 * - Kiểm tra `password` required, non-empty (KHÔNG trim/normalize password trước khi verify)
 * - Bảo mật: Email không tồn tại và password sai trả CÙNG status `401`, code `INVALID_CREDENTIALS` và message
 * - Thành công trả `200 OK` với `{ accessToken, tokenType: "Bearer", expiresIn: 3600 }`
 * - Lưu token mà KHÔNG xóa giỏ hàng (Cart)
 */
export async function submitLoginMock(
  input: LoginRequestDto
): Promise<AuthLoginResult> {
  const normalizedEmail = normalizeAuthEmail(input.email);
  // Theo API Contract v2.1 Mục 7.2: KHÔNG trim/normalize password trước khi verify
  const rawPassword = typeof input.password === "string" ? input.password : "";

  const validationErrors: string[] = [];

  if (!normalizedEmail) {
    validationErrors.push("Vui lòng nhập email tài khoản.");
  } else if (normalizedEmail.length > AUTH_VALIDATION_RULES.EMAIL_MAX_LENGTH) {
    validationErrors.push(
      `Email không được vượt quá ${AUTH_VALIDATION_RULES.EMAIL_MAX_LENGTH} ký tự.`
    );
  } else if (!isValidAuthEmail(normalizedEmail)) {
    validationErrors.push(
      "Định dạng email không hợp lệ (ví dụ: customer@example.com)."
    );
  }

  if (rawPassword.length === 0) {
    validationErrors.push("Vui lòng nhập mật khẩu.");
  }

  if (validationErrors.length > 0) {
    return {
      ok: false,
      errorResponse: {
        statusCode: 400,
        message: validationErrors,
        error: "Bad Request",
        code: "VALIDATION_ERROR",
      },
    };
  }

  const sanitizedLoginPayload: LoginRequestDto = {
    email: normalizedEmail,
    password: rawPassword,
  };

  const matchedMockUser = sessionRegisteredUsers.find(
    (u) => normalizeAuthEmail(u.email) === normalizedEmail
  );

  // Thử gọi Backend API thật (`POST /auth/login`) trước
  const isBrowser = typeof window !== "undefined";
  const loginUrl = isBrowser
    ? "/api/backend/auth/login"
    : `${API_BASE_URL}/auth/login`;
  const registerUrl = isBrowser
    ? "/api/backend/auth/register"
    : `${API_BASE_URL}/auth/register`;

  try {
    let response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(sanitizedLoginPayload),
    });

    // Nếu người dùng chọn 1 trong 3 tài khoản mẫu (MOCK_REGISTERED_USERS) chưa có trong DB Backend,
    // tự động khởi tạo tài khoản mẫu đó lên Backend rồi login để nhận JWT thật từ Backend
    if (
      response.status === 401 &&
      matchedMockUser &&
      matchedMockUser.password === rawPassword
    ) {
      await fetch(registerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: matchedMockUser.email,
          password: matchedMockUser.password,
          ...(matchedMockUser.fullName
            ? { fullName: matchedMockUser.fullName }
            : {}),
        }),
      }).catch(() => null);

      response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(sanitizedLoginPayload),
      });
    }

    if (response.status === 200) {
      const loginData = (await response.json()) as LoginResponseDto;
      const decoded = decodeJwtPayload(loginData.accessToken);
      const userId =
        decoded?.sub ||
        matchedMockUser?.id ||
        "550e8400-e29b-41d4-a716-446655440000";
      const userObj: RegisterResponseDto = {
        id: userId,
        email: normalizedEmail,
        fullName: matchedMockUser?.fullName ?? null,
      };
      saveAuthSession(loginData.accessToken, userObj);
      return {
        ok: true,
        statusCode: 200,
        requestPayload: sanitizedLoginPayload,
        data: loginData,
        user: userObj,
      };
    }

    if (response.status === 401) {
      return {
        ok: false,
        errorResponse: {
          statusCode: 401,
          message: "Email hoặc mật khẩu không chính xác.",
          error: "Unauthorized",
          code: "INVALID_CREDENTIALS",
        },
      };
    }
  } catch {
    // Fallback sang xác thực Mock bên dưới nếu Backend không bật
  }

  await waitDelay(250);

  // Mục 7.2 & 7.4: Email không tồn tại và password sai phải trả CÙNG status/code/message
  if (!matchedMockUser || matchedMockUser.password !== rawPassword) {
    return {
      ok: false,
      errorResponse: {
        statusCode: 401,
        message: "Email hoặc mật khẩu không chính xác.",
        error: "Unauthorized",
        code: "INVALID_CREDENTIALS",
      },
    };
  }

  const loginResponse: LoginResponseDto = {
    accessToken: createMockJwtToken(matchedMockUser.id),
    tokenType: "Bearer",
    expiresIn: AUTH_VALIDATION_RULES.JWT_EXPIRES_IN_SECONDS,
  };

  const userObj: RegisterResponseDto = {
    id: matchedMockUser.id,
    email: matchedMockUser.email,
    fullName: matchedMockUser.fullName,
  };

  saveAuthSession(loginResponse.accessToken, userObj);

  return {
    ok: true,
    statusCode: 200,
    requestPayload: sanitizedLoginPayload,
    data: loginResponse,
    user: userObj,
  };
}

/**
 * Lấy danh sách các tài khoản mẫu hiện có trong phiên để hỗ trợ Tester kiểm thử nhanh trên UI
 */
export function getMockRegisteredUsers(): MockRegisteredUser[] {
  return [...sessionRegisteredUsers];
}

// ============================================================================
// CREATE ORDER (`POST /orders`) — API CONTRACT v2.1 (MỤC 8 & MỤC 9.3)
// - Yêu cầu JWT Bearer Token (`Authorization: Bearer <JWT_ACCESS_TOKEN>`)
// - Request Body chỉ gồm `{ items: [{ productId, size, toppingIds, quantity }], couponCode? }`
// - Không bao giờ gửi `userId`, `status`, `price`, `unitPriceVnd`, `lineTotalVnd`, `subtotalVnd`, `discountVnd`, `totalVnd`
// - Response 201 Created trả về Order có `status: "PENDING"` (Payment thuộc Sprint 3)
// - Phân loại lỗi theo `code` và `details` (`VALIDATION_ERROR`, `INVALID_CART`, `INVALID_COUPON`, `UNAUTHORIZED`, `INSUFFICIENT_STOCK`, `PENDING_ORDER_EXISTS`)
// ============================================================================

export type SubmitCreateOrderResult =
  | {
      ok: true;
      statusCode: 201;
      requestPayload: CreateOrderRequestDto;
      data: OrderResponseDto;
    }
  | {
      ok: false;
      errorResponse: OrderApiErrorResponse;
    };

const VALID_ORDER_SIZES: readonly DrinkSize[] = [
  "S",
  "M",
  "L",
  "ONE_SIZE",
] as const;

const SIZE_MULTIPLIER_MAP: Record<DrinkSize, number> = {
  S: 100,
  M: 120,
  L: 140,
  ONE_SIZE: 100,
};

/**
 * Danh sách mã giảm giá hợp lệ trong Sprint 2 (API Contract v2.1 Mục 8.2, 8.4, 8.6 & 12):
 * - `WELCOME20`: Giảm 20.000đ (ví dụ chuẩn trong Mục 8.2, 8.6 & 12)
 * - `BREW10`: Giảm 10% trên subtotal
 * - `BREW15K`: Giảm 15.000đ cho đơn từ 50.000đ
 */
const DEMO_COUPONS: Record<
  string,
  {
    type: "FIXED" | "PERCENT";
    value: number;
    minSubtotalVnd: number;
    description: string;
  }
> = {
  WELCOME20: {
    type: "FIXED",
    value: 20000,
    minSubtotalVnd: 0,
    description: "Giảm 20.000đ chào mừng thành viên BrewLite",
  },
  BREW10: {
    type: "PERCENT",
    value: 10,
    minSubtotalVnd: 0,
    description: "Giảm 10% tổng giá trị đồ uống",
  },
  BREW15K: {
    type: "FIXED",
    value: 15000,
    minSubtotalVnd: 50000,
    description: "Giảm 15.000đ cho đơn từ 50.000đ",
  },
};

/**
 * Chuẩn hóa payload `POST /orders` theo đúng API Contract v2.1 Mục 8.2 & 9.3:
 * Loại bỏ hoàn toàn mọi trường cấm (`userId`, `status`, `price`, `total`, ...)
 */
export function buildStrictCreateOrderPayload(
  raw: CreateOrderRequestDto
): CreateOrderRequestDto {
  const cleanItems: CreateOrderItemRequestDto[] = Array.isArray(raw?.items)
    ? raw.items.map((item) => ({
        productId: String(item.productId || "").trim(),
        size: item.size,
        toppingIds: Array.isArray(item.toppingIds)
          ? item.toppingIds.map((id) => String(id || "").trim())
          : [],
        quantity: Math.trunc(Number(item.quantity)),
      }))
    : [];

  const normalizedCoupon =
    typeof raw?.couponCode === "string" && raw.couponCode.trim().length > 0
      ? raw.couponCode.trim().toUpperCase()
      : undefined;

  return {
    items: cleanItems,
    ...(normalizedCoupon ? { couponCode: normalizedCoupon } : {}),
  };
}

/**
 * Tra cứu thông tin Product & Topping phục vụ tính toán snapshot `POST /orders`
 * khi Backend chưa merge `OrdersModule` hoặc đang chạy chế độ độc lập
 */
async function resolveProductForOrderValidation(
  productId: string
): Promise<ProductDetail | null> {
  // Ưu tiên gọi `GET /products/:id` để lấy dữ liệu mới nhất từ PostgreSQL
  const detailRes = await fetchProductDetailById(productId);
  if (detailRes.status === 200) {
    return detailRes.data;
  }

  // Fallback sang Mock / Cached Catalog nếu cần
  if (MOCK_PRODUCT_DETAILS[productId]) {
    return MOCK_PRODUCT_DETAILS[productId];
  }

  const cachedItem = cachedCatalogProducts.find((p) => p.id === productId);
  if (cachedItem) {
    const isOneSize =
      typeof cachedItem.category === "object" &&
      cachedItem.category?.code === "bakery";
    return {
      ...cachedItem,
      sizePolicy: isOneSize ? "ONE_SIZE" : "STANDARD",
      sizes: isOneSize
        ? [{ size: "ONE_SIZE", multiplierPercent: 100 }]
        : [
            { size: "S", multiplierPercent: 100 },
            { size: "M", multiplierPercent: 120 },
            { size: "L", multiplierPercent: 140 },
          ],
      toppings: isOneSize ? [] : MOCK_TOPPINGS,
    };
  }

  return null;
}

/**
 * Gọi `POST /orders` để tạo đơn hàng trạng thái `PENDING` từ giỏ hàng hiện tại.
 * Tuân thủ nghiêm ngặt 100% API Contract v2.1 (Mục 8.1 -> 8.7 & Mục 9.3):
 * 1. Kiểm tra JWT hợp lệ trước khi gửi; nếu thiếu/hết hạn trả `401 UNAUTHORIZED` (giữ nguyên Cart).
 * 2. Chỉ gửi `{ items: [{ productId, size, toppingIds, quantity }], couponCode? }` kèm header `Authorization: Bearer <token>`.
 * 3. Gọi tới `/api/backend/orders` (`http://localhost:3001/orders`).
 * 4. Nếu Backend trả về kết quả (`201`, `400`, `401`, `409`, `500`), sử dụng trực tiếp phản hồi của Backend.
 * 5. Nếu Backend chưa gắn route `/orders` (`404 Cannot POST /orders`), thực thi bộ kiểm tra & tính giá chuẩn Mục 8.3 (`ORD-CAT-01…08`) để trả về `OrderResponseDto` (`status: "PENDING"`).
 */
export async function submitCreateOrder(
  rawPayload: CreateOrderRequestDto
): Promise<SubmitCreateOrderResult> {
  // 1. Kiểm tra JWT Bearer Token (API Contract v2.1 Mục 8.1, 8.7 & 9.2)
  const accessToken = getStoredAccessToken();
  if (!accessToken || !isJwtTokenValid(accessToken)) {
    clearAuthSession();
    return {
      ok: false,
      errorResponse: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    };
  }

  // 2. Chuẩn hóa payload nghiêm ngặt theo Mục 8.2 & 9.3
  const requestPayload = buildStrictCreateOrderPayload(rawPayload);

  // 3. Gọi API Backend `POST /orders` với Header `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  const isBrowser = typeof window !== "undefined";
  const primaryOrderUrl = isBrowser
    ? "/api/backend/orders"
    : `${API_BASE_URL}/orders`;

  try {
    const response = await fetch(primaryOrderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (response.status === 201) {
      const orderData = (await response.json()) as OrderResponseDto;
      return {
        ok: true,
        statusCode: 201,
        requestPayload,
        data: orderData,
      };
    }

    // Nếu Backend trả về các mã lỗi chuẩn của Mục 8.7 (400, 401, 409, 500)
    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 409 ||
      response.status >= 500
    ) {
      const errBody = await response.json().catch(() => null);
      if (response.status === 401) {
        clearAuthSession();
      }
      return {
        ok: false,
        errorResponse: {
          statusCode: (response.status >= 500
            ? 500
            : response.status) as 400 | 401 | 409 | 500,
          message:
            errBody?.message ||
            (response.status === 401
              ? "Unauthorized"
              : "Không thể tạo đơn hàng."),
          error:
            errBody?.error ||
            (response.status === 401
              ? "Unauthorized"
              : response.status === 409
                ? "Conflict"
                : response.status === 400
                  ? "Bad Request"
                  : "Internal Server Error"),
          code:
            (errBody?.code as OrderErrorCode | undefined) ||
            (response.status === 401 ? "UNAUTHORIZED" : undefined),
          details: Array.isArray(errBody?.details)
            ? errBody.details
            : undefined,
        },
      };
    }
  } catch {
    // Nếu không kết nối được, chuyển sang bước mô phỏng chuẩn API Contract v2.1 bên dưới
  }

  // 4. Thực thi đầy đủ quy tắc kiểm tra & tính giá Server-Side theo API Contract v2.1 Mục 8.3 & ORD-CAT-01…08
  await waitDelay(350);

  // 4.1. Kiểm tra DTO shape (`VALIDATION_ERROR` — Mục 8.2 & 8.7)
  const dtoErrors: string[] = [];
  if (
    !Array.isArray(requestPayload.items) ||
    requestPayload.items.length < 1 ||
    requestPayload.items.length > 20
  ) {
    dtoErrors.push("items must contain between 1 and 20 elements");
  } else {
    requestPayload.items.forEach((item, idx) => {
      if (!isValidUuid(item.productId)) {
        dtoErrors.push(`items[${idx}].productId must be a UUID`);
      }
      if (!VALID_ORDER_SIZES.includes(item.size)) {
        dtoErrors.push(
          `items[${idx}].size must be one of the following values: S, M, L, ONE_SIZE`
        );
      }
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < MIN_ORDER_QUANTITY ||
        item.quantity > MAX_ORDER_QUANTITY
      ) {
        dtoErrors.push(`items[${idx}].quantity must be between 1 and 10`);
      }
      if (!Array.isArray(item.toppingIds)) {
        dtoErrors.push(`items[${idx}].toppingIds must be an array`);
      } else {
        item.toppingIds.forEach((tid, tIdx) => {
          if (!isValidUuid(tid)) {
            dtoErrors.push(`items[${idx}].toppingIds[${tIdx}] must be a UUID`);
          }
        });
      }
    });
  }

  if (dtoErrors.length > 0) {
    return {
      ok: false,
      errorResponse: {
        statusCode: 400,
        message: dtoErrors,
        error: "Bad Request",
        code: "VALIDATION_ERROR",
      },
    };
  }

  // 4.2. Kiểm tra quy tắc Product Catalog Validation Matrix (ORD-CAT-01…08 — Mục 8.3.1)
  const invalidCartDetails: InvalidCartDetail[] = [];
  const insufficientStockDetails: InsufficientStockDetail[] = [];
  const snapshotItems: OrderItemSnapshotDto[] = [];

  for (let i = 0; i < requestPayload.items.length; i++) {
    const reqItem = requestPayload.items[i];

    // ORD-CAT-07: Kiểm tra trùng topping hoặc quá 3 topping
    if (reqItem.toppingIds.length > MAX_TOPPINGS_PER_ITEM) {
      invalidCartDetails.push({
        itemIndex: i,
        reason: "TOO_MANY_TOPPINGS",
      });
      continue;
    }
    const uniqueToppingSet = new Set(reqItem.toppingIds);
    if (uniqueToppingSet.size !== reqItem.toppingIds.length) {
      invalidCartDetails.push({
        itemIndex: i,
        reason: "DUPLICATE_TOPPING",
      });
      continue;
    }

    // ORD-CAT-01: Product phải tồn tại
    const productDetail = await resolveProductForOrderValidation(
      reqItem.productId
    );
    if (!productDetail) {
      invalidCartDetails.push({
        itemIndex: i,
        reason: "PRODUCT_NOT_FOUND",
      });
      continue;
    }

    // ORD-CAT-02: Category active & stock > 0
    const isCatInactive =
      typeof productDetail.category === "object" &&
      productDetail.category !== null &&
      productDetail.category.isActive === false;
    if (isCatInactive) {
      invalidCartDetails.push({
        itemIndex: i,
        reason: "PRODUCT_UNAVAILABLE",
      });
      continue;
    }

    if (!productDetail.isAvailable) {
      insufficientStockDetails.push({
        productId: reqItem.productId,
        requestedQuantity: reqItem.quantity,
        availableQuantity: 0,
      });
      continue;
    }

    // ORD-CAT-03 & ORD-CAT-04: Kiểm tra size theo sizePolicy
    const policy =
      productDetail.sizePolicy ||
      (productDetail.sizes?.length === 1 &&
      productDetail.sizes[0]?.size === "ONE_SIZE"
        ? "ONE_SIZE"
        : "STANDARD");

    if (
      (policy === "STANDARD" && reqItem.size === "ONE_SIZE") ||
      (policy === "ONE_SIZE" && reqItem.size !== "ONE_SIZE")
    ) {
      invalidCartDetails.push({
        itemIndex: i,
        reason: "INVALID_SIZE",
      });
      continue;
    }

    const matchedSizeOption = productDetail.sizes?.find(
      (s) => s.size === reqItem.size
    );
    const sizeMultiplierPercent =
      matchedSizeOption?.multiplierPercent ??
      SIZE_MULTIPLIER_MAP[reqItem.size] ??
      100;

    // ORD-CAT-05 & ORD-CAT-06: Kiểm tra từng toppingId thuộc product_toppings và isAvailable = true
    const allowedToppingsMap = new Map(
      (productDetail.toppings || []).map((t) => [t.id, t])
    );
    const globalToppingsMap = new Map(MOCK_TOPPINGS.map((t) => [t.id, t]));

    const itemToppingSnapshots: { id: string; name: string; priceVnd: number }[] =
      [];
    let toppingFailed = false;

    for (const tid of reqItem.toppingIds) {
      const allowedTop = allowedToppingsMap.get(tid);
      if (!allowedTop) {
        const existsGlobally = globalToppingsMap.has(tid);
        invalidCartDetails.push({
          itemIndex: i,
          reason: existsGlobally ? "TOPPING_NOT_ALLOWED" : "TOPPING_NOT_FOUND",
        });
        toppingFailed = true;
        break;
      }
      if (allowedTop.isAvailable === false) {
        invalidCartDetails.push({
          itemIndex: i,
          reason: "TOPPING_UNAVAILABLE",
        });
        toppingFailed = true;
        break;
      }
      itemToppingSnapshots.push({
        id: allowedTop.id,
        name: allowedTop.name,
        priceVnd: allowedTop.priceVnd,
      });
    }

    if (toppingFailed) continue;

    // ORD-CAT-08 & Mục 8.3: Tính lại giá từ dữ liệu sản phẩm trên server (floor)
    const basePriceVnd = Number(productDetail.basePriceVnd);
    const unitPriceVnd = calculateUnitPriceVnd(
      basePriceVnd,
      sizeMultiplierPercent,
      itemToppingSnapshots
    );
    const lineTotalVnd = calculateLineTotalVnd(unitPriceVnd, reqItem.quantity);

    snapshotItems.push({
      id: `550e8400-e29b-41d4-a716-${String(446655440010 + i + 1).slice(-12)}`,
      productId: productDetail.id,
      productName: productDetail.name,
      size: reqItem.size,
      sizeMultiplierPercent,
      basePriceVnd,
      quantity: reqItem.quantity,
      unitPriceVnd,
      lineTotalVnd,
      toppings: itemToppingSnapshots,
    });
  }

  if (invalidCartDetails.length > 0) {
    return {
      ok: false,
      errorResponse: {
        statusCode: 400,
        message: invalidCartDetails.map(
          (d) => `Invalid cart item at index ${d.itemIndex} (${d.reason})`
        ),
        error: "Bad Request",
        code: "INVALID_CART",
        details: invalidCartDetails,
      },
    };
  }

  if (insufficientStockDetails.length > 0) {
    return {
      ok: false,
      errorResponse: {
        statusCode: 409,
        message: "Insufficient product stock",
        error: "Conflict",
        code: "INSUFFICIENT_STOCK",
        details: insufficientStockDetails,
      },
    };
  }

  // 4.3. Tính subtotalVnd, kiểm tra couponCode (nếu có) và tính discountVnd, totalVnd (Mục 8.3 & 8.4)
  const subtotalVnd = snapshotItems.reduce(
    (sum, item) => sum + item.lineTotalVnd,
    0
  );

  let discountVnd = 0;
  let appliedCouponCode: string | null = null;

  if (requestPayload.couponCode) {
    const couponRule = DEMO_COUPONS[requestPayload.couponCode];
    if (!couponRule || subtotalVnd < couponRule.minSubtotalVnd) {
      return {
        ok: false,
        errorResponse: {
          statusCode: 400,
          message: !couponRule
            ? `Mã khuyến mãi "${requestPayload.couponCode}" không tồn tại hoặc đã hết hiệu lực.`
            : `Mã "${requestPayload.couponCode}" yêu cầu đơn hàng tối thiểu ${formatVnd(couponRule.minSubtotalVnd)}.`,
          error: "Bad Request",
          code: "INVALID_COUPON",
        },
      };
    }

    appliedCouponCode = requestPayload.couponCode;
    if (couponRule.type === "FIXED") {
      discountVnd = Math.min(subtotalVnd, couponRule.value);
    } else {
      discountVnd = Math.min(
        subtotalVnd,
        Math.floor((subtotalVnd * couponRule.value) / 100)
      );
    }
  }

  const totalVnd = Math.max(0, subtotalVnd - discountVnd);

  const createdOrder: OrderResponseDto = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `550e8400-e29b-41d4-a716-${String(Date.now()).slice(-12)}`,
    status: "PENDING",
    items: snapshotItems,
    couponCode: appliedCouponCode,
    subtotalVnd,
    discountVnd,
    totalVnd,
    createdAt: new Date().toISOString(),
  };

  return {
    ok: true,
    statusCode: 201,
    requestPayload,
    data: createdOrder,
  };
}
