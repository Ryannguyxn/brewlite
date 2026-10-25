import {
  type DatabaseUser,
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
// - Database table `users` & schema.prisma
// ============================================================================

export const TOKEN_STORAGE_KEY = "brewlite_auth_token_v1";
export const USER_STORAGE_KEY = "brewlite_current_user_v1";

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
 * Trích xuất token lưu trong localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Trích xuất thông tin User đang đăng nhập từ localStorage
 */
export function getStoredUser(): DatabaseUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DatabaseUser) : null;
  } catch {
    return null;
  }
}

/**
 * Lưu token và thông tin User sau khi đăng nhập thành công
 */
export function setStoredSession(token: string, user: DatabaseUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Bỏ qua lỗi lưu session
  }
}

/**
 * Đăng xuất và xóa phiên đăng nhập
 * Lưu ý theo API Contract v2.1 Mục 7.5: Tuyệt đối KHÔNG xóa giỏ hàng (Cart) khi logout!
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
 * - Tự động gọi API Backend trước (`/api/backend/auth/register` hoặc `${API_BASE_URL}/auth/register`).
 * - Nếu Backend offline hoặc gặp lỗi kết nối, fallback về Mock Data đảm bảo đủ 7 trường database.
 */
export async function registerApi(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
  const normalizedDto: RegisterRequestDto = {
    email: dto.email.trim().toLowerCase(),
    password: dto.password,
    fullName: dto.fullName?.trim() || undefined,
  };

  const endpoint =
    typeof window !== "undefined"
      ? "/api/backend/auth/register"
      : `${API_BASE_URL}/auth/register`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedDto),
    });

    if (res.ok) {
      return (await res.json()) as RegisterResponseDto;
    }

    // Nếu Backend trả lỗi có cấu trúc (ví dụ 400 VALIDATION_ERROR, 409 EMAIL_ALREADY_EXISTS)
    const errorData = await res.json().catch(() => null);
    const err: Error & { statusCode?: number; code?: string; details?: unknown } =
      new Error(
        (Array.isArray(errorData?.message)
          ? errorData.message.join(", ")
          : errorData?.message) || "Đăng ký thất bại"
      );
    err.statusCode = res.status;
    err.code = errorData?.code || (res.status === 409 ? "EMAIL_ALREADY_EXISTS" : "VALIDATION_ERROR");
    err.details = errorData;
    throw err;
  } catch (error) {
    // Nếu là lỗi nghiệp vụ từ server (đã có statusCode), ném tiếp
    if ((error as { statusCode?: number }).statusCode) {
      throw error;
    }
    // Nếu lỗi mạng / Backend chưa chạy -> Fallback qua Mock Data
    console.warn("Backend API không phản hồi, chuyển sang xử lý bằng Mock Data Users...");
    return mockRegister(normalizedDto);
  }
}

/**
 * Gửi yêu cầu Đăng nhập (Login)
 * - Tự động gọi API Backend trước (`/api/backend/auth/login` hoặc `${API_BASE_URL}/auth/login`).
 * - Nếu Backend offline, fallback về Mock Data Users.
 */
export async function loginApi(dto: LoginRequestDto): Promise<LoginResponseDto> {
  const normalizedDto: LoginRequestDto = {
    email: dto.email.trim().toLowerCase(),
    password: dto.password,
  };

  const endpoint =
    typeof window !== "undefined"
      ? "/api/backend/auth/login"
      : `${API_BASE_URL}/auth/login`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedDto),
    });

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
    err.code = errorData?.code || (res.status === 401 ? "INVALID_CREDENTIALS" : "VALIDATION_ERROR");
    err.details = errorData;
    throw err;
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error;
    }
    console.warn("Backend API không phản hồi, chuyển sang xử lý bằng Mock Data Users...");
    return mockLogin(normalizedDto);
  }
}

/**
 * Tìm hoặc tạo đối tượng DatabaseUser hoàn chỉnh tương ứng với tài khoản đăng nhập thành công
 */
export function resolveUserFromLogin(
  email: string,
  userId?: string
): DatabaseUser {
  const normalized = email.trim().toLowerCase();
  const existing = findMockUserByEmail(normalized);
  if (existing) {
    return existing;
  }

  // Nếu là user từ backend thực tế mà chưa có trong local mock
  const fallbackId = userId || `user-${Date.now()}`;
  const nowIso = new Date().toISOString();
  return {
    id: fallbackId,
    email: normalized,
    passwordHash: "backend_verified",
    fullName: null,
    loyaltyPoints: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    password_hash: "backend_verified",
    full_name: null,
    loyalty_points: 0,
    created_at: nowIso,
    updated_at: nowIso,
  };
}
