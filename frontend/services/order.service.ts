import {
  type CreateOrderItemDto,
  type CreateOrderRequestDto,
  type CreateOrderResponseDto,
  type DrinkSize,
  type InsufficientStockDetail,
  type InvalidCartDetail,
  type OrderErrorCode,
} from "@/mock-data";
import {
  API_BASE_URL,
  formatVnd,
  isValidUuid,
  MAX_ORDER_QUANTITY,
  MAX_TOPPINGS_PER_ITEM,
  MIN_ORDER_QUANTITY,
} from "./api.service";
import {
  clearStoredSession,
  getStoredToken,
  validateJwtToken,
} from "./auth.service";

// ============================================================================
// ORDER & CHECKOUT SERVICE — SPRINT 2 & 3 (SCRUM-43)
// Đối chiếu chuẩn 100% với:
// - docs/api/BrewLite_API_Contract_v3.0.md & Appendix A (v2.1 Mục 5.3, 8, 9)
// - database/schema.dbml & backend/prisma/schema.prisma
// - backend/src/orders/orders.controller.ts & orders.service.ts
//
// Nguyên tắc bất biến:
// 1. Chỉ gửi { items: [{ productId, size, toppingIds, quantity }], couponCode? }
//    TUYỆT ĐỐI KHÔNG gửi userId, status, price, unitPriceVnd, lineTotalVnd,
//    subtotalVnd, discountVnd, totalVnd hay pointsEarned từ Client.
// 2. Bắt buộc gửi kèm header Authorization: Bearer <JWT_ACCESS_TOKEN>.
// 3. Phân loại lỗi dựa trên machine-readable `code` và `details` (không parse text `message`).
// 4. Khi gặp 401 UNAUTHORIZED (hoặc token hết hạn): xóa phiên Auth nhưng BẢO LƯU GIỎ HÀNG.
// 5. Khi tạo Order PENDING (201 Created): BẢO LƯU GIỎ HÀNG (chỉ xóa Cart sau khi Payment SUCCESS ở Sprint 3).
// ============================================================================

export const MAX_ORDER_ITEMS = 20;
export const MAX_COUPON_CODE_LENGTH = 30;
export const ACTIVE_PENDING_ORDER_STORAGE_KEY = "brewlite_pending_order_v1";

const VALID_DRINK_SIZES: readonly DrinkSize[] = [
  "S",
  "M",
  "L",
  "ONE_SIZE",
] as const;

export interface OrderServiceError extends Error {
  statusCode: number;
  code: OrderErrorCode | string;
  details?: InvalidCartDetail[] | InsufficientStockDetail[] | unknown;
}

export interface FormattedOrderError {
  statusCode: number;
  code: OrderErrorCode | string;
  title: string;
  description: string;
  detailLines: string[];
  isUnauthorized: boolean;
  isCouponError: boolean;
  isCartError: boolean;
  isStockError: boolean;
  isPendingOrderConflict: boolean;
  isServerError: boolean;
  isNetworkError: boolean;
}

function createOrderError(
  message: string,
  statusCode: number,
  code: OrderErrorCode | string,
  details?: unknown
): OrderServiceError {
  const err = new Error(message) as OrderServiceError;
  err.statusCode = statusCode;
  err.code = code;
  if (details !== undefined) {
    err.details = details;
  }
  return err;
}

/**
 * Chuẩn hóa mã khuyến mãi (couponCode):
 * - Trim khoảng trắng hai đầu và chuyển thành chữ IN HOA (theo schema.dbml & CreateOrderDto).
 * - Nếu sau khi trim là chuỗi rỗng, trả về undefined để không gửi chuỗi rỗng lên Backend.
 */
