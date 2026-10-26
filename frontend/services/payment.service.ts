import type {
  AuthMeResponseDto,
  CreatePaymentRequestDto,
  GetMyOrdersResponseDto,
  MyOrderDto,
  PaymentErrorCode,
  PaymentMethod,
  PaymentResponseDto,
  PaymentSubmissionErrorState,
} from "@/mock-data";
import { API_BASE_URL, isValidUuid } from "./api.service";
import {
  clearStoredSession,
  getStoredToken,
  isTokenExpired,
} from "./auth.service";

// ============================================================================
// PAYMENT SERVICE — SPRINT 3 (SCRUM-67 / API CONTRACT v3.0 MỤC 3, 4, 8 & 9)
// Kết nối 100% dữ liệu thật với Backend API:
// - POST /payments (Header: Authorization: Bearer <JWT>, Idempotency-Key: <8..64 ký tự>)
// - GET /orders/me (Tải Order & Payment snapshots thật từ PostgreSQL)
// - GET /auth/me (Tải thông tin khách hàng & điểm tích lũy thật từ PostgreSQL)
//
// Nguyên tắc bắt buộc (API Contract v3.0):
// 1. Header `Authorization: Bearer <JWT>` & `Idempotency-Key: <8..64 ký tự>` (required).
// 2. Payload chỉ gồm `{ orderId, method, paymentDetails }` (CARD: `{ cardNumber: 16 chữ số }`,
//    WALLET: `{ phoneNumber: 10 chữ số }`). Tuyệt đối không gửi `userId`, `amount`, `status`, `pointsEarned`, `role`.
// 3. HTTP 200 trả về cho cả SUCCESS và FAILED từ Backend kèm header `Idempotency-Replayed: true|false`.
// 4. Khi `PAYMENT_IN_PROGRESS` (409) hoặc lỗi mạng/timeout: cho phép retry CÙNG `Idempotency-Key`.
// 5. Khi `FAILED` (`paymentStatus: "FAILED"`, `orderStatus: "PAYMENT_FAILED"`):
//    KHÔNG xóa Cart; lần thử thanh toán mới phải tạo `Idempotency-Key` mới.
// 6. Chỉ xóa Cart sau khi `paymentStatus === "SUCCESS"` (`orderStatus === "PAID"`).
// ============================================================================

export const MIN_IDEMPOTENCY_KEY_LENGTH = 8;
export const MAX_IDEMPOTENCY_KEY_LENGTH = 64;
export const CARD_NUMBER_REGEX = /^[0-9]{16}$/;
export const WALLET_PHONE_REGEX = /^[0-9]{10}$/;

export interface PaymentServiceError extends Error {
  statusCode: number;
  code: PaymentErrorCode | string;
  canRetrySameKey: boolean;
  shouldGenerateNewKey: boolean;
  idempotencyKey: string;
}

function createPaymentError(
  message: string,
  statusCode: number,
  code: PaymentErrorCode | string,
  idempotencyKey: string,
  options?: { canRetrySameKey?: boolean; shouldGenerateNewKey?: boolean }
): PaymentServiceError {
  const err = new Error(message) as PaymentServiceError;
  err.statusCode = statusCode;
  err.code = code;
  err.idempotencyKey = idempotencyKey;
  err.canRetrySameKey =
    options?.canRetrySameKey ??
    (code === "PAYMENT_IN_PROGRESS" ||
      code === "NETWORK_ERROR" ||
      statusCode >= 500);
  err.shouldGenerateNewKey =
    options?.shouldGenerateNewKey ?? code === "IDEMPOTENCY_KEY_CONFLICT";
  return err;
}

/**
 * Sinh `Idempotency-Key` hợp lệ (8..64 ký tự) cho mỗi lần thử thanh toán mới (API Contract v3.0 Mục 3.1, 3.2 & 9).
 */
export function generateIdempotencyKey(prefix = "idem"): string {
  const cleanPrefix =
    prefix.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12) || "idem";
  const randomPartA = Math.random().toString(36).substring(2, 10);
  const randomPartB = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  const candidate = `${cleanPrefix}-${timePart}-${randomPartA}${randomPartB}`;
  return candidate.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH);
}

/**
 * Kiểm tra `Idempotency-Key` tuân thủ độ dài 8..64 ký tự (API Contract v3.0 Mục 3.1 & `IdempotencyKeyPipe`).
 */
