// ============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES / INTERFACES) CHO BREWLITE FRONTEND
// Đối chiếu chuẩn 100% với:
// - docs/api/BrewLite_API_Contract_v2.1.md (Mục 2, 3, 4, 5, 6, 7, 8, 9)
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

// ============================================================================
// KIỂU DỮ LIỆU AUTHENTICATION (LOGIN & REGISTER) — API CONTRACT v2.1 (MỤC 5, 6, 7)
// ============================================================================

export type AuthMode = "login" | "register";

/**
 * Mã lỗi nghiệp vụ Sprint 2 cho Authentication (API Contract v2.1 Mục 5.3)
 */
export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED";

/**
 * Cấu trúc lỗi mở rộng Sprint 2 có trường `code` (API Contract v2.1 Mục 5.2)
 */
export interface AuthApiErrorResponse {
  statusCode: 400 | 401 | 409 | 500;
  message: string | string[];
  error: "Bad Request" | "Unauthorized" | "Conflict" | "Internal Server Error";
  code?: AuthErrorCode;
}

/**
 * Request body của `POST /auth/register` (API Contract v2.1 Mục 6.2):
 * - `email`: bắt buộc, định dạng email hợp lệ, trim/lowercase, tối đa 255 ký tự
 * - `password`: bắt buộc, tối thiểu 8 ký tự (KHÔNG trim/normalize trước khi hash)
 * - `fullName`: không bắt buộc, tối đa 255 ký tự
 * - Tuyệt đối không gửi `role`, `loyaltyPoints`, `passwordHash`
 */
export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Response 201 Created của `POST /auth/register` (API Contract v2.1 Mục 6.3):
 * - Chỉ trả `id`, `email`, `fullName`
 * - Không tự động login hoặc trả `accessToken`, `password`, `passwordHash`, `role`, `loyaltyPoints`
 */
export interface RegisterResponseDto {
  id: string;
  email: string;
  fullName: string | null;
}

/**
 * Request body của `POST /auth/login` (API Contract v2.1 Mục 7.2):
 * - `email`: bắt buộc, chuẩn hóa trim/lowercase
 * - `password`: bắt buộc, non-empty (KHÔNG trim/normalize trước khi verify)
 */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * Response 200 OK của `POST /auth/login` (API Contract v2.1 Mục 7.3):
 * - `accessToken`: JWT chứa `sub = User UUID`
 * - `tokenType`: `"Bearer"`
 * - `expiresIn`: `3600` (60 phút)
 */
export interface LoginResponseDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: 3600;
}

/**
 * Bản ghi tài khoản mẫu trong Mock Data phục vụ kiểm thử UI Login / Register (SCRUM-41)
 */
export interface MockRegisteredUser {
  id: string;
  email: string;
  password: string;
  fullName: string | null;
  note?: string;
}

/**
 * Cấu hình nội dung giao diện trang Đăng nhập & Đăng ký theo thiết kế Stitch
 */
export interface AuthUiConfig {
  brandTitle: string;
  brandHighlight: string;
  backToMenuLabel: string;
  roastBadge: string;
  loginHeading: string;
  loginSubheading: string;
  registerHeading: string;
  registerSubheading: string;
  emailMaxLength: number;
  fullNameMaxLength: number;
  passwordMinLength: number;
  jwtExpiresInSeconds: 3600;
  trustNote: string;
  footerCopyright: string;
}

// ============================================================================
// KIỂU DỮ LIỆU CREATE ORDER (`POST /orders`) — API CONTRACT v2.1 (MỤC 8 & MỤC 9)
// ============================================================================

/**
 * Từng dòng món trong Request Body của `POST /orders` (API Contract v2.1 Mục 8.2):
 * - `productId`: UUID string (bắt buộc)
 * - `size`: S | M | L | ONE_SIZE theo sizePolicy (bắt buộc)
 * - `toppingIds`: UUID string[] (bắt buộc, 0–3 ID khác nhau)
 * - `quantity`: integer 1–10 (bắt buộc)
 */
export interface CreateOrderItemRequestDto {
  productId: string;
  size: DrinkSize;
  toppingIds: string[];
  quantity: number;
}

/**
 * Request Body của `POST /orders` (API Contract v2.1 Mục 8.2 & 9.3):
 * - `items`: 1–20 dòng
 * - `couponCode`: tùy chọn, tối đa 1 mã, trim, normalize
 * - Client tuyệt đối KHÔNG gửi `userId`, `status`, `price`, `unitPriceVnd`, `lineTotalVnd`, `subtotalVnd`, `discountVnd`, `totalVnd`
 */
export interface CreateOrderRequestDto {
  items: CreateOrderItemRequestDto[];
  couponCode?: string;
}

/**
 * Snapshot Topping trong Response 201 Created của `POST /orders` (API Contract v2.1 Mục 8.6)
 */
export interface OrderItemToppingSnapshotDto {
  id: string;
  name: string;
  priceVnd: number;
}

/**
 * Snapshot từng dòng món trong Response 201 Created của `POST /orders` (API Contract v2.1 Mục 8.6)
 */
export interface OrderItemSnapshotDto {
  id: string;
  productId: string;
  productName: string;
  size: DrinkSize;
  sizeMultiplierPercent: number;
  basePriceVnd: number;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  toppings: OrderItemToppingSnapshotDto[];
}

/**
 * Response 201 Created của `POST /orders` (API Contract v2.1 Mục 8.6):
 * - `status`: luôn là `"PENDING"` (chưa tạo Payment ở Sprint 2)
 * - `couponCode`: string hoặc null
 * - `subtotalVnd`, `discountVnd`, `totalVnd`: giá do server tính toán
 * - `createdAt`: ISO 8601 UTC
 */
export interface OrderResponseDto {
  id: string;
  status: "PENDING";
  items: OrderItemSnapshotDto[];
  couponCode: string | null;
  subtotalVnd: number;
  discountVnd: number;
  totalVnd: number;
  createdAt: string;
}

/**
 * Mã lỗi nghiệp vụ của `POST /orders` theo API Contract v2.1 Mục 5.3 & 8.7
 */
export type OrderErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CART"
  | "INVALID_COUPON"
  | "UNAUTHORIZED"
  | "INSUFFICIENT_STOCK"
  | "PENDING_ORDER_EXISTS";

/**
 * Lý do chi tiết khi `code === "INVALID_CART"` (API Contract v2.1 Mục 8.3.1 & 8.7)
 */
export type InvalidCartReason =
  | "DUPLICATE_CONFIGURATION"
  | "DUPLICATE_TOPPING"
  | "PRODUCT_NOT_FOUND"
  | "TOPPING_NOT_FOUND"
  | "PRODUCT_UNAVAILABLE"
  | "INVALID_SIZE"
  | "TOPPING_NOT_ALLOWED"
  | "TOPPING_UNAVAILABLE"
  | "TOO_MANY_TOPPINGS"
  | "INVALID_PRICE_DATA";

export interface InsufficientStockDetail {
  productId: string;
  requestedQuantity: number;
  availableQuantity: number;
}

export interface InvalidCartDetail {
  itemIndex: number;
  reason: InvalidCartReason | string;
}

/**
 * Cấu trúc lỗi trả về từ `POST /orders` (API Contract v2.1 Mục 8.7):
 * Frontend không parse text `message` để suy luận loại lỗi; dùng `code` và `details`.
 */
export interface OrderApiErrorResponse {
  statusCode: 400 | 401 | 409 | 500;
  message: string | string[];
  error: string;
  code?: OrderErrorCode;
  details?: Array<
    InsufficientStockDetail | InvalidCartDetail | Record<string, unknown>
  >;
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