export function normalizeCouponCode(
  couponCode?: string | null
): string | undefined {
  if (typeof couponCode !== "string") return undefined;
  const trimmed = couponCode.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Kiểm tra định dạng mã khuyến mãi phía Client trước khi gửi:
 * - Không bắt buộc (rỗng hoặc chỉ chứa khoảng trắng -> hợp lệ, normalized = undefined).
 * - Không được chứa khoảng trắng ở giữa (chỉ cho phép tối đa 1 mã coupon theo AC-US-PRO-01-03).
 * - Độ dài từ 1 đến 30 ký tự (theo database/schema.dbml varchar(30) & CreateOrderDto).
 */
export function validateCouponCodeInput(couponCode?: string | null): {
  isValid: boolean;
  normalized?: string;
  error?: string;
  code?: OrderErrorCode;
} {
  if (typeof couponCode !== "string") {
    return { isValid: true, normalized: undefined };
  }

  const trimmed = couponCode.trim();
  if (trimmed.length === 0) {
    return { isValid: true, normalized: undefined };
  }

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error:
        "Mỗi đơn hàng chỉ được áp dụng tối đa 1 mã khuyến mãi (không chứa khoảng trắng).",
      code: "VALIDATION_ERROR",
    };
  }

  if (trimmed.length > MAX_COUPON_CODE_LENGTH) {
    return {
      isValid: false,
      error: `Mã khuyến mãi không được vượt quá ${MAX_COUPON_CODE_LENGTH} ký tự.`,
      code: "VALIDATION_ERROR",
    };
  }

  return {
    isValid: true,
    normalized: trimmed.toUpperCase(),
  };
}

/**
 * Chuẩn hóa nghiêm ngặt payload gửi lên `POST /orders` theo API Contract v2.1 Mục 8.2 & 9.3:
 * - Loại bỏ mọi trường cấm (userId, status, price, unitPriceVnd, lineTotalVnd, subtotalVnd, discountVnd, totalVnd)
 * - Trim và lowercase UUID (productId, toppingIds)
 * - Trim và uppercase couponCode (bỏ qua nếu rỗng)
 */
export function sanitizeCreateOrderPayload(
  raw: CreateOrderRequestDto
): CreateOrderRequestDto {
  const cleanItems: CreateOrderItemDto[] = Array.isArray(raw?.items)
    ? raw.items.map((item) => ({
        productId:
          typeof item?.productId === "string"
            ? item.productId.trim().toLowerCase()
            : "",
        size: item?.size,
        toppingIds: Array.isArray(item?.toppingIds)
          ? item.toppingIds.map((id) =>
              typeof id === "string" ? id.trim().toLowerCase() : ""
            )
          : [],
        quantity:
          typeof item?.quantity === "number" && Number.isFinite(item.quantity)
            ? Math.trunc(item.quantity)
            : Number(item?.quantity),
      }))
    : [];

  const normalizedCoupon = normalizeCouponCode(raw?.couponCode);

  return {
    items: cleanItems,
    ...(normalizedCoupon ? { couponCode: normalizedCoupon } : {}),
  };
}

/**
 * Kiểm tra tính hợp lệ của payload `CreateOrderRequestDto` trước khi gọi API
 */
