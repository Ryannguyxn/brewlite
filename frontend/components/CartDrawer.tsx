"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import type {
  InsufficientStockDetail,
  InvalidCartDetail,
  OrderApiErrorResponse,
  OrderResponseDto,
  RegisterResponseDto,
} from "@/mock-data";
import {
  AUTH_CHANGED_EVENT,
  CHECKOUT_RESUME_EVENT,
  clearAuthSession,
  FALLBACK_DRINK_IMAGE,
  formatVnd,
  getStoredAuthUser,
  isAuthenticatedWithValidJwt,
  requestOpenAuthModal,
  submitCreateOrder,
} from "@/services/api.service";

type CheckoutViewStep = "closed" | "review" | "success";

/**
 * Hiển thị mô tả tiếng Việt dựa trên `details[].reason` của mã lỗi `INVALID_CART`
 * (Tuân thủ API Contract v2.1 Mục 8.3.1 & 8.7: dùng `code` và `details`, không parse text `message`)
 */
function describeInvalidCartReason(reason: string): string {
  switch (reason) {
    case "PRODUCT_NOT_FOUND":
      return "Sản phẩm không tồn tại trong hệ thống (ORD-CAT-01).";
    case "PRODUCT_UNAVAILABLE":
      return "Danh mục sản phẩm hiện đang tạm ngừng phục vụ (ORD-CAT-02).";
    case "INVALID_SIZE":
      return "Kích cỡ đã chọn không hợp lệ với chính sách kích cỡ (sizePolicy) của sản phẩm (ORD-CAT-03/04).";
    case "TOPPING_NOT_ALLOWED":
      return "Topping đã chọn không áp dụng cho sản phẩm này (ORD-CAT-05).";
    case "TOPPING_NOT_FOUND":
      return "Mã Topping không tồn tại trên hệ thống (ORD-CAT-05).";
    case "TOPPING_UNAVAILABLE":
      return "Topping đã chọn hiện đang tạm hết hàng (ORD-CAT-06).";
    case "DUPLICATE_TOPPING":
      return "Có Topping bị chọn trùng lặp trong cùng 1 món (ORD-CAT-07).";
    case "TOO_MANY_TOPPINGS":
      return "Vượt quá giới hạn tối đa 3 loại Topping cho 1 món (ORD-CAT-07).";
    case "DUPLICATE_CONFIGURATION":
      return "Cấu hình dòng sản phẩm bị trùng lặp.";
    case "INVALID_PRICE_DATA":
      return "Dữ liệu giá sản phẩm không hợp lệ (ORD-CAT-08).";
    default:
      return `Dữ liệu giỏ hàng không hợp lệ (${reason}).`;
  }
}

