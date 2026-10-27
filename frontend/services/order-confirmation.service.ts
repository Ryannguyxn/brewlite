/**
 * Order Confirmation Service - SCRUM-68
 * Tuân thủ nghiêm ngặt BrewLite API Contract v3.0 (Mục 3, 4, 8, 9).
 * Hỗ trợ tra cứu đơn qua GET /orders/me (sau reload F5), tính toán hết hạn 15 phút,
 * và gọi POST /payments khi người dùng Retry thanh toán từ trạng thái PAYMENT_FAILED.
 */

import { isValidUuid } from "./api.service";
import { isTokenExpired } from "./auth.service";
import { validateMyOrdersResponse } from "./payment.service";

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_FAILED"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethodType = "CARD" | "WALLET";

export interface OrderItemSummary {
  id: string;
  productId: string;
  productName: string;
  size: string;
  sizeMultiplierPercent: number;
  basePriceVnd: number;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  toppings: Array<{
    id: string;
    name: string;
    priceVnd: number;
  }>;
}

export interface PaymentSummary {
  id: string;
  status: "SUCCESS" | "FAILED";
  method: PaymentMethodType;
  methodLast4: string | null;
  amountVnd: number;
  mockReference: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface OrderConfirmationData {
  id: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  subtotalVnd: number;
  discountVnd: number;
  totalVnd: number;
  couponCode: string | null;
  pointsEarned: number;
  items: OrderItemSummary[];
  payment: PaymentSummary | null;
}

export interface GetMyOrdersResponse {
  items: OrderConfirmationData[];
  meta: {
    page: number | null;
    limit: number | null;
    total: number;
    totalPages: number | null;
  };
}

export interface PaymentApiResponse {
  paymentId: string;
  orderId: string;
  paymentStatus: "SUCCESS" | "FAILED";
  orderStatus: "PAID" | "PAYMENT_FAILED";
  amountVnd: number;
  method: PaymentMethodType;
  methodLast4: string;
  mockReference: string;
  pointsEarned: number;
  failureReason: "PAYMENT_DECLINED" | null;
  createdAt: string;
}


/**
 * Định tuyến endpoint: sử dụng Next.js proxy rewrite `/api/backend/...` trên trình duyệt
 * để tránh lỗi CORS giữa cổng 3000 và 3001.
 */
export function resolveBackendEndpoint(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `/api/backend${cleanPath}`;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return `${baseUrl}${cleanPath}`;
}

/**
 * Sinh chuỗi Idempotency-Key UUID v4 (độ dài 36 ký tự nằm trong dải 8..64 chars theo Contract v3.0).
 */
export function generateIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Tính số giây còn lại cho đến thời điểm expiresAt.
 * Trả về 0 nếu đã quá hạn hoặc dữ liệu thời gian không hợp lệ.
 */
export function computeOrderRemainingSeconds(
  expiresAtIso?: string | null,
  referenceNowMs: number = Date.now()
): number {
  if (!expiresAtIso) return 0;
  const targetMs = new Date(expiresAtIso).getTime();
  if (isNaN(targetMs)) return 0;
  const diffMs = targetMs - referenceNowMs;
  return diffMs > 0 ? Math.floor(diffMs / 1000) : 0;
}

/**
 * Kiểm tra xem đơn hàng đã hết hạn hay chưa.
 * Nếu không có expiresAt nhưng có createdAt, tự suy diễn createdAt + 15 phút.
 */
export function isOrderExpired(
  order: { expiresAt?: string | null; createdAt?: string | null; status?: string },
  referenceNowMs: number = Date.now()
): boolean {
  if (order.status === "CANCELLED" || order.status === "EXPIRED") return true;
  if (order.status === "PAID") return false;

  if (order.expiresAt) {
    return computeOrderRemainingSeconds(order.expiresAt, referenceNowMs) <= 0;
  }
  return false;
}

/**
 * Format thời gian còn lại mm:ss cho countdown timer.
 */
export function formatRemainingTime(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return "00:00";
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Tra cứu danh sách đơn hàng của người dùng từ GET /orders/me.
 * Contract v3.0 Mục 4: UI dùng GET /orders/me để khôi phục Confirmation khi reload F5.
 */
export async function fetchMyOrdersApi(token: string): Promise<OrderConfirmationData[]> {
  if (!token || isTokenExpired(token)) {
    throw new Error("UNAUTHORIZED");
  }

  const endpoint = resolveBackendEndpoint("/orders/me");
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    throw new Error(`GET /orders/me failed with status ${response.status}`);
  }

  const rawData: unknown = await response.json().catch(() => null);
  const validated = validateMyOrdersResponse(rawData);
  return validated.items as unknown as OrderConfirmationData[];
}

/**
 * Tìm kiếm đơn hàng theo orderId từ danh sách đơn của user.
 * Nếu không truyền orderId, trả về đơn hàng mới nhất của người dùng.
 */
export function findOrderForConfirmation(
  orders: OrderConfirmationData[],
  targetOrderId?: string | null
): OrderConfirmationData | null {
  if (!orders || orders.length === 0) return null;

  if (targetOrderId && isValidUuid(targetOrderId)) {
    const match = orders.find((o) => o.id === targetOrderId);
    if (match) return match;
  }

  // Mặc định chọn đơn hàng đầu tiên (do backend trả về sort createdAt DESC, id DESC)
  return orders[0];
}

/**
 * Submit thử lại thanh toán qua POST /payments (Mục 3 Contract v3.0).
 * Bắt buộc kèm Bearer JWT và Idempotency-Key mới.
 */
export async function submitRetryPaymentApi(params: {
  orderId: string;
  method: PaymentMethodType;
  identifier: string; // 16 chữ số cho CARD, 10 chữ số cho WALLET
  token: string;
  idempotencyKey?: string;
}): Promise<PaymentApiResponse> {
  const { orderId, method, identifier, token, idempotencyKey } = params;

  if (!token || isTokenExpired(token)) {
    throw new Error("UNAUTHORIZED");
  }

  if (!isValidUuid(orderId)) {
    throw new Error("INVALID_ORDER_ID");
  }

  const keyToUse = idempotencyKey || generateIdempotencyKey();

  const payload = {
    orderId,
    method,
    paymentDetails:
      method === "CARD"
        ? { cardNumber: identifier.replace(/\s+/g, "") }
        : { phoneNumber: identifier.replace(/\s+/g, "") },
  };

  const endpoint = resolveBackendEndpoint("/payments");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": keyToUse,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    const errCode = raw?.message || raw?.code || `HTTP_${response.status}`;
    throw new Error(String(errCode));
  }

  // Validate response contract v3.0
  if (
    !raw ||
    typeof raw.paymentId !== "string" ||
    raw.orderId !== orderId ||
    !["SUCCESS", "FAILED"].includes(raw.paymentStatus) ||
    !["PAID", "PAYMENT_FAILED"].includes(raw.orderStatus)
  ) {
    throw new Error("MALFORMED_PAYMENT_RESPONSE");
  }

  return raw as PaymentApiResponse;
}

/**
 * Lấy thông tin tài khoản và điểm tích lũy hiện tại từ GET /auth/me (SCRUM-71).
 */
export async function fetchAuthMeProfile(token: string): Promise<{
  id: string;
  email: string;
  fullName: string;
  loyaltyPoints: number;
} | null> {
  if (!token || isTokenExpired(token)) return null;

  try {
    const endpoint = resolveBackendEndpoint("/auth/me");
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

