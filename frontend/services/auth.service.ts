import {
  type AuthUser,
  type LoginRequestDto,
  type LoginResponseDto,
  type RegisterRequestDto,
  type RegisterResponseDto,
  findMockUserByEmail,
  mockLogin,
  mockRegister,
} from "@/mock-data";
import { API_BASE_URL } from "./api.service";

// ============================================================================
// AUTH SERVICE — SPRINT 2 (SCRUM-41)
// Đối chiếu chuẩn 100% với:
// - docs/api/BrewLite_API_Contract_v2.1.md (Mục 5, 6, 7)
// - Backend Auth Controller & Service
// - Tuyệt đối không lưu passwordHash trên client / localStorage
// - Tách bạch hoàn toàn Real Authentication (mặc định) và Mock Mode
// ============================================================================

export const TOKEN_STORAGE_KEY = "brewlite_auth_token_v1";
export const USER_STORAGE_KEY = "brewlite_auth_user_v1";

/**
 * Cấu hình chế độ xác thực:
 * - "real" (mặc định): Kết nối trực tiếp đến Backend API thật.
 * - "mock": Chỉ dùng khi biến môi trường NEXT_PUBLIC_AUTH_MODE=mock để test UI cô lập.
 */
export const AUTH_MODE: "real" | "mock" =
  process.env.NEXT_PUBLIC_AUTH_MODE === "mock" ? "mock" : "real";

/**
 * Giải mã JWT Payload phía client một cách an toàn để lấy sub (User ID) và exp
 */
export function decodeJwtPayload(
  token: string
): { sub?: string; exp?: number; iat?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem JWT access token đã hết hạn chưa
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // exp được tính theo giây, chuyển sang milliseconds so với thời gian hiện tại
  return payload.exp * 1000 <= Date.now();
}

/**
 * Validation cơ bản cho email theo API Contract v2.1:
 * - Bắt buộc, không được để trống
 * - Tối đa 255 ký tự
 * - Chuẩn hoá email: trim và lowercase
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { isValid: false, error: "Vui lòng nhập địa chỉ email." };
  }
  if (normalized.length > 255) {
    return { isValid: false, error: "Email không được vượt quá 255 ký tự." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return {
      isValid: false,
      error: "Định dạng email không hợp lệ (ví dụ: yourname@domain.com).",
    };
  }
  return { isValid: true };
}

/**
 * Validation cơ bản cho mật khẩu theo API Contract v2.1 Mục 6.2:
 * - Bắt buộc, không được để trống
 * - Tối thiểu 8 ký tự
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: "Vui lòng nhập mật khẩu." };
  }
  if (password.length < 8) {
    return { isValid: false, error: "Mật khẩu phải có tối thiểu 8 ký tự." };
  }
  return { isValid: true };
}

/**
 * Validation cho họ tên theo API Contract v2.1 Mục 6.2:
 * - Không bắt buộc
 * - Tối đa 255 ký tự
 */
export function validateFullName(fullName?: string): { isValid: boolean; error?: string } {
  if (!fullName) return { isValid: true };
  if (fullName.trim().length > 255) {
    return { isValid: false, error: "Họ và tên không được vượt quá 255 ký tự." };
  }
  return { isValid: true };
}

/**
 * Trích xuất token lưu trong localStorage (có kiểm tra hạn)
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;
    if (isTokenExpired(token)) {
      clearStoredSession();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Trích xuất thông tin User đang đăng nhập từ localStorage.
 * An toàn tuyệt đối: Chỉ chứa id, email, fullName. Không có passwordHash.
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    // Đảm bảo không có passwordHash
    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.fullName ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Lưu token và thông tin User an toàn sau khi đăng nhập thành công
 */
export function setStoredSession(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? null,
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
  } catch {
    // Bỏ qua lỗi lưu session
  }
}

/**
 * Đăng xuất và xóa phiên đăng nhập.
 * TUYỆT ĐỐI BẢO LƯU GIỎ HÀNG (Cart) theo API Contract v2.1 Mục 7.5 & 9.2!
 */
export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Bỏ qua lỗi xóa session
  }
}

/**
 * Gửi yêu cầu Đăng ký (Register)
 * - Mặc định Real Mode: Gửi trực tiếp đến Backend API `/auth/register`.
 * - Khi Backend gặp lỗi / không khả dụng: Ném lỗi rõ ràng, KHÔNG tự động đăng nhập giả.
 */