export function validateIdempotencyKey(key: unknown): {
  isValid: boolean;
  normalizedKey: string;
  errorMessage?: string;
} {
  if (typeof key !== "string") {
    return {
      isValid: false,
      normalizedKey: "",
      errorMessage: "Idempotency-Key bắt buộc phải là chuỗi ký tự (8–64 ký tự).",
    };
  }
  if (
    key.length < MIN_IDEMPOTENCY_KEY_LENGTH ||
    key.length > MAX_IDEMPOTENCY_KEY_LENGTH
  ) {
    return {
      isValid: false,
      normalizedKey: key,
      errorMessage: `Idempotency-Key phải có độ dài từ ${MIN_IDEMPOTENCY_KEY_LENGTH} đến ${MAX_IDEMPOTENCY_KEY_LENGTH} ký tự (hiện tại: ${key.length} ký tự).`,
    };
  }
  return {
    isValid: true,
    normalizedKey: key,
  };
}

/**
 * Xây dựng và chuẩn hóa payload `CreatePaymentRequestDto` đúng 100% API Contract v3.0 Mục 3.1:
 * - Chỉ giữ lại `orderId` (lowercase UUID), `method` ("CARD" | "WALLET"), và `paymentDetails`.
 * - Loại bỏ tuyệt đối mọi trường phía Client (`userId`, `amount`, `amountVnd`, `status`, `pointsEarned`, `role`, v.v.).
 * - Đảm bảo `paymentDetails` chỉ chứa duy nhất `cardNumber` (khi `method === "CARD"`) hoặc `phoneNumber` (khi `method === "WALLET"`).
 */
export function buildCreatePaymentPayload(input: {
  orderId: string;
  method: PaymentMethod;
  cardNumber?: string;
  phoneNumber?: string;
}): CreatePaymentRequestDto {
  const normalizedOrderId =
    typeof input.orderId === "string" ? input.orderId.trim().toLowerCase() : "";

  if (input.method === "CARD") {
    const cleanCard =
      typeof input.cardNumber === "string" ? input.cardNumber.trim() : "";
    return {
      orderId: normalizedOrderId,
      method: "CARD",
      paymentDetails: {
        cardNumber: cleanCard,
      },
    };
  }

  const cleanPhone =
    typeof input.phoneNumber === "string" ? input.phoneNumber.trim() : "";
  return {
    orderId: normalizedOrderId,
    method: "WALLET",
    paymentDetails: {
      phoneNumber: cleanPhone,
    },
  };
}

/**
 * Kiểm tra tính hợp lệ của `CreatePaymentRequestDto` theo đúng `CreatePaymentPipe` ở Backend và API Contract v3.0 Mục 3.1.
 */
