"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthUser,
  LoginRequestDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "@/mock-data";
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  isTokenExpired,
  loginApi,
  registerApi,
  resolveUserFromLogin,
  setStoredSession,
} from "@/services/auth.service";

// ============================================================================
// AUTH CONTEXT — SPRINT 2 (SCRUM-41)
// Quản lý trạng thái xác thực người dùng trên toàn Frontend Next.js
// Tuân thủ API Contract v2.1:
// - Giữ nguyên giỏ hàng (Cart) khi chuyển đổi đăng nhập / đăng xuất
// - Quản lý token Bearer và thông tin AuthUser an toàn (không chứa passwordHash)
// - Tự động kiểm tra token hết hạn khi reload trang
// ============================================================================

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<void>;
  register: (dto: RegisterRequestDto) => Promise<RegisterResponseDto>;
  logout: () => void;

  // Trạng thái modal Auth bật nhanh
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Điều khiển popup Modal nếu người dùng click từ Header hoặc Checkout
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Khôi phục phiên đăng nhập khi tải trang & kiểm tra token hết hạn / không hợp lệ
  useEffect(() => {
    try {
      const savedToken = getStoredToken();
      const savedUser = getStoredUser();
      if (savedToken && savedUser) {
        if (isTokenExpired(savedToken)) {
          // Token hết hạn hoặc không hợp lệ: Xóa phiên đăng nhập nhưng BẢO LƯU GIỎ HÀNG
          clearStoredSession();
          setAccessToken(null);
          setUser(null);
        } else {
          setAccessToken(savedToken);
          setUser(savedUser);
        }
      } else {
        clearStoredSession();
        setAccessToken(null);
        setUser(null);
      }
    } catch {
      clearStoredSession();
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (dto: LoginRequestDto): Promise<void> => {
    const res = await loginApi(dto);
    // Validate JWT (cấu trúc 3 phần, sub chuỗi không rỗng, exp chưa hết hạn).
    // Nếu token không hợp lệ, resolveUserFromLogin sẽ ném lỗi.
    // Lỗi ném ra TRƯỚC KHI lưu session -> không lưu token hoặc thiết lập trạng thái đăng nhập.
    const resolvedUser = resolveUserFromLogin(dto.email, res.accessToken);
    setAccessToken(res.accessToken);
    setUser(resolvedUser);
    setStoredSession(res.accessToken, resolvedUser);
  }, []);

  const register = useCallback(
    async (dto: RegisterRequestDto): Promise<RegisterResponseDto> => {
      // Theo API Contract v2.1: Register thành công KHÔNG tự động đăng nhập
      return await registerApi(dto);
    },
    []
  );

  const logout = useCallback((): void => {
    // Đăng xuất: Xóa auth session nhưng BẢO LƯU GIỎ HÀNG
    clearStoredSession();
    setAccessToken(null);
    setUser(null);
  }, []);

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      register,
      logout,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
    }),
    [
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