export function validateCreateOrderPayload(raw: CreateOrderRequestDto): {
  isValid: boolean;
  payload?: CreateOrderRequestDto;
  error?: OrderServiceError;
} {
  if (!raw || !Array.isArray(raw.items) || raw.items.length === 0) {
    return {
      isValid: false,
      error: createOrderError(
        "Giỏ hàng đang trống. Vui lòng chọn ít nhất 1 món trước khi đặt hàng.",
        400,
        "INVALID_CART"
      ),
    };
  }

  if (raw.items.length > MAX_ORDER_ITEMS) {
    return {
      isValid: false,
      error: createOrderError(
        `Đơn hàng chỉ cho phép tối đa ${MAX_ORDER_ITEMS} dòng sản phẩm.`,
        400,
        "VALIDATION_ERROR"
      ),
    };
  }

  const couponValidation = validateCouponCodeInput(raw.couponCode);
  if (!couponValidation.isValid) {
    return {
      isValid: false,
      error: createOrderError(
        couponValidation.error || "Mã khuyến mãi không hợp lệ.",
        400,
        couponValidation.code || "VALIDATION_ERROR"
      ),
    };
  }

  const sanitized = sanitizeCreateOrderPayload(raw);
  const seenConfigKeys = new Set<string>();

  for (let i = 0; i < sanitized.items.length; i++) {
    const item = sanitized.items[i];

    if (!item.productId || !isValidUuid(item.productId)) {
      return {
        isValid: false,
        error: createOrderError(
          `Mã sản phẩm ở dòng ${i + 1} không đúng định dạng UUID.`,
          400,
          "VALIDATION_ERROR"
        ),
      };
    }

    if (!VALID_DRINK_SIZES.includes(item.size)) {
      return {
        isValid: false,
        error: createOrderError(
          `Kích cỡ sản phẩm ở dòng ${i + 1} không hợp lệ.`,
          400,
          "VALIDATION_ERROR"
        ),
      };
    }

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < MIN_ORDER_QUANTITY ||
      item.quantity > MAX_ORDER_QUANTITY
    ) {
      return {
        isValid: false,
        error: createOrderError(
          `Số lượng mỗi dòng sản phẩm phải là số nguyên từ ${MIN_ORDER_QUANTITY} đến ${MAX_ORDER_QUANTITY}.`,
          400,
          "VALIDATION_ERROR"
        ),
      };
    }

    if (!Array.isArray(item.toppingIds)) {
      return {
        isValid: false,
        error: createOrderError(
          `Danh sách topping ở dòng ${i + 1} không hợp lệ.`,
          400,
          "VALIDATION_ERROR"
        ),
      };
    }

    if (item.toppingIds.some((tid) => !tid || !isValidUuid(tid))) {
      return {
        isValid: false,
        error: createOrderError(
          `Mã topping ở dòng ${i + 1} không đúng định dạng UUID.`,
          400,
          "VALIDATION_ERROR"
        ),
      };
    }

    if (item.toppingIds.length > MAX_TOPPINGS_PER_ITEM) {
      return {
        isValid: false,
        error: createOrderError(
          `Mỗi dòng sản phẩm chỉ được chọn tối đa ${MAX_TOPPINGS_PER_ITEM} loại topping.`,
          400,
          "INVALID_CART",
          [{ productId: item.productId, itemIndex: i, reason: "TOO_MANY_TOPPINGS" }]
        ),
      };
    }

    if (new Set(item.toppingIds).size !== item.toppingIds.length) {
      return {
        isValid: false,
        error: createOrderError(
          "Không được chọn trùng lặp cùng một loại topping trong 1 dòng món.",
          400,
          "INVALID_CART",
          [{ productId: item.productId, itemIndex: i, reason: "DUPLICATE_TOPPING" }]
        ),
      };
    }

    const configKey = `${item.productId}_${item.size}_[${[...item.toppingIds]
      .sort()
      .join(",")}]`;
    if (seenConfigKeys.has(configKey)) {
      return {
        isValid: false,
        error: createOrderError(
          "Giỏ hàng có hai dòng trùng cấu hình sản phẩm, kích cỡ và topping.",
          400,
          "INVALID_CART",
          [
            {
              productId: item.productId,
              itemIndex: i,
              reason: "DUPLICATE_CONFIGURATION",
            },
          ]
        ),
      };
    }
    seenConfigKeys.add(configKey);
  }

  return {
    isValid: true,
    payload: sanitized,
  };
}

/**
 * Mô tả tiếng Việt cho từng mã `details[].reason` của lỗi `INVALID_CART`
 * (Tuân thủ API Contract v2.1 Mục 8.3.1 & 8.7: chỉ dựa vào `code` và `details[].reason`, không parse text `message`)
 */
