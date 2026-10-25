import type {
  DatabaseUser,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "./types";

// ============================================================================
// MOCK DATA USER BREWLITE — SPRINT 2 (SCRUM-41)
// Đối chiếu 100% với:
// 1. Database table `users` (PostgreSQL live inspect)
// 2. backend/prisma/schema.prisma (Model User)
// 3. docs/api/BrewLite_API_Contract_v2.1.md (Mục 6 & 7)
//
// ĐẢM BẢO ĐỦ 7 TRƯỜNG CỦA DATABASE BẢNG USERS:
// 1. id: UUID (PK)
// 2. email: VARCHAR(255) (UNIQUE, lowercase + trimmed)
// 3. passwordHash / password_hash: VARCHAR(255) (Argon2id hash; không lưu plaintext)
// 4. fullName / full_name: VARCHAR(255) (Nullable)
// 5. loyaltyPoints / loyalty_points: INTEGER (DEFAULT 0, CHECK >= 0)
// 6. createdAt / created_at: TIMESTAMPTZ (DEFAULT CURRENT_TIMESTAMP)
// 7. updatedAt / updated_at: TIMESTAMPTZ (DEFAULT CURRENT_TIMESTAMP)
// ============================================================================

/** Hash Argon2id chuẩn của mật khẩu 'Password123' tạo bởi Argon2id backend */
export const MOCK_ARGON2ID_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$mG7PSvxFcBnes/A6uf4Bxg$jN4wfxF0HsF54rHgyOd7a8Jce4+8xpTe/FuALxO+iJ4";

export const MOCK_DATABASE_USERS: DatabaseUser[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "customer@example.com",
    passwordHash: MOCK_ARGON2ID_PASSWORD_HASH,
    fullName: "Nguyễn Văn A",
    loyaltyPoints: 120,
    createdAt: "2026-10-21T15:30:59.000Z",
    updatedAt: "2026-10-23T13:00:00.000Z",
    // Các trường alias snake_case tương ứng với cột PostgreSQL
    password_hash: MOCK_ARGON2ID_PASSWORD_HASH,
    full_name: "Nguyễn Văn A",
    loyalty_points: 120,
    created_at: "2026-10-21T15:30:59.000Z",
    updated_at: "2026-10-23T13:00:00.000Z",
  },
  {
    id: "a2000000-0000-4000-8000-000000000001",
    email: "huong.nguyen@brewlite.vn",
    passwordHash: MOCK_ARGON2ID_PASSWORD_HASH,
    fullName: "Nguyễn Thị Hương",
    loyaltyPoints: 240,
    createdAt: "2026-10-22T08:15:00.000Z",
    updatedAt: "2026-10-24T09:20:00.000Z",
    password_hash: MOCK_ARGON2ID_PASSWORD_HASH,
    full_name: "Nguyễn Thị Hương",
    loyalty_points: 240,
    created_at: "2026-10-22T08:15:00.000Z",
    updated_at: "2026-10-24T09:20:00.000Z",
  },
  {
    id: "a2000000-0000-4000-8000-000000000002",
    email: "dung.tran@brewlite.vn",
    passwordHash: MOCK_ARGON2ID_PASSWORD_HASH,
    fullName: "Trần Quốc Dũng",
    loyaltyPoints: 50,
    createdAt: "2026-10-22T10:00:00.000Z",
    updatedAt: "2026-10-24T11:45:00.000Z",
    password_hash: MOCK_ARGON2ID_PASSWORD_HASH,
    full_name: "Trần Quốc Dũng",
    loyalty_points: 50,
    created_at: "2026-10-22T10:00:00.000Z",
    updated_at: "2026-10-24T11:45:00.000Z",
  },
  {
    id: "a2000000-0000-4000-8000-000000000003",
    email: "minh.le@brewlite.vn",
    passwordHash: MOCK_ARGON2ID_PASSWORD_HASH,
    fullName: null, // Trường hợp fullName là null theo schema
    loyaltyPoints: 0,
    createdAt: "2026-10-24T02:00:00.000Z",
    updatedAt: "2026-10-24T02:00:00.000Z",
    password_hash: MOCK_ARGON2ID_PASSWORD_HASH,
    full_name: null,
    loyalty_points: 0,
    created_at: "2026-10-24T02:00:00.000Z",
    updated_at: "2026-10-24T02:00:00.000Z",
  },
];

/** Kho lưu trữ user động trong phiên client để hỗ trợ đăng ký -> đăng nhập ngay lập tức */
const DYNAMIC_USERS_STORAGE_KEY = "brewlite_dynamic_users_v1";