export function validateCreatePaymentPayload(
  rawPayload: unknown,
  idempotencyKey = ""
): {
  isValid: boolean;
  payload?: CreatePaymentRequestDto;
  error?: PaymentServiceError;
} {
  if (
    !rawPayload ||
    typeof rawPayload !== "object" ||
    Array.isArray(rawPayload)
  ) {
    return {
      isValid: false,
      error: createPaymentError(
        "Dữ liệu thanh toán không hợp lệ (body phải là object).",
        400,
        "VALIDATION_ERROR",
        idempotencyKey,
        { canRetrySameKey: false }
      ),
    };
  }

  const record = rawPayload as Record<string, unknown>;
  const rawOrderId =
    typeof record.orderId === "string"
      ? record.orderId.trim().toLowerCase()
      : "";

  if (!rawOrderId || !isValidUuid(rawOrderId)) {
    return {
      isValid: false,
      error: createPaymentError(
        "Mã đơn hàng (orderId) phải là UUID hợp lệ.",
        400,
        "VALIDATION_ERROR",
        idempotencyKey,
        { canRetrySameKey: false }
      ),
    };
  }

  if (record.method !== "CARD" && record.method !== "WALLET") {
    return {
      isValid: false,
      error: createPaymentError(
        "Phương thức thanh toán (method) chỉ chấp nhận CARD hoặc WALLET.",
        400,
        "VALIDATION_ERROR",
        idempotencyKey,
        { canRetrySameKey: false }
      ),
    };
  }

  const details = record.paymentDetails;
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {
      isValid: false,
      error: createPaymentError(
        "Thông tin chi tiết thanh toán (paymentDetails) bắt buộc phải là object.",
        400,
        "VALIDATION_ERROR",
        idempotencyKey,
        { canRetrySameKey: false }
      ),
    };
  }

  const detailsRecord = details as Record<string, unknown>;

  if (record.method === "CARD") {
    if ("phoneNumber" in detailsRecord) {
      return {
        isValid: false,
        error: createPaymentError(
          "Khi chọn phương thức CARD, paymentDetails chỉ được chứa cardNumber (không được gửi phoneNumber).",
          400,
          "VALIDATION_ERROR",
          idempotencyKey,
          { canRetrySameKey: false }
        ),
      };
    }

    const cardNumber =
      typeof detailsRecord.cardNumber === "string"
        ? detailsRecord.cardNumber.trim()
        : "";
    if (!CARD_NUMBER_REGEX.test(cardNumber)) {
      return {
        isValid: false,
        error: createPaymentError(
          "Số thẻ thanh toán (cardNumber) bắt buộc phải gồm đúng 16 chữ số (0–9).",
          400,
          "VALIDATION_ERROR",
          idempotencyKey,
          { canRetrySameKey: false }
        ),
      };
    }

    return {
      isValid: true,
      payload: {
        orderId: rawOrderId,
        method: "CARD",
        paymentDetails: { cardNumber },
      },
    };
  }

  if ("cardNumber" in detailsRecord) {
    return {
      isValid: false,
      error: createPaymentError(
        "Khi chọn phương thức WALLET, paymentDetails chỉ được chứa phoneNumber (không được gửi cardNumber).",
        400,
        "VALIDATION_ERROR",
        idempotencyKey,
        { canRetrySameKey: false }
      ),
    };
  }

  const phoneNumber =
    typeof detailsRecord.phoneNumber === "string"
      ? detailsRecord.phoneNumber.trim()
      : "";
  if (!WALLET_PHONE_REGEX.test(phoneNumber)) {
    return {
      isValid: false,
      error: createPaymentError(
        "Số điện thoại ví điện tử (phoneNumber) bắt buộc phải gồm đúng 10 chữ số (0–9).",
        400,
        "VALIDATION_ERROR",
        idempotencyKey,
        { canRetrySameKey: false }
      ),
    };
  }

  return {
    isValid: true,
    payload: {
      orderId: rawOrderId,
      method: "WALLET",
      paymentDetails: { phoneNumber },
    },
  };
}

/**
 * Kiểm tra cấu trúc dữ liệu phản hồi `PaymentResponseDto` từ `POST /payments` (API Contract v3.0 Mục 3.3).
 */