export function describeInvalidCartReason(reason: string): string {
  switch (reason) {
    case "PRODUCT_NOT_FOUND":
      return "Sản phẩm không còn tồn tại trong danh mục phục vụ (ORD-CAT-01).";
    case "PRODUCT_UNAVAILABLE":
      return "Sản phẩm hoặc danh mục của sản phẩm hiện đang tạm ngừng phục vụ (ORD-CAT-02).";
    case "INVALID_SIZE":
      return "Kích cỡ đã chọn không tương thích với chính sách kích cỡ (sizePolicy) của sản phẩm (ORD-CAT-03/04).";
    case "TOPPING_NOT_FOUND":
      return "Topping đã chọn không tồn tại trên hệ thống (ORD-CAT-05).";
    case "TOPPING_NOT_ALLOWED":
      return "Topping đã chọn không áp dụng cho sản phẩm này (ORD-CAT-05).";
    case "TOPPING_UNAVAILABLE":
      return "Topping đã chọn hiện đang tạm hết hàng (ORD-CAT-06).";
    case "DUPLICATE_TOPPING":
      return "Có topping bị chọn trùng lặp trong cùng một món (ORD-CAT-07).";
    case "TOO_MANY_TOPPINGS":
      return "Số lượng topping vượt quá giới hạn tối đa 3 loại/món (ORD-CAT-07).";
    case "DUPLICATE_CONFIGURATION":
      return "Có các dòng sản phẩm trùng lặp cùng cấu hình kích cỡ và topping.";
    case "INVALID_PRICE_DATA":
      return "Dữ liệu giá của sản phẩm không hợp lệ khi đối chiếu máy chủ (ORD-CAT-08).";
    default:
      return "Cấu hình món trong giỏ hàng không còn hợp lệ.";
  }
}

/**
 * Phân tích lỗi trả về từ `createOrderApi` dựa hoàn toàn vào `code`, `statusCode` và `details`
 * theo đúng API Contract v2.1 Mục 5.3, 8.3.1, 8.7 & v3.0.
 */