export async function registerApi(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
  const normalizedDto: RegisterRequestDto = {
    email: dto.email.trim().toLowerCase(),
    password: dto.password,
    fullName: dto.fullName?.trim() || undefined,
  };

  // Nếu explicitly bật Mock Mode qua biến môi trường
  if (AUTH_MODE === "mock") {
    return mockRegister(normalizedDto);
  }

  const endpoint =
    typeof window !== "undefined"
      ? "/api/backend/auth/register"
      : `${API_BASE_URL}/auth/register`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedDto),
    });
  } catch (netErr) {
    // Lỗi mạng hoặc Backend chưa chạy trong Real Mode: Báo lỗi thật sự, không giả lập thành công!
    const err: Error & { statusCode?: number; code?: string } = new Error(
      "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ."
    );
    err.statusCode = 503;
    err.code = "NETWORK_ERROR";
    throw err;
  }

  if (res.ok) {
    return (await res.json()) as RegisterResponseDto;
  }

  const errorData = await res.json().catch(() => null);
  const err: Error & { statusCode?: number; code?: string; details?: unknown } =
    new Error(
      (Array.isArray(errorData?.message)
        ? errorData.message.join(", ")
        : errorData?.message) || "Đăng ký không thành công"
    );
  err.statusCode = res.status;
  err.code =
    errorData?.code ||
    (res.status === 409
      ? "EMAIL_ALREADY_EXISTS"
      : res.status === 400
      ? "VALIDATION_ERROR"
      : "SERVER_ERROR");
  err.details = errorData;
  throw err;
}

/**
 * Gửi yêu cầu Đăng nhập (Login)
 * - Mặc định Real Mode: Gửi trực tiếp đến Backend API `/auth/login`.
 * - Nhận JWT token thật từ backend và verify qua Argon2id.
 * - Khi Backend gặp lỗi / không khả dụng: Ném lỗi rõ ràng, KHÔNG tự động đăng nhập giả.
 */
export async function loginApi(dto: LoginRequestDto): Promise<LoginResponseDto> {
  const normalizedDto: LoginRequestDto = {
    email: dto.email.trim().toLowerCase(),
    password: dto.password,
  };

  if (AUTH_MODE === "mock") {
    return mockLogin(normalizedDto);
  }

  const endpoint =
    typeof window !== "undefined"
      ? "/api/backend/auth/login"
      : `${API_BASE_URL}/auth/login`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedDto),
    });
  } catch (netErr) {
    const err: Error & { statusCode?: number; code?: string } = new Error(
      "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ."
    );
    err.statusCode = 503;
    err.code = "NETWORK_ERROR";
    throw err;
  }

  if (res.ok) {
    return (await res.json()) as LoginResponseDto;
  }

  const errorData = await res.json().catch(() => null);
  const err: Error & { statusCode?: number; code?: string; details?: unknown } =
    new Error(
      (Array.isArray(errorData?.message)
        ? errorData.message.join(", ")
        : errorData?.message) || "Email hoặc mật khẩu không chính xác."
    );
  err.statusCode = res.status;
  err.code =
    errorData?.code ||
    (res.status === 401
      ? "INVALID_CREDENTIALS"
      : res.status === 400
      ? "VALIDATION_ERROR"
      : "SERVER_ERROR");
  err.details = errorData;
  throw err;
}

/**
 * Tạo AuthUser từ thông tin đăng nhập thành công và JWT accessToken.
 * Tuyệt đối không chứa passwordHash hay dữ liệu nhạy cảm.
 */
export function resolveUserFromLogin(
  email: string,
  accessToken: string,
  knownFullName?: string | null
): AuthUser {
  const normalized = email.trim().toLowerCase();
  const payload = decodeJwtPayload(accessToken);
  const userId = payload?.sub || `u-${Date.now()}`;

  // Nếu đang chạy Mock Mode, lấy từ mock preview
  if (AUTH_MODE === "mock") {
    const mockUser = findMockUserByEmail(normalized);
    if (mockUser) {
      return {
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
      };
    }
  }

  return {
    id: userId,
    email: normalized,
    fullName: knownFullName ?? null,
  };
}