export function getStoredMockUsers(): DatabaseUser[] {
  if (typeof window === "undefined") {
    return [...MOCK_DATABASE_USERS];
  }
  try {
    const raw = localStorage.getItem(DYNAMIC_USERS_STORAGE_KEY);
    if (!raw) return [...MOCK_DATABASE_USERS];
    const parsed = JSON.parse(raw) as DatabaseUser[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Gộp người dùng mặc định và người dùng đã đăng ký mới (không trùng email)
      const existingEmails = new Set(parsed.map((u) => u.email.toLowerCase()));
      const defaultsToAdd = MOCK_DATABASE_USERS.filter(
        (u) => !existingEmails.has(u.email.toLowerCase())
      );
      return [...parsed, ...defaultsToAdd];
    }
  } catch {
    // Bỏ qua lỗi đọc localStorage
  }
  return [...MOCK_DATABASE_USERS];
}

export function saveStoredMockUsers(users: DatabaseUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DYNAMIC_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Bỏ qua lỗi lưu localStorage
  }
}

/**
 * Tìm kiếm người dùng theo email (chuẩn hoá trim + toLowerCase theo API Contract v2.1)
 */
export function findMockUserByEmail(email: string): DatabaseUser | undefined {
  const normalizedEmail = email.trim().toLowerCase();
  const allUsers = getStoredMockUsers();
  return allUsers.find(
    (u) => u.email.trim().toLowerCase() === normalizedEmail
  );
}

/**
 * Tạo token JWT giả lập hợp lệ về mặt cấu trúc (Header.Payload.Signature)
 */
export function generateMockJwt(userId: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = btoa("mock_signature_for_brewlite_dev");
  return `${header}.${payload}.${signature}`;
}

/**
 * Giả lập đăng nhập qua Mock Data (API Contract v2.1 Mục 7)
 * - Mật khẩu mẫu mặc định cho tất cả user mẫu là 'Password123'
 * - Không tiết lộ email có tồn tại hay không khi sai thông tin (HTTP 401 INVALID_CREDENTIALS)
 */
export async function mockLogin(dto: LoginRequestDto): Promise<LoginResponseDto> {
  const normalizedEmail = dto.email.trim().toLowerCase();
  const user = findMockUserByEmail(normalizedEmail);

  // Kiểm tra mật khẩu (hỗ trợ Password123 cho mock và mật khẩu đăng ký động)
  const isValidPassword =
    Boolean(user) &&
    (dto.password === "Password123" ||
      user?.passwordHash === `mock_plain_${dto.password}` ||
      user?.passwordHash === MOCK_ARGON2ID_PASSWORD_HASH);

  if (!user || !isValidPassword) {
    const error: Error & {
      statusCode?: number;
      code?: string;
      error?: string;
    } = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    error.error = "Unauthorized";
    throw error;
  }

  return {
    accessToken: generateMockJwt(user.id),
    tokenType: "Bearer",
    expiresIn: 3600,
  };
}

/**
 * Giả lập đăng ký qua Mock Data (API Contract v2.1 Mục 6)
 * - Kiểm tra trùng lặp email -> HTTP 409 EMAIL_ALREADY_EXISTS
 * - Tạo đầy đủ 7 trường của database PostgreSQL `users`
 * - Trả về đúng `{ id, email, fullName }` (HTTP 201 Created)
 */
export async function mockRegister(
  dto: RegisterRequestDto
): Promise<RegisterResponseDto> {
  const normalizedEmail = dto.email.trim().toLowerCase();

  // Kiểm tra trùng email
  const existing = findMockUserByEmail(normalizedEmail);
  if (existing) {
    const error: Error & {
      statusCode?: number;
      code?: string;
      error?: string;
    } = new Error("Email already exists");
    error.statusCode = 409;
    error.code = "EMAIL_ALREADY_EXISTS";
    error.error = "Conflict";
    throw error;
  }

  // Tạo UUID v4 đơn giản
  const newId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const nowIso = new Date().toISOString();
  const trimmedFullName = dto.fullName?.trim() || null;

  // Đảm bảo tạo đầy đủ 7 trường database
  const newUser: DatabaseUser = {
    id: newId,
    email: normalizedEmail,
    passwordHash: `mock_plain_${dto.password}`,
    fullName: trimmedFullName,
    loyaltyPoints: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
    // snake_case
    password_hash: `mock_plain_${dto.password}`,
    full_name: trimmedFullName,
    loyalty_points: 0,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const currentUsers = getStoredMockUsers();
  currentUsers.push(newUser);
  saveStoredMockUsers(currentUsers);

  return {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
  };
}