export function formatOrderError(
  err: unknown,
  cartItems: Array<{ productId: string; productName: string }> = []
): FormattedOrderError {
  const errorObj = (err || {}) as Partial<OrderServiceError>;
  const statusCode =
    typeof errorObj.statusCode === "number" ? errorObj.statusCode : 500;
  const code =
    typeof errorObj.code === "string" && errorObj.code.trim()
      ? errorObj.code.trim()
      : statusCode === 401
      ? "UNAUTHORIZED"
      : statusCode === 409
      ? "PENDING_ORDER_EXISTS"
      : statusCode === 400
      ? "VALIDATION_ERROR"
      : statusCode === 503
      ? "NETWORK_ERROR"
      : "SERVER_ERROR";

  const findProductName = (productId?: string, itemIndex?: number): string => {
    if (productId) {
      const normalizedId = productId.trim().toLowerCase();
      const found = cartItems.find(
        (c) => c.productId.trim().toLowerCase() === normalizedId
      );
      if (found) return found.productName;
    }
    if (
      typeof itemIndex === "number" &&
      itemIndex >= 0 &&
      itemIndex < cartItems.length
    ) {
      return cartItems[itemIndex].productName;
    }
    return productId ? `Sản phẩm (${productId.slice(0, 8)}...)` : "Món trong giỏ";
  };

  if (code === "UNAUTHORIZED" || statusCode === 401) {
    return {
      statusCode: 401,
      code: "UNAUTHORIZED",
      title: "Phiên đăng nhập đã hết hạn hoặc chưa xác thực",
      description:
        "Vui lòng đăng nhập lại để tiếp tục đặt hàng. Toàn bộ giỏ hàng của bạn vẫn được giữ nguyên.",
      detailLines: [],
      isUnauthorized: true,
      isCouponError: false,
      isCartError: false,
      isStockError: false,
      isPendingOrderConflict: false,
      isServerError: false,
      isNetworkError: false,
    };
  }

  if (code === "INSUFFICIENT_STOCK") {
    const details = Array.isArray(errorObj.details)
      ? (errorObj.details as InsufficientStockDetail[])
      : [];
    const detailLines = details.map((d) => {
      const name = findProductName(d.productId);
      const reqQty =
        typeof d.requestedQuantity === "number" ? d.requestedQuantity : "?";
      const availQty =
        typeof d.availableQuantity === "number" ? d.availableQuantity : 0;
      return `${name}: Yêu cầu ${reqQty} phần nhưng kho chỉ còn ${availQty} phần.`;
    });

    return {
      statusCode: 409,
      code: "INSUFFICIENT_STOCK",
      title: "Số lượng tồn kho không đủ",
      description:
        "Một số sản phẩm trong giỏ hàng hiện không đủ số lượng tồn kho tại quầy. Vui lòng giảm số lượng hoặc đổi món khác.",
      detailLines,
      isUnauthorized: false,
      isCouponError: false,
      isCartError: false,
      isStockError: true,
      isPendingOrderConflict: false,
      isServerError: false,
      isNetworkError: false,
    };
  }

  if (code === "PENDING_ORDER_EXISTS") {
    return {
      statusCode: 409,
      code: "PENDING_ORDER_EXISTS",
      title: "Bạn đang có đơn hàng chờ thanh toán",
      description:
        "Tài khoản của bạn hiện đã có một đơn hàng ở trạng thái PENDING hoặc PAYMENT_FAILED chưa hoàn tất. Theo quy tắc hệ thống, mỗi khách hàng chỉ có tối đa 1 đơn hàng chưa thanh toán tại một thời điểm.",
      detailLines: [],
      isUnauthorized: false,
      isCouponError: false,
      isCartError: false,
      isStockError: false,
      isPendingOrderConflict: true,
      isServerError: false,
      isNetworkError: false,
    };
  }

  if (code === "INVALID_COUPON" || code === "COUPON_UNAVAILABLE") {
    return {
      statusCode: statusCode === 409 ? 409 : 400,
      code,
      title: "Mã khuyến mãi không thể áp dụng",
      description:
        "Mã khuyến mãi không tồn tại, chưa đến thời gian áp dụng, đã hết hạn, chưa đạt giá trị đơn tối thiểu hoặc đã hết lượt sử dụng. Vui lòng kiểm tra hoặc xóa mã khuyến mãi để tiếp tục.",
      detailLines: [],
      isUnauthorized: false,
      isCouponError: true,
      isCartError: false,
      isStockError: false,
      isPendingOrderConflict: false,
      isServerError: false,
      isNetworkError: false,
    };
  }

  if (code === "INVALID_CART") {
    const details = Array.isArray(errorObj.details)
      ? (errorObj.details as InvalidCartDetail[])
      : [];
    const detailLines = details.map((d) => {
      const name = findProductName(d.productId, d.itemIndex);
      const reasonDesc = describeInvalidCartReason(String(d.reason || ""));
      return `${name}: ${reasonDesc}`;
    });

    return {
      statusCode: 400,
      code: "INVALID_CART",
      title: "Dữ liệu giỏ hàng cần cập nhật",
      description:
        "Một số món hoặc tùy chọn kích cỡ/topping trong giỏ hàng không còn hợp lệ theo thực đơn máy chủ. Giỏ hàng vẫn được giữ nguyên để bạn chỉnh sửa.",
      detailLines,
      isUnauthorized: false,
      isCouponError: false,
      isCartError: true,
      isStockError: false,
      isPendingOrderConflict: false,
      isServerError: false,
      isNetworkError: false,
    };
  }

  if (code === "VALIDATION_ERROR") {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      title: "Dữ liệu yêu cầu đặt hàng không hợp lệ",
      description:
        errorObj.message ||
        "Định dạng dữ liệu giỏ hàng hoặc mã khuyến mãi chưa đúng quy chuẩn (1–20 dòng, mỗi dòng 1–10 ly, tối đa 3 topping).",
      detailLines: [],
      isUnauthorized: false,
      isCouponError: false,
      isCartError: true,
      isStockError: false,
      isPendingOrderConflict: false,
      isServerError: false,
      isNetworkError: false,
    };
  }

  if (code === "NETWORK_ERROR" || statusCode === 503) {
    return {
      statusCode: 503,
      code: "NETWORK_ERROR",
      title: "Không thể kết nối đến máy chủ",
      description:
        "Không thể kết nối đến máy chủ Backend (POST /orders). Vui lòng kiểm tra kết nối mạng hoặc dịch vụ Backend và thử lại. Giỏ hàng của bạn được giữ nguyên.",
      detailLines: [],
      isUnauthorized: false,
      isCouponError: false,
      isCartError: false,
      isStockError: false,
      isPendingOrderConflict: false,
      isServerError: false,
      isNetworkError: true,
    };
  }

  return {
    statusCode: statusCode >= 500 ? statusCode : 500,
    code: "SERVER_ERROR",
    title: "Sự cố máy chủ khi tạo đơn hàng",
    description:
      "Máy chủ đang gặp sự cố ngoài dự kiến và đã hoàn tác (rollback) giao dịch an toàn. Vui lòng thử lại sau ít phút.",
    detailLines: [],
    isUnauthorized: false,
    isCouponError: false,
    isCartError: false,
    isStockError: false,
    isPendingOrderConflict: false,
    isServerError: true,
    isNetworkError: false,
  };
}