export default function CartDrawer() {
  const {
    items,
    totalQuantity,
    formattedSubtotal,
    isCartOpen,
    openCart,
    closeCart,
    clearCart,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    feedbackMessage,
    feedbackType,
    dismissFeedback,
    mapToCreateOrderPayload,
  } = useCart();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // State quản lý xác thực người dùng (Auth) & Mã khuyến mãi (Coupon)
  const [authUser, setAuthUser] = useState<RegisterResponseDto | null>(null);
  const [couponInput, setCouponInput] = useState<string>("");

  // State quản lý luồng Checkout & gọi `POST /orders` (API Contract v2.1 Mục 8 & 9)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutViewStep>("closed");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<OrderApiErrorResponse | null>(
    null
  );
  const [createdOrder, setCreatedOrder] = useState<OrderResponseDto | null>(
    null
  );

  // Đồng bộ trạng thái Auth hiện tại và lắng nghe sự kiện quay lại Checkout sau khi Login
  useEffect(() => {
    const syncAuth = () => {
      if (isAuthenticatedWithValidJwt()) {
        setAuthUser(getStoredAuthUser());
      } else {
        setAuthUser(null);
      }
    };

    syncAuth();

    const handleResumeCheckout = () => {
      syncAuth();
      openCart();
      setOrderError(null);
      setCheckoutStep("review");
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    window.addEventListener(CHECKOUT_RESUME_EVENT, handleResumeCheckout);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
      window.removeEventListener(CHECKOUT_RESUME_EVENT, handleResumeCheckout);
      window.removeEventListener("storage", syncAuth);
    };
  }, [openCart]);

  // Khóa cuộn trang nền khi Cart Drawer đang mở
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setConfirmClearOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // Xử lý phím Escape để đóng drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen && !isSubmittingOrder) {
        if (checkoutStep !== "closed") {
          setCheckoutStep("closed");
          setOrderError(null);
        } else {
          closeCart();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, isSubmittingOrder, checkoutStep, closeCart]);

  // Tự động tắt feedback sau 3s
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        dismissFeedback();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage, dismissFeedback]);

  /**
   * Bước 1 & 2 & 3 trong yêu cầu:
   * - Kiểm tra Auth trước khi Checkout (`isAuthenticatedWithValidJwt()`).
   * - Nếu chưa login (hoặc JWT hết hạn): điều hướng mở màn hình Login (`returnToCheckout: true`) và giữ nguyên Cart.
   * - Nếu đã login: mở màn hình Checkout để xác nhận & gọi `POST /orders`.
   */
  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    setOrderError(null);

    if (!isAuthenticatedWithValidJwt()) {
      setAuthUser(null);
      requestOpenAuthModal({ mode: "login", returnToCheckout: true });
      return;
    }

    setAuthUser(getStoredAuthUser());
    setCheckoutStep("review");
  };

  /**
   * Bước 4 -> 9 trong yêu cầu:
   * - Đọc Cart hiện tại & map thành payload đúng API Contract v2.1 Mục 8.2 (`{ items, couponCode? }`).
   * - Gọi `POST /orders` kèm `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
   * - Xử lý trạng thái `loading` / `success` / `error`.
   * - Nếu thành công (`201 Created`), nhận Order có `status: "PENDING"` và hiển thị kết quả từ server.
   */
  const handleConfirmCreateOrder = async () => {
    if (isSubmittingOrder || items.length === 0) return;

    // Kiểm tra lại JWT ngay trước khi gọi API (Mục 7.5 & 9.2)
    if (!isAuthenticatedWithValidJwt()) {
      setAuthUser(null);
      setCheckoutStep("closed");
      requestOpenAuthModal({ mode: "login", returnToCheckout: true });
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      const payload = mapToCreateOrderPayload(couponInput);
      const result = await submitCreateOrder(payload);

      if (!result.ok) {
        setOrderError(result.errorResponse);

        // Nếu lỗi 401 UNAUTHORIZED (JWT hết hạn khi Checkout): giữ nguyên Cart và cho phép chuyển sang Login
        if (
          result.errorResponse.statusCode === 401 ||
          result.errorResponse.code === "UNAUTHORIZED"
        ) {
          setAuthUser(null);
        }
        return;
      }

      // Thành công 201 Created: Lưu Order PENDING trả về từ server và làm rỗng giỏ hàng
      setCreatedOrder(result.data);
      setCheckoutStep("success");
      setCouponInput("");
      clearCart();
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setCreatedOrder(null);
    setCheckoutStep("closed");
    setOrderError(null);
    closeCart();
  };

  return (
    <>
      {/* 1. LỚP PHỦ MỜ (SCRIM / BACKDROP) */}
      <div
        id="cartDrawerScrim"
        aria-hidden="true"
        onClick={() => {
          if (!isSubmittingOrder) {
            closeCart();
          }
        }}
        className={`fixed inset-0 bg-inverse-surface/30 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isCartOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 2. KHUNG NỘI DUNG GIỎ HÀNG TRƯỢT TỪ BÊN PHẢI (DESKTOP / MOBILE DRAWER) */}
      <aside
        id="cartDrawerPanel"
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng của bạn"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] max-w-full bg-surface-container-lowest shadow-[-12px_0_40px_rgba(30,21,16,0.18)] flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out transform ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ================================================================== */}
        {/* HEADER GIỎ HÀNG */}
        {/* ================================================================== */}
        <div className="p-space-lg bg-surface-container-lowest flex-shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.03)] z-10">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-surface-container-high">
            <button
              type="button"
              onClick={closeCart}
              disabled={isSubmittingOrder}
              className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              <span>Quay lại Thực đơn</span>
            </button>

            <div className="flex items-center gap-2">
              {items.length > 0 && checkoutStep === "closed" && (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="text-outline hover:text-error transition-colors font-label-md text-label-md px-2 py-1 rounded hover:bg-surface-container-high cursor-pointer"
                  title="Xóa toàn bộ giỏ hàng"
                >
                  Xóa tất cả
                </button>
              )}
              <button
                type="button"
                onClick={closeCart}
                disabled={isSubmittingOrder}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Đóng giỏ hàng"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">
                shopping_cart
              </span>
              <h2 className="font-title-md text-title-md text-on-surface font-bold tracking-tight">
                Giỏ hàng của bạn
              </h2>
              <span
                id="cartCountBadge"
                className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-md text-label-md font-semibold"
              >
                ({totalQuantity} món)
              </span>
            </div>
          </div>

          {/* Thông báo quy tắc máy chủ theo API Contract v2.1 & Stitch UI */}
          <div
            id="cartServerAlert"
            className="mt-3 p-2.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-[12px] text-on-surface-variant flex items-start gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary flex-shrink-0">
              info
            </span>
            <span id="cartServerAlertMsg" className="leading-tight">
              Thông tin giỏ hàng sẽ được máy chủ kiểm tra tình trạng tồn kho và
              tính lại giá chính thức khi tiến hành đặt hàng.
            </span>
          </div>

          {/* Toast phản hồi nhanh trong drawer */}
          {feedbackMessage && checkoutStep === "closed" && (
            <div
              className={`mt-2 p-2 rounded-lg text-[12px] font-medium flex items-center justify-between transition-all ${
                feedbackType === "error"
                  ? "bg-error/10 text-error"
                  : feedbackType === "warning"
                    ? "bg-tertiary/10 text-tertiary font-semibold"
                    : "bg-secondary-container text-on-secondary-container"
              }`}
            >
              <span>{feedbackMessage}</span>
              <button
                type="button"
                onClick={dismissFeedback}
                className="text-current opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  close
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* BODY: DANH SÁCH MÓN HOẶC EMPTY STATE */}
        {/* ================================================================== */}
        <div
          className="flex-1 overflow-y-auto px-space-lg py-space-sm space-y-3.5"
          id="cartContentContainer"
        >
          {items.length === 0 ? (
            /* TRẠNG THÁI GIỎ HÀNG TRỐNG (EMPTY STATE) */
            <div
              id="mockEmptyState"
              className="py-12 flex flex-col items-center justify-center text-center h-full"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-outline">
                <span className="material-symbols-outlined text-[40px]">
                  remove_shopping_cart
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mb-1">
                Giỏ hàng của bạn đang trống
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mb-space-lg">
                Khám phá các dòng cà phê thủ công đặc sản và bánh tươi để thêm
                vào giỏ hàng ngay hôm nay!
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="px-6 py-2.5 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary-container transition-all cursor-pointer"
              >
                Khám phá thực đơn
              </button>
            </div>
          ) : (
            /* DANH SÁCH MÓN ĐÃ CHỌN */
            items.map((item) => {
              const sizeLabel =
                item.size === "ONE_SIZE"
                  ? "Tiêu chuẩn (ONE_SIZE)"
                  : `Size ${item.size}`;

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-surface rounded-xl shadow-[0_2px_12px_rgba(44,32,24,0.04)] hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-start gap-3">
                    {/* Ảnh sản phẩm */}
                    <div className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0 shadow-sm border border-outline-variant/30 overflow-hidden bg-surface-container">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith(FALLBACK_DRINK_IMAGE)) {
                            target.src = FALLBACK_DRINK_IMAGE;
                          }
                        }}
                      />
                    </div>

                    {/* Thông tin món & tùy chọn */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="font-title-sm text-title-sm text-on-surface font-semibold truncate leading-tight">
                            {item.productName}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-md text-[11px] font-medium">
                              {sizeLabel}
                            </span>
                            <span className="text-[12px] text-on-surface-variant font-body-sm">
                              {formatVnd(item.sizePriceVnd)}/ly gốc
                            </span>
                          </div>
                        </div>

                        {/* Nút xóa món */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-outline hover:text-error transition-colors p-1 rounded hover:bg-surface-container-high cursor-pointer"
                          title="Xóa món này"
                          aria-label={`Xóa ${item.productName}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>

                      {/* Danh sách Topping đi kèm */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.toppings && item.toppings.length > 0 ? (
                          item.toppings.map((top) => (
                            <span
                              key={top.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-[11px] text-on-surface-variant font-medium"
                            >
                              + {top.name} (+{formatVnd(top.priceVnd)})
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-[11px] text-outline font-medium">
                            Không kèm topping phụ
                          </span>
                        )}
                      </div>

                      {/* Ghi chú pha chế đặc biệt */}
                      {item.note && (
                        <div className="mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-[11px] text-tertiary font-medium">
                            Yêu cầu: {item.note}
                          </span>
                        </div>
                      )}

                      {/* Bộ điều khiển số lượng & Thành tiền */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-container-high/60">
                        <div className="flex items-center bg-surface-container rounded-lg p-0.5 shadow-inner">
                          <button
                            type="button"
                            onClick={() => decrementQuantity(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-surface hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                            aria-label="Giảm số lượng"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {item.quantity === 1 ? "delete" : "remove"}
                            </span>
                          </button>
                          <span className="font-label-lg text-label-lg text-on-surface w-7 text-center font-bold select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => incrementQuantity(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-surface hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                            aria-label="Tăng số lượng"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              add
                            </span>
                          </button>
                        </div>

                        <div className="text-right flex-shrink-0 whitespace-nowrap pl-2">
                          <div className="font-price-lg text-price-lg text-primary font-bold whitespace-nowrap">
                            {formatVnd(item.lineTotalVnd)}
                          </div>
                          <div className="text-[11px] text-outline font-body-sm">
                            {formatVnd(item.unitPriceVnd)} × {item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================================================================== */}
        {/* FOOTER: MÃ KHUYẾN MÃI, TRẠNG THÁI AUTH & NÚT TIẾN HÀNH ĐẶT HÀNG */}
        {/* ================================================================== */}
        {items.length > 0 && (
          <div className="p-space-lg bg-surface-container-lowest flex-shrink-0 border-t border-surface-container-high shadow-[0_-4px_16px_rgba(44,32,24,0.04)] z-10 space-y-3">
            {/* Ô nhập Mã khuyến mãi tùy chọn (`couponCode` — API Contract v2.1 Mục 8.2 & 8.4) */}
            <div className="space-y-1">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[18px]">
                      sell
                    </span>
                  </span>
                  <input
                    id="couponCodeInput"
                    name="couponCode"
                    type="text"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    placeholder="Mã khuyến mãi tùy chọn (vd: WELCOME20)"
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface placeholder:text-outline font-label-md text-label-md rounded-lg focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider"
                  />
                </div>
                {couponInput.trim() && (
                  <button
                    type="button"
                    onClick={() => setCouponInput("")}
                    className="px-2.5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md text-[11px] rounded-lg transition-colors cursor-pointer"
                  >
                    Xóa mã
                  </button>
                )}
              </div>
              <p className="font-body-sm text-[11px] text-outline leading-tight">
                * Mã gợi ý kiểm thử: <strong>WELCOME20</strong> (-20.000đ) hoặc{" "}
                <strong>BREW10</strong> (-10%).
              </p>
            </div>

            {/* Trạng thái xác thực (Auth Status Indicator — kiểm tra trước khi Checkout) */}
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-2 text-body-sm">
              <div className="flex items-center gap-1.5 text-on-surface-variant min-w-0">
                <span
                  className={`material-symbols-outlined text-[18px] flex-shrink-0 ${
                    authUser ? "text-primary" : "text-tertiary"
                  }`}
                >
                  {authUser ? "verified_user" : "lock"}
                </span>
                {authUser ? (
                  <span className="truncate text-[12px]">
                    Thành viên:{" "}
                    <strong className="text-on-surface">
                      {authUser.fullName || authUser.email}
                    </strong>
                  </span>
                ) : (
                  <span className="truncate text-[12px]">
                    Chưa đăng nhập{" "}
                    <span className="text-outline">(Cần login để đặt hàng)</span>
                  </span>
                )}
              </div>

              {authUser ? (
                <button
                  type="button"
                  onClick={() => {
                    clearAuthSession();
                    setAuthUser(null);
                  }}
                  className="text-secondary hover:underline font-label-md text-[11px] flex-shrink-0 cursor-pointer"
                >
                  Đăng xuất
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    requestOpenAuthModal({
                      mode: "login",
                      returnToCheckout: true,
                    })
                  }
                  className="text-primary hover:underline font-label-md text-[11px] font-bold flex-shrink-0 cursor-pointer"
                >
                  Đăng nhập →
                </button>
              )}
            </div>

            <div className="pt-1 space-y-2">
              <div className="flex justify-between items-baseline gap-3">
                <div>
                  <span className="font-title-sm text-title-sm text-on-surface font-bold">
                    Tạm tính ({totalQuantity} món)
                  </span>
                  <span className="block font-body-sm text-[11px] text-outline leading-tight">
                    Giá cuối cùng và khuyến mãi sẽ được máy chủ xác nhận khi đặt
                    hàng.
                  </span>
                </div>
                <div className="text-right flex-shrink-0 whitespace-nowrap pl-2">
                  <span
                    id="subtotalAmount"
                    className="font-headline-md text-headline-md text-primary font-bold whitespace-nowrap inline-block"
                  >
                    {formattedSubtotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Nút hành động Đặt hàng (Checkout CTA) */}
            <button
              id="btnCheckoutAction"
              type="button"
              onClick={handleCheckoutClick}
              className="w-full py-3.5 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-xl font-title-sm text-title-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  shopping_bag_speed
                </span>
                <span>
                  {authUser
                    ? "Tiến hành đặt hàng"
                    : "Đăng nhập để đặt hàng"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-price-lg whitespace-nowrap">
                  {formattedSubtotal}
                </span>
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </div>
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* HỘP THOẠI XÁC NHẬN XÓA TẤT CẢ */}
        {/* ================================================================== */}
        {confirmClearOpen && (
          <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-xl p-5 shadow-2xl max-w-sm w-full text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">
                  delete_forever
                </span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface">
                  Xóa toàn bộ giỏ hàng?
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Tất cả các món bạn đã chọn sẽ được xóa khỏi giỏ. Bạn có chắc
                  chắn muốn tiếp tục?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="flex-1 py-2 px-3 rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setConfirmClearOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-error text-on-primary font-label-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MÀN HÌNH CHECKOUT REVIEW & GỌI `POST /orders` (API CONTRACT v2.1 MỤC 8) */}
        {/* ================================================================== */}
        {checkoutStep === "review" && (
          <div className="absolute inset-0 bg-surface-container-lowest flex flex-col justify-between z-50 overflow-hidden">
            {/* Header màn hình Checkout */}
            <div className="p-space-lg border-b border-surface-container-high flex items-center justify-between bg-surface-container-lowest">
              <button
                type="button"
                disabled={isSubmittingOrder}
                onClick={() => {
                  setCheckoutStep("closed");
                  setOrderError(null);
                }}
                className="flex items-center gap-1 text-on-surface-variant hover:text-primary font-label-md text-label-md cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_back
                </span>
                <span>Quay lại Giỏ hàng</span>
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-[11px] font-bold">
                Bước Checkout • POST /orders
              </span>
            </div>

            {/* Nội dung chi tiết Checkout */}
            <div className="flex-1 overflow-y-auto p-space-lg space-y-4">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Xác nhận khởi tạo đơn hàng
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Kiểm tra danh sách món và gửi yêu cầu tạo đơn{" "}
                  <strong>PENDING</strong> lên máy chủ theo API Contract v2.1.
                </p>
              </div>

              {/* Thông tin khách hàng đã xác thực JWT */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    verified_user
                  </span>
                  <div className="min-w-0">
                    <p className="font-label-md text-[12px] text-on-surface font-bold truncate">
                      {authUser?.fullName || authUser?.email || "Khách hàng"}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                      {authUser?.email} • Đã đính kèm Bearer JWT
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-md text-[10px] font-semibold flex-shrink-0">
                  Auth OK
                </span>
              </div>

              {/* Tóm tắt các dòng món trong Cart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    Danh sách món ({items.length} dòng • {totalQuantity} ly)
                  </span>
                  <span className="font-label-md text-[12px] text-primary font-bold">
                    Tạm tính: {formattedSubtotal}
                  </span>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-surface border border-outline-variant/30 flex items-start justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface truncate">
                          {idx + 1}. {item.productName}{" "}
                          <span className="text-primary">
                            ({item.size === "ONE_SIZE" ? "ONE_SIZE" : `Size ${item.size}`})
                          </span>{" "}
                          × {item.quantity}
                        </p>
                        {item.toppings.length > 0 && (
                          <p className="text-[11px] text-on-surface-variant truncate">
                            Topping:{" "}
                            {item.toppings.map((t) => t.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-primary whitespace-nowrap">
                        {formatVnd(item.lineTotalVnd)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ô nhập / chỉnh sửa Coupon Code ngay tại bước Checkout */}
              <div className="space-y-1">
                <label
                  htmlFor="checkoutCouponInput"
                  className="font-label-md text-[12px] text-on-surface font-semibold block"
                >
                  Mã khuyến mãi (couponCode - không bắt buộc)
                </label>
                <input
                  id="checkoutCouponInput"
                  type="text"
                  disabled={isSubmittingOrder}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (vd: WELCOME20) hoặc để trống"
                  className="w-full px-3 py-2 bg-surface-container-low text-on-surface placeholder:text-outline font-label-md text-label-md rounded-lg focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                />
              </div>

              {/* Khung hiển thị LỖI nếu `POST /orders` trả về 400 / 401 / 409 / 500 (Mục 8.7) */}
              {orderError && (
                <div
                  role="alert"
                  id="checkoutOrderErrorAlert"
                  className="p-3.5 rounded-xl bg-error-container text-on-error-container space-y-2 text-[12px]"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="material-symbols-outlined text-[18px] text-error">
                        error
                      </span>
                      <span>
                         Không thể tạo đơn hàng
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest/80 font-mono text-[11px] font-semibold">
                      HTTP {orderError.statusCode}
                      {orderError.code ? ` • ${orderError.code}` : ""}
                    </span>
                  </div>

                  {/* Phân loại hiển thị dựa trên `code` và `details` theo đúng Mục 8.7 */}
                  {orderError.code === "UNAUTHORIZED" && (
                    <div className="space-y-2">
                      <p>
                        Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Giỏ hàng
                        của bạn vẫn được giữ nguyên (Mục 7.5 &amp; 9.2).
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutStep("closed");
                          requestOpenAuthModal({
                            mode: "login",
                            returnToCheckout: true,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-[11px] cursor-pointer"
                      >
                        Đăng nhập lại để tiếp tục Checkout →
                      </button>
                    </div>
                  )}

                  {orderError.code === "INVALID_COUPON" && (
                    <p>
                      Mã khuyến mãi <strong>{couponInput.trim()}</strong> không
                      tồn tại hoặc chưa đủ điều kiện áp dụng. Vui lòng xóa hoặc
                      đổi mã khác.
                    </p>
                  )}

                  {orderError.code === "INVALID_CART" &&
                    Array.isArray(orderError.details) && (
                      <ul className="list-disc pl-4 space-y-1">
                        {(orderError.details as InvalidCartDetail[]).map(
                          (detail, idx) => (
                            <li key={idx}>
                              Dòng món #{Number(detail.itemIndex) + 1}:{" "}
                              {describeInvalidCartReason(String(detail.reason))}
                            </li>
                          )
                        )}
                      </ul>
                    )}

                  {orderError.code === "INSUFFICIENT_STOCK" &&
                    Array.isArray(orderError.details) && (
                      <ul className="list-disc pl-4 space-y-1">
                        {(orderError.details as InsufficientStockDetail[]).map(
                          (detail, idx) => (
                            <li key={idx}>
                              Sản phẩm ({detail.productId}): Yêu cầu{" "}
                              <strong>{detail.requestedQuantity}</strong> ly
                              nhưng tồn kho chỉ còn{" "}
                              <strong>{detail.availableQuantity}</strong> ly.
                            </li>
                          )
                        )}
                      </ul>
                    )}

                  {orderError.code === "PENDING_ORDER_EXISTS" && (
                    <p>
                      Tài khoản của bạn đang có một đơn hàng ở trạng thái{" "}
                      <strong>PENDING</strong> chưa hoàn tất.
                    </p>
                  )}

                  {(!orderError.code ||
                    orderError.code === "VALIDATION_ERROR") && (
                    <p>
                      {Array.isArray(orderError.message)
                        ? orderError.message.join("; ")
                        : orderError.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer nút bấm Gọi `POST /orders` */}
            <div className="p-space-lg border-t border-surface-container-high bg-surface-container-lowest space-y-2">
              <button
                id="btnConfirmCreateOrder"
                type="button"
                disabled={isSubmittingOrder}
                onClick={handleConfirmCreateOrder}
                className="w-full py-3.5 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-xl font-title-sm text-title-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isSubmittingOrder ? "animate-spin" : ""
                  }`}
                >
                  {isSubmittingOrder ? "progress_activity" : "send"}
                </span>
                <span>
                  {isSubmittingOrder
                    ? "Đang gửi POST /orders..."
                    : "Xác nhận đặt hàng (POST /orders)"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MÀN HÌNH KẾT QUẢ THÀNH CÔNG (`201 Created` — NHẬN ORDER `PENDING`) */}
        {/* ================================================================== */}
        {checkoutStep === "success" && createdOrder && (
          <div
            id="orderCreatedSuccessView"
            className="absolute inset-0 bg-surface-container-lowest flex flex-col justify-between z-50 overflow-hidden"
          >
            {/* Header kết quả Order */}
            <div className="p-space-lg border-b border-surface-container-high flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  receipt_long
                </span>
                <span className="font-title-sm text-title-sm font-bold text-on-surface">
                  Đơn hàng đã khởi tạo
                </span>
              </div>
              <span
                id="orderStatusBadge"
                className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] font-bold tracking-wider uppercase"
              >
                {createdOrder.status}
              </span>
            </div>

            {/* Nội dung chi tiết Order PENDING từ Server (Mục 8.6 & 9.3) */}
            <div className="flex-1 overflow-y-auto p-space-lg space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">
                    check_circle
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Tạo đơn hàng thành công!
                </h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  Mã đơn (Order ID):{" "}
                  <span className="font-mono font-semibold text-on-surface break-all">
                    {createdOrder.id}
                  </span>
                </p>
                <p className="font-body-sm text-[11px] text-outline">
                  Thời gian tạo (UTC): {createdOrder.createdAt}
                </p>
              </div>

              {/* Ghi chú phạm vi Sprint 2 vs Sprint 3 (chưa làm Payment) */}
              <div className="p-3 rounded-lg bg-tertiary-fixed/50 text-on-tertiary-fixed-variant text-[12px] flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-tertiary flex-shrink-0 mt-0.5">
                  schedule
                </span>
                <div>
                  <p className="font-semibold">
                    Trạng thái đơn hàng: {createdOrder.status}
                  </p>
                  <p className="text-[11px] leading-relaxed mt-0.5">
                    Theo API Contract v2.1 (Mục 8.1, 8.6 &amp; 10), đơn hàng mới
                    được khởi tạo ở trạng thái <strong>PENDING</strong>. Chức
                    năng Thanh toán (<code>POST /payments</code>) thuộc phạm vi{" "}
                    <strong>Sprint 3</strong>.
                  </p>
                </div>
              </div>

              {/* Danh sách món Snapshot trả về từ Server */}
              <div className="space-y-2">
                <h4 className="font-label-md text-label-md text-on-surface font-bold">
                  Chi tiết món (Snapshot giá từ Server)
                </h4>
                <div className="space-y-2">
                  {createdOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-surface border border-outline-variant/30 space-y-1 text-[12px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-on-surface">
                          {item.productName}{" "}
                          <span className="text-primary font-medium">
                            ({item.size} • {item.sizeMultiplierPercent}%)
                          </span>{" "}
                          × {item.quantity}
                        </span>
                        <span className="font-bold text-primary whitespace-nowrap">
                          {formatVnd(item.lineTotalVnd)}
                        </span>
                      </div>
                      <p className="text-[11px] text-outline">
                        Giá gốc: {formatVnd(item.basePriceVnd)} • Đơn giá 1 ly:{" "}
                        {formatVnd(item.unitPriceVnd)}
                      </p>
                      {item.toppings && item.toppings.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.toppings.map((top) => (
                            <span
                              key={top.id}
                              className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-on-surface-variant"
                            >
                              + {top.name} ({formatVnd(top.priceVnd)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng kết tài chính từ Server (`subtotalVnd`, `discountVnd`, `totalVnd`) */}
              <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1.5 text-[13px]">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Tạm tính (subtotalVnd):</span>
                  <span className="font-semibold text-on-surface">
                    {formatVnd(createdOrder.subtotalVnd)}
                  </span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>
                    Giảm giá (discountVnd
                    {createdOrder.couponCode
                      ? ` • Mã: ${createdOrder.couponCode}`
                      : ""}
                    ):
                  </span>
                  <span className="font-semibold text-secondary">
                    -{formatVnd(createdOrder.discountVnd)}
                  </span>
                </div>
                <div className="pt-2 border-t border-outline-variant/40 flex justify-between items-baseline">
                  <span className="font-bold text-on-surface">
                    Tổng cộng (totalVnd):
                  </span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    {formatVnd(createdOrder.totalVnd)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer đóng màn hình xác nhận Order */}
            <div className="p-space-lg border-t border-surface-container-high bg-surface-container-lowest">
              <button
                type="button"
                onClick={handleCloseSuccessModal}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm font-semibold transition-colors cursor-pointer"
              >
                Hoàn tất &amp; Quay lại Thực đơn
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
