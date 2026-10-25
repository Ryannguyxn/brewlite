import type { AuthUiConfig, MockRegisteredUser } from "./types";

// ============================================================================
// MOCK DATA & CẤU HÌNH CHO MÀN HÌNH ĐĂNG NHẬP & ĐĂNG KÝ (SCRUM-41 & SCRUM-43)
// Tuân thủ 100% API Contract v2.1 (Mục 2.5, 5.2, 5.3, 6, 7, 9.2):
// - `email`: bắt buộc, định dạng email hợp lệ, trim/lowercase, tối đa 255 ký tự
// - `password`: bắt buộc, tối thiểu 8 ký tự (KHÔNG trim/normalize trước khi hash/verify)
// - `fullName`: tùy chọn khi đăng ký, tối đa 255 ký tự
// - `JWT`: TTL 3600s (`tokenType: "Bearer"`)
// ============================================================================

export const AUTH_VALIDATION_RULES = {
  EMAIL_MAX_LENGTH: 255,
  FULL_NAME_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  JWT_EXPIRES_IN_SECONDS: 3600 as const,
} as const;

export const MOCK_AUTH_UI_CONFIG: AuthUiConfig = {
  brandTitle: "BrewLite",
  brandHighlight: "Coffee",
  backToMenuLabel: "Quay lại Thực đơn",
  roastBadge: "Artisanal Roast",
  loginHeading: "Chào mừng trở lại",
  loginSubheading:
    "Đăng nhập để tiếp tục đặt hàng và nhận ưu đãi thành viên tại BrewLite.",
  registerHeading: "Khởi tạo tài khoản mới",
  registerSubheading:
    "Trở thành thành viên BrewLite để đặt món nhanh chóng và tích lũy hạt cà phê.",
  emailMaxLength: AUTH_VALIDATION_RULES.EMAIL_MAX_LENGTH,
  fullNameMaxLength: AUTH_VALIDATION_RULES.FULL_NAME_MAX_LENGTH,
  passwordMinLength: AUTH_VALIDATION_RULES.PASSWORD_MIN_LENGTH,
  jwtExpiresInSeconds: AUTH_VALIDATION_RULES.JWT_EXPIRES_IN_SECONDS,
  trustNote:
    "Bảo mật chuẩn Argon2id & JWT Bearer • Giỏ hàng luôn được giữ nguyên",
  footerCopyright:
    "© 2026 BrewLite Specialty Coffee Co. Thiết kế theo chuẩn API Contract v2.1.",
};

/**
 * Danh sách tài khoản mẫu có sẵn để kiểm thử nhanh:
 * - Mật khẩu mặc định: `Password123` (đạt chuẩn >= 8 ký tự theo API Contract v2.1 Mục 6.2)
 */
export const MOCK_REGISTERED_USERS: MockRegisteredUser[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "customer@example.com",
    password: "Password123",
    fullName: "Nguyễn Văn A",
    note: "Tài khoản mẫu trong API Contract v2.1 (Mật khẩu: Password123)",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "huong.nguyen@brewlite.vn",
    password: "Password123",
    fullName: "Nguyễn Thị Hương",
    note: "Thành viên BrewLite mẫu (Mật khẩu: Password123)",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    email: "hai.dang@brewlite.vn",
    password: "Password123",
    fullName: "Nguyễn Hải Đăng",
    note: "Thành viên Hạng Vàng mẫu (Mật khẩu: Password123)",
  },
];