/**
 * Kiểm tra cấu trúc dữ liệu `CreateOrderResponseDto` trả về từ máy chủ (HTTP 201 Created)
 */
function validateOrderResponseData(data: unknown): CreateOrderResponseDto {
  if (!data || typeof data !== "object") {
    throw createOrderError(
      "Phản hồi đơn hàng từ máy chủ không hợp lệ.",
      500,
      "SERVER_ERROR"
    );
  }

  const record = data as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    !record.id.trim() ||
    typeof record.status !== "string" ||
    !Array.isArray(record.items) ||
    typeof record.subtotalVnd !== "number" ||
    !Number.isSafeInteger(record.subtotalVnd) ||
    typeof record.discountVnd !== "number" ||
    !Number.isSafeInteger(record.discountVnd) ||
    typeof record.totalVnd !== "number" ||
    !Number.isSafeInteger(record.totalVnd) ||
    typeof record.createdAt !== "string"
  ) {
    throw createOrderError(
      "Dữ liệu snapshot đơn hàng trả về từ máy chủ không đầy đủ.",
      500,
      "SERVER_ERROR"
    );
  }

  return {
    id: record.id.trim(),
    status: record.status as CreateOrderResponseDto["status"],
    items: record.items.map((rawItem: unknown) => {
      const item = (rawItem || {}) as Record<string, unknown>;
      const toppings = Array.isArray(item.toppings)
        ? item.toppings.map((rawTop: unknown) => {
            const top = (rawTop || {}) as Record<string, unknown>;
            return {
              id: String(top.id || ""),
              name: String(top.name || ""),
              priceVnd: Number(top.priceVnd || 0),
            };
          })
        : [];
      return {
        id: String(item.id || ""),
        productId: String(item.productId || ""),
        productName: String(item.productName || ""),
        size: (item.size as DrinkSize) || "S",
        sizeMultiplierPercent: Number(item.sizeMultiplierPercent || 100),
        basePriceVnd: Number(item.basePriceVnd || 0),
        quantity: Number(item.quantity || 1),
        unitPriceVnd: Number(item.unitPriceVnd || 0),
        lineTotalVnd: Number(item.lineTotalVnd || 0),
        toppings,
      };
    }),
    couponCode:
      typeof record.couponCode === "string" && record.couponCode.trim()
        ? record.couponCode.trim()
        : null,
    subtotalVnd: record.subtotalVnd,
    discountVnd: record.discountVnd,
    totalVnd: record.totalVnd,
    createdAt: record.createdAt,
  };
}

/**
 * Gọi API `POST /orders` tới Backend thật để tạo đơn hàng `PENDING` từ giỏ hàng hiện tại.
 * - Kiểm tra chặt chẽ JWT trước khi gửi request.
 * - Chỉ gửi `{ items: [{ productId, size, toppingIds, quantity }], couponCode? }`.
 * - Tuyệt đối không tạo đơn hàng giả ở phía Client khi Backend lỗi.
 */