export function validatePaymentResponseData(
  raw: unknown,
  idempotencyKey = ""
): PaymentResponseDto {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw createPaymentError(
      "Phản hồi từ máy chủ thanh toán không đúng định dạng object.",
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  const r = raw as Record<string, unknown>;
  const paymentId = typeof r.paymentId === "string" ? r.paymentId.trim() : "";
  const orderId = typeof r.orderId === "string" ? r.orderId.trim() : "";
  const paymentStatus = r.paymentStatus;
  const orderStatus = r.orderStatus;
  const amountVnd = Number(r.amountVnd);
  const method = r.method;
  const methodLast4 =
    typeof r.methodLast4 === "string" ? r.methodLast4.trim() : "";
  const mockReference =
    typeof r.mockReference === "string" ? r.mockReference.trim() : "";
  const pointsEarned = Number(r.pointsEarned);
  const failureReason = r.failureReason;
  const createdAt = typeof r.createdAt === "string" ? r.createdAt.trim() : "";

  if (!paymentId || !orderId) {
    throw createPaymentError(
      "Phản hồi thanh toán thiếu paymentId hoặc orderId.",
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (paymentStatus !== "SUCCESS" && paymentStatus !== "FAILED") {
    throw createPaymentError(
      `Trạng thái paymentStatus không hợp lệ: ${String(paymentStatus)}.`,
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (orderStatus !== "PAID" && orderStatus !== "PAYMENT_FAILED") {
    throw createPaymentError(
      `Trạng thái orderStatus không hợp lệ: ${String(orderStatus)}.`,
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (
    (paymentStatus === "SUCCESS" && orderStatus !== "PAID") ||
    (paymentStatus === "FAILED" && orderStatus !== "PAYMENT_FAILED")
  ) {
    throw createPaymentError(
      "Cặp trạng thái paymentStatus và orderStatus trong phản hồi không đồng nhất.",
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (method !== "CARD" && method !== "WALLET") {
    throw createPaymentError(
      `Phương thức method trong phản hồi không hợp lệ: ${String(method)}.`,
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (!/^[0-9]{4}$/.test(methodLast4)) {
    throw createPaymentError(
      "Trường methodLast4 phải gồm đúng 4 chữ số.",
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (
    !Number.isFinite(amountVnd) ||
    !Number.isSafeInteger(amountVnd) ||
    amountVnd < 0
  ) {
    throw createPaymentError(
      "Số tiền amountVnd trong phản hồi không hợp lệ.",
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (
    !Number.isFinite(pointsEarned) ||
    !Number.isSafeInteger(pointsEarned) ||
    pointsEarned < 0
  ) {
    throw createPaymentError(
      "Điểm thưởng pointsEarned trong phản hồi không hợp lệ.",
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (failureReason !== null && failureReason !== "PAYMENT_DECLINED") {
    throw createPaymentError(
      `Trường failureReason không hợp lệ: ${String(failureReason)}.`,
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  if (!mockReference || !createdAt) {
    throw createPaymentError(
      "Phản hồi thanh toán thiếu mockReference hoặc createdAt.",
      502,
      "INTERNAL_ERROR",
      idempotencyKey,
      { canRetrySameKey: true }
    );
  }

  return {
    paymentId,
    orderId,
    paymentStatus,
    orderStatus,
    amountVnd,
    method,
    methodLast4,
    mockReference,
    pointsEarned,
    failureReason,
    createdAt,
  };
}

/**
 * Chuyển đổi lỗi khi gọi `POST /payments` sang `PaymentSubmissionErrorState` có thông điệp tiếng Việt rõ ràng
 * theo bảng mã lỗi API Contract v3.0 Mục 3.4.
 */
export function toPaymentSubmissionErrorState(
  err: unknown,
  fallbackIdempotencyKey = ""
): PaymentSubmissionErrorState {
  const payErr = err as Partial<PaymentServiceError>;
  const statusCode =
    typeof payErr?.statusCode === "number" ? payErr.statusCode : 500;
  const code =
    typeof payErr?.code === "string" && payErr.code.trim()
      ? payErr.code.trim()
      : "INTERNAL_ERROR";
  const idempotencyKey =
    typeof payErr?.idempotencyKey === "string" && payErr.idempotencyKey
      ? payErr.idempotencyKey
      : fallbackIdempotencyKey;

  const canRetrySameKey =
    typeof payErr?.canRetrySameKey === "boolean"
      ? payErr.canRetrySameKey
      : code === "PAYMENT_IN_PROGRESS" ||
        code === "NETWORK_ERROR" ||
        statusCode >= 500;

  const shouldGenerateNewKey =
    typeof payErr?.shouldGenerateNewKey === "boolean"
      ? payErr.shouldGenerateNewKey
      : code === "IDEMPOTENCY_KEY_CONFLICT";

  const defaultMessage = (): string => {
    switch (code) {
      case "VALIDATION_ERROR":
        return "Thông tin thanh toán hoặc Idempotency-Key không hợp lệ (400 VALIDATION_ERROR).";
      case "UNAUTHORIZED":
        return "Phiên đăng nhập thiếu hoặc đã hết hạn (401 UNAUTHORIZED). Vui lòng đăng nhập lại.";
      case "NOT_FOUND":
        return "Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn (404 NOT_FOUND).";
      case "INVALID_TRANSITION":
        return "Trạng thái đơn hàng hiện tại không cho phép thanh toán mới, đã hết hạn 15 phút hoặc đã được thanh toán thành công trước đó (409 INVALID_TRANSITION).";
      case "IDEMPOTENCY_KEY_CONFLICT":
        return "Khóa Idempotency-Key đã được dùng với thông tin thanh toán khác (409 IDEMPOTENCY_KEY_CONFLICT). Hệ thống đã tạo khóa mới để bạn thử lại.";
      case "PAYMENT_IN_PROGRESS":
        return "Giao dịch với cùng Idempotency-Key đang được xử lý trên máy chủ (409 PAYMENT_IN_PROGRESS). Bạn có thể bấm thử lại với CÙNG khóa này.";
      case "NETWORK_ERROR":
        return "Kết nối mạng đến máy chủ thanh toán bị gián đoạn. Bạn có thể bấm thử lại an toàn với CÙNG Idempotency-Key để tránh thanh toán trùng.";
      default:
        return "Máy chủ gặp sự cố ngoài dự kiến khi xử lý thanh toán (500 INTERNAL_ERROR). Bạn có thể thử lại với cùng Idempotency-Key.";
    }
  };

  const message =
    typeof payErr?.message === "string" && payErr.message.trim()
      ? payErr.message.trim()
      : defaultMessage();

  return {
    statusCode,
    code,
    message,
    canRetrySameKey,
    shouldGenerateNewKey,
    idempotencyKey,
  };
}

export interface SubmitPaymentApiResult {
  response: PaymentResponseDto;
  replayed: boolean;
  idempotencyKey: string;
}

/**
 * Gọi trực tiếp API thật `POST /payments` trên Backend theo đúng API Contract v3.0 Mục 3:
 * - Gửi header `Authorization: Bearer <accessToken>` & `Idempotency-Key: <8..64 chars>`.
 * - Body chỉ chứa `{ orderId, method, paymentDetails }`.
 * - Không sử dụng dữ liệu giả (mock fallback).
 */
export async function submitPaymentApi(
  rawPayload: CreatePaymentRequestDto,
  idempotencyKey: string,
  options?: {
    accessToken?: string | null;
  }
): Promise<SubmitPaymentApiResult> {
  const keyValidation = validateIdempotencyKey(idempotencyKey);
  if (!keyValidation.isValid) {
    throw createPaymentError(
      keyValidation.errorMessage || "Idempotency-Key không hợp lệ.",
      400,
      "VALIDATION_ERROR",
      idempotencyKey,
      { canRetrySameKey: false }
    );
  }

  const payloadValidation = validateCreatePaymentPayload(
    rawPayload,
    keyValidation.normalizedKey
  );
  if (!payloadValidation.isValid || !payloadValidation.payload) {
    throw payloadValidation.error!;
  }

  const cleanPayload = payloadValidation.payload;
  const cleanKey = keyValidation.normalizedKey;

  const token = options?.accessToken ?? getStoredToken();
  if (!token || isTokenExpired(token)) {
    clearStoredSession();
    throw createPaymentError(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để thanh toán.",
      401,
      "UNAUTHORIZED",
      cleanKey,
      { canRetrySameKey: false }
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": cleanKey,
      },
      body: JSON.stringify(cleanPayload),
    });
  } catch {
    throw createPaymentError(
      "Không thể kết nối tới máy chủ thanh toán (POST /payments). Vui lòng thử lại với cùng Idempotency-Key.",
      0,
      "NETWORK_ERROR",
      cleanKey,
      { canRetrySameKey: true }
    );
  }

  if (res.status === 401) {
    clearStoredSession();
    throw createPaymentError(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ (401 UNAUTHORIZED).",
      401,
      "UNAUTHORIZED",
      cleanKey,
      { canRetrySameKey: false }
    );
  }

  let bodyData: unknown = null;
  try {
    bodyData = await res.json();
  } catch {
    throw createPaymentError(
      `Phản hồi từ máy chủ không phải JSON hợp lệ (HTTP ${res.status}).`,
      res.status || 502,
      "INTERNAL_ERROR",
      cleanKey,
      { canRetrySameKey: true }
    );
  }

  if (!res.ok) {
    const errRecord =
      bodyData && typeof bodyData === "object"
        ? (bodyData as Record<string, unknown>)
        : {};
    const errCode =
      typeof errRecord.code === "string" && errRecord.code.trim()
        ? errRecord.code.trim()
        : res.status === 400
        ? "VALIDATION_ERROR"
        : res.status === 404
        ? "NOT_FOUND"
        : res.status === 409
        ? "INVALID_TRANSITION"
        : "INTERNAL_ERROR";

    const rawMsg = errRecord.message;
    const formattedMsg = Array.isArray(rawMsg)
      ? rawMsg.join("; ")
      : typeof rawMsg === "string" && rawMsg.trim()
      ? rawMsg.trim()
      : undefined;

    const mappedState = toPaymentSubmissionErrorState(
      {
        statusCode: res.status,
        code: errCode,
        message: formattedMsg,
        idempotencyKey: cleanKey,
      },
      cleanKey
    );

    throw createPaymentError(
      mappedState.message,
      mappedState.statusCode,
      mappedState.code,
      cleanKey,
      {
        canRetrySameKey: mappedState.canRetrySameKey,
        shouldGenerateNewKey: mappedState.shouldGenerateNewKey,
      }
    );
  }

  // API Contract v3.0 Mục 3.3: HTTP 200 cho cả SUCCESS và FAILED
  const validatedResponse = validatePaymentResponseData(bodyData, cleanKey);
  const replayedHeader = res.headers.get("Idempotency-Replayed");
  const replayed = replayedHeader === "true";

  return {
    response: validatedResponse,
    replayed,
    idempotencyKey: cleanKey,
  };
}

/**
 * Gọi API thật `GET /orders/me` để lấy danh sách đơn hàng của khách hàng đang đăng nhập (API Contract v3.0 Mục 4).
 * Dùng để tải đúng đơn hàng cần thanh toán (theo `orderId` hoặc đơn `PENDING` / `PAYMENT_FAILED` hiện tại)
 * và hiển thị lại Confirmation từ dữ liệu đã lưu trên Server mà không gọi lại `POST /payments`.
 */
export async function fetchMyOrdersApi(
  accessToken?: string | null
): Promise<GetMyOrdersResponseDto> {
  const token = accessToken ?? getStoredToken();
  if (!token || isTokenExpired(token)) {
    clearStoredSession();
    throw createPaymentError(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ (401 UNAUTHORIZED).",
      401,
      "UNAUTHORIZED",
      "",
      { canRetrySameKey: false }
    );
  }

  const res = await fetch(`${API_BASE_URL}/orders/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearStoredSession();
    throw createPaymentError(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ (401 UNAUTHORIZED).",
      401,
      "UNAUTHORIZED",
      "",
      { canRetrySameKey: false }
    );
  }

  if (!res.ok) {
    throw createPaymentError(
      `Không thể tải dữ liệu đơn hàng từ máy chủ (HTTP ${res.status}).`,
      res.status,
      "INTERNAL_ERROR",
      "",
      { canRetrySameKey: false }
    );
  }

  const data = (await res.json()) as GetMyOrdersResponseDto;
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    meta: data?.meta ?? {
      page: null,
      limit: null,
      total: 0,
      totalPages: null,
    },
  };
}

/**
 * Tìm đơn hàng mục tiêu từ kết quả `GET /orders/me`:
 * - Nếu có `targetOrderId`: tìm đúng Order có `id === targetOrderId`.
 * - Nếu không truyền `targetOrderId`: ưu tiên lấy Order đang active (`PENDING` hoặc `PAYMENT_FAILED`).
 */
export function selectTargetOrderFromMyOrders(
  orders: MyOrderDto[],
  targetOrderId?: string | null
): MyOrderDto | null {
  if (!Array.isArray(orders) || orders.length === 0) return null;

  const normalizedTarget =
    typeof targetOrderId === "string" ? targetOrderId.trim().toLowerCase() : "";

  if (normalizedTarget) {
    const matched = orders.find(
      (o) => o.id && o.id.trim().toLowerCase() === normalizedTarget
    );
    if (matched) return matched;
  }

  // Ưu tiên đơn hàng đang chờ thanh toán (PENDING hoặc PAYMENT_FAILED)
  const activePayable = orders.find(
    (o) => o.status === "PENDING" || o.status === "PAYMENT_FAILED"
  );
  if (activePayable) return activePayable;

  return null;
}

/**
 * Lấy thông tin hồ sơ & điểm tích lũy hiện tại từ `GET /auth/me` (API Contract v3.0 Mục 8).
 */
export async function fetchAuthMeProfile(
  accessToken?: string | null
): Promise<AuthMeResponseDto | null> {
  const token = accessToken ?? getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (
      typeof data?.id === "string" &&
      typeof data?.email === "string" &&
      typeof data?.loyaltyPoints === "number"
    ) {
      return {
        id: data.id,
        email: data.email,
        fullName: typeof data.fullName === "string" ? data.fullName : null,
        loyaltyPoints: data.loyaltyPoints,
      };
    }
    return null;
  } catch {
    return null;
  }
}
