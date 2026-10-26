"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthPageView from "@/components/AuthPageView";
import {
  MOCK_SITE_CONFIG,
  MOCK_USER_PROFILE,
  type AuthMode,
  type RegisterResponseDto,
  type SiteConfigData,
  type UserProfile,
} from "@/mock-data";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getDisplayCustomerName } from "@/services/auth.service";

interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
  onFeatureNotice?: (featureLabel: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  activeNav?: "thuc-don" | "khuyen-mai" | "lich-su-don-hang" | "ve-brewlite";
  userProfile?: UserProfile;
  siteConfig?: SiteConfigData;
}

export default function Header({
  cartCount,
  onCartClick,
  onFeatureNotice,
  searchQuery = "",
  onSearchChange,
  activeNav = "thuc-don",
  userProfile = MOCK_USER_PROFILE,
  siteConfig = MOCK_SITE_CONFIG,
}: HeaderProps) {
  // Lấy dữ liệu giỏ hàng từ CartContext (SCRUM-40)
  const cart = useCart();
  const displayCartCount =
    cartCount !== undefined ? cartCount : cart.totalQuantity;

  // Lấy dữ liệu xác thực người dùng từ AuthContext (SCRUM-41)
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleNotice = (label: string) => {
    if (onFeatureNotice) {
      onFeatureNotice(label);
    }
  };

  const handleCartButtonClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      cart.openCart();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-[1320px] mx-auto px-margin flex items-center justify-between gap-gutter">
        <div className="flex items-center gap-space-lg flex-shrink-0">
          <Link className="flex items-center gap-space-sm" href="/">
            <img
              alt={`${siteConfig.brandName} Logo`}
              className="h-8 w-auto object-contain"
              src={siteConfig.logoUrl}
            />
            <span className="font-headline-md text-headline-md text-primary tracking-tight font-bold">
              {siteConfig.brandName}
            </span>
          </Link>
          <button
            onClick={() => handleNotice("Chọn chi nhánh")}
            className="hidden xl:flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">
              location_on
            </span>
            <span className="font-label-md text-label-md">
              {siteConfig.selectedBranch}
            </span>
            <span className="material-symbols-outlined text-[16px]">
              expand_more
            </span>
          </button>
        </div>

  const handleLoginCompleted = (loggedInUser: RegisterResponseDto) => {
    setAuthUser(loggedInUser);
    setIsAuthOpen(false);
    if (returnToCheckoutAfterLogin) {
      setReturnToCheckoutAfterLogin(false);
      notifyResumeCheckoutAfterLogin();
    }
  };

  const displayFullName = authUser
    ? authUser.fullName || authUser.email
    : userProfile.fullName;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-[1320px] mx-auto px-margin flex items-center justify-between gap-gutter">
          <div className="flex items-center gap-space-lg flex-shrink-0">
            <Link className="flex items-center gap-space-sm" href="/">
              <img
                alt={`${siteConfig.brandName} Logo`}
                className="h-8 w-auto object-contain"
                src={siteConfig.logoUrl}
              />
              <span className="font-headline-md text-headline-md text-primary tracking-tight">
                {siteConfig.brandName}
              </span>
            </Link>
            <button
              onClick={() => handleNotice("Chọn chi nhánh")}
              className="hidden xl:flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">
                location_on
              </span>
              <span className="font-label-md text-label-md">
                {siteConfig.selectedBranch}
              </span>
              <span className="material-symbols-outlined text-[16px]">
                expand_more
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-space-sm">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-sm font-body-sm rounded-full focus:outline-none focus:ring-1 focus:ring-primary shadow-[0_1px_4px_rgba(44,32,24,0.04)] transition-all"
                placeholder={siteConfig.searchPlaceholder}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              className={`px-3 py-2 font-label-lg text-label-lg rounded-lg transition-colors ${
                activeNav === "thuc-don"
                  ? "bg-primary text-on-primary shadow-sm font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
              href="/"
            >
              Thực đơn
            </Link>
            <button
              type="button"
              onClick={() => handleNotice("Khuyến mãi")}
              className={`px-3 py-2 font-label-lg text-label-lg rounded-lg transition-colors cursor-pointer ${
                activeNav === "khuyen-mai"
                  ? "bg-primary text-on-primary shadow-sm font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              Khuyến mãi
            </button>
            <button
              type="button"
              onClick={() => handleNotice("Lịch sử đơn hàng")}
              className="px-3 py-2 font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors cursor-pointer"
            >
              Lịch sử đơn hàng
            </button>
            <a
              className="px-3 py-2 font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors"
              href="#footer"
            >
              Về BrewLite
            </a>
          </nav>

          <div className="flex items-center gap-space-md flex-shrink-0">
            <button
              id="header-cart-btn"
              onClick={handleCartButtonClick}
              className="relative flex items-center gap-space-xs px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-all cursor-pointer"
              type="button"
              aria-label={`Giỏ hàng, có ${displayCartCount} món`}
            >
              <span className="material-symbols-outlined text-[22px] text-primary">
                shopping_bag
              </span>
              <span className="font-label-md text-label-md hidden sm:inline">
                Giỏ hàng
              </span>
              <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-md text-[11px] leading-tight font-semibold">
                {displayCartCount} món
              </span>
            </button>

            <button
              id="header-account-btn"
              type="button"
              onClick={handleAccountBoxClick}
              title="Nhấn để Đăng nhập / Đăng ký tài khoản"
              className="flex items-center gap-space-sm pl-2 group cursor-pointer"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shadow-[0_1px_4px_rgba(0,0,0,0.1)] ring-1 ring-surface-variant group-hover:ring-primary transition-all"
                src={userProfile.avatarUrl}
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-title-sm text-title-sm text-on-surface leading-tight group-hover:text-primary transition-colors max-w-[160px] truncate">
                  {displayFullName}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-label-md text-[11px] text-primary font-bold bg-primary-fixed/60 px-1.5 py-0.2 rounded">
                    {authUser ? "Đã đăng nhập" : userProfile.tierName}
                  </span>
                  <span className="font-label-md text-[11px] text-tertiary font-semibold">
                    {authUser ? "✓ JWT Active" : `💎 ${userProfile.points} điểm`}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            className={`px-3 py-2 font-label-lg text-label-lg rounded-lg transition-colors ${
              activeNav === "thuc-don"
                ? "bg-primary text-on-primary shadow-sm font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
            href="/"
          >
            Thực đơn
          </Link>
          <button
            type="button"
            onClick={() => handleNotice("Khuyến mãi")}
            className={`px-3 py-2 font-label-lg text-label-lg rounded-lg transition-colors cursor-pointer ${
              activeNav === "khuyen-mai"
                ? "bg-primary text-on-primary shadow-sm font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            Khuyến mãi
          </button>
          <button
            type="button"
            onClick={() => handleNotice("Lịch sử đơn hàng")}
            className="px-3 py-2 font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors cursor-pointer"
          >
            Lịch sử đơn hàng
          </button>
          <a
            className="px-3 py-2 font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-colors"
            href="#footer"
          >
            Về BrewLite
          </a>
        </nav>

        <div className="flex items-center gap-space-md flex-shrink-0">
          <button
            id="header-cart-btn"
            onClick={handleCartButtonClick}
            className="relative flex items-center gap-space-xs px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-all cursor-pointer"
            type="button"
            aria-label={`Giỏ hàng, có ${displayCartCount} món`}
          >
            <span className="material-symbols-outlined text-[22px] text-primary">
              shopping_bag
            </span>
            <span className="font-label-md text-label-md hidden sm:inline">
              Giỏ hàng
            </span>
            <span className="flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-md text-[11px] leading-tight font-semibold">
              {displayCartCount} món
            </span>
          </button>

          {/* User Profile / Auth State (SCRUM-41) */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-space-sm pl-2 group cursor-pointer focus:outline-none"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-sm shadow-[0_1px_4px_rgba(0,0,0,0.1)] ring-1 ring-surface-variant group-hover:ring-primary transition-all">
                  {getDisplayCustomerName(user)[0].toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-title-sm text-title-sm text-on-surface leading-tight group-hover:text-primary transition-colors max-w-[200px] truncate">
                    {getDisplayCustomerName(user)}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-label-md text-[11px] text-primary font-bold bg-primary-fixed/60 px-1.5 py-0.2 rounded">
                      Thành viên
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu người dùng */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-outline-variant/30">
                    <p className="font-label-md text-label-md font-bold text-on-surface truncate">
                      {getDisplayCustomerName(user)}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleNotice("Lịch sử đơn hàng");
                      }}
                      className="w-full px-4 py-2 text-left font-body-sm text-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-outline">
                        receipt_long
                      </span>
                      <span>Lịch sử đơn hàng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left font-body-sm text-body-sm text-error hover:bg-error-container/20 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all font-label-md text-label-md font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  login
                </span>
                <span>Đăng nhập</span>
              </button>
              <Link
                href="/login?mode=register"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-outline-variant hover:border-primary text-on-surface hover:text-primary transition-all font-label-md text-label-md cursor-pointer"
              >
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