export async function createOrderApi(
  rawPayload: CreateOrderRequestDto,
  tokenOverride?: string | null
): Promise<CreateOrderResponseDto> {
  // 1. Kiểm tra JWT token hợp lệ và chưa hết hạn trước khi gửi request
  const candidateToken = tokenOverride || getStoredToken();
  if (!candidateToken) {
    clearStoredSession();
    throw createOrderError(
      "Vui lòng đăng nhập để tiến hành đặt hàng.",
      401,
      "UNAUTHORIZED"
    );
  }

  try {
    validateJwtToken(candidateToken);
  } catch {
    clearStoredSession();
    throw createOrderError(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
      401,
      "UNAUTHORIZED"
    );
  }

  // 2. Validate và chuẩn hóa payload nghiêm ngặt theo API Contract v2.1 Mục 8.2 & 9.3
  const validation = validateCreateOrderPayload(rawPayload);
  if (!validation.isValid || !validation.payload) {
    throw (
      validation.error ||
      createOrderError(
        "Dữ liệu đơn hàng không hợp lệ.",
        400,
        "VALIDATION_ERROR"
      )
    );
  }

  const sanitizedPayload = validation.payload;

  // 3. Gửi request tới Backend `POST /orders`
  const isBrowser = typeof window !== "undefined";
  const primaryUrl = isBrowser
    ? "/api/backend/orders"
    : `${API_BASE_URL}/orders`;
  const fallbackUrl = isBrowser
    ? `${API_BASE_URL}/orders`
    : "/api/backend/orders";

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${candidateToken.trim()}`,
    },
    body: JSON.stringify(sanitizedPayload),
    cache: "no-store",
  };

  let response: Response;
  try {
    response = await fetch(primaryUrl, requestInit);
  } catch {
    try {
      response = await fetch(fallbackUrl, requestInit);
    } catch {
      throw createOrderError(
        "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ.",
        503,
        "NETWORK_ERROR"
      );
    }
  }

  // 4. Xử lý thành công HTTP 201 Created
  if (response.status === 201 || response.ok) {
    const rawData = await response.json().catch(() => null);
    return validateOrderResponseData(rawData);
  }

  // 5. Xử lý các mã lỗi HTTP từ Backend (400, 401, 409, 5xx)
  const errorData = await response.json().catch(() => null);
  const is5xx = response.status >= 500 && response.status <= 599;

  if (response.status === 401 || errorData?.code === "UNAUTHORIZED") {
    // Token hết hạn hoặc user không còn tồn tại: xóa phiên Auth nhưng BẢO LƯU GIỎ HÀNG
    clearStoredSession();
    throw createOrderError(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
      401,
      "UNAUTHORIZED",
      errorData?.details
    );
  }

  const resolvedCode: OrderErrorCode | string =
    typeof errorData?.code === "string" && errorData.code.trim()
      ? errorData.code.trim()
      : response.status === 409
      ? "PENDING_ORDER_EXISTS"
      : response.status === 400
      ? "VALIDATION_ERROR"
      : is5xx
      ? "SERVER_ERROR"
      : "SERVER_ERROR";

  const rawMessage = Array.isArray(errorData?.message)
    ? errorData.message.join(", ")
    : typeof errorData?.message === "string" && errorData.message.trim()
    ? errorData.message.trim()
    : is5xx
    ? "Máy chủ đang gặp sự cố khi xử lý đơn hàng."
    : `Không thể tạo đơn hàng (HTTP ${response.status}).`;

  throw createOrderError(
    rawMessage,
    response.status,
    resolvedCode,
    errorData?.details
  );
}

/**
 * Định dạng thời gian tạo đơn hàng (ISO 8601 UTC) sang chuỗi hiển thị tiếng Việt
 */
export function formatOrderTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Tính thời điểm hết hạn dự kiến (+15 phút từ createdAt theo database/schema.dbml & FR-ORD-007)
 */
export function calculateOrderExpiresAtDisplay(createdAtIso: string): string {
  try {
    const created = new Date(createdAtIso);
    if (Number.isNaN(created.getTime())) return "15 phút sau khi tạo";
    const expires = new Date(created.getTime() + 15 * 60 * 1000);
    return expires.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "15 phút sau khi tạo";
  }
}

export { formatVnd };
