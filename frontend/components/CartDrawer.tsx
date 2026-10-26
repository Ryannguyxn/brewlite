"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { FALLBACK_DRINK_IMAGE, formatVnd } from "@/services/api.service";
import { getDisplayCustomerName } from "@/services/auth.service";
import {
  createOrderApi,
  type OrderServiceError,
} from "@/services/order.service";

type CheckoutDrawerStep = "cart" | "review";

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

  const {
    user,
    accessToken,
    isAuthenticated,
    pendingCheckout,
    setPendingCheckout,
    openAuthModal,
    verifySession,
    handleUnauthorizedCheckout,
  } = useAuth();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutDrawerStep>("cart");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [scrum44NoticeOpen, setScrum44NoticeOpen] = useState(false);
  const [voucherNoticeVisible, setVoucherNoticeVisible] = useState(false);
  const submittingRef = useRef(false);

  // Tính toán bước hiển thị thực tế mà không cần gọi setState đồng bộ trong useEffect
  const activeStep: CheckoutDrawerStep =
    checkoutStep === "review" && (items.length === 0 || !isAuthenticated)
      ? "cart"
      : checkoutStep;

  const handleCloseDrawer = () => {
    setConfirmClearOpen(false);
    setScrum44NoticeOpen(false);
    setVoucherNoticeVisible(false);
    closeCart();
  };

  // Khóa cuộn trang nền khi Cart Drawer đang mở
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // Xử lý phím Escape để đóng drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        setConfirmClearOpen(false);
        setScrum44NoticeOpen(false);
        setVoucherNoticeVisible(false);
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Tự động tắt feedback sau 3s
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        dismissFeedback();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage, dismissFeedback]);

  // Tự động ẩn thông báo Voucher sau 4s
  useEffect(() => {
    if (voucherNoticeVisible) {
      const timer = setTimeout(() => {
        setVoucherNoticeVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [voucherNoticeVisible]);

  // Tự động chuyển sang bước Checkout ("review") ngay sau khi khách đăng nhập thành công từ luồng Checkout
  // Tuân thủ AC-US-CART-04-02 & UC-CART-001 AF-06: Giỏ hàng được bảo toàn nguyên vẹn qua bước Login
  useEffect(() => {
    if (isAuthenticated && pendingCheckout) {
      const timer = setTimeout(() => {
        setPendingCheckout(false);
        if (items.length > 0) {
          setVoucherNoticeVisible(false);
          setCheckoutStep("review");
          openCart();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [
    isAuthenticated,
    pendingCheckout,
    items.length,
    setPendingCheckout,
    openCart,
  ]);

  /**
   * Khi người dùng bấm vào ô nhập Voucher hoặc nút Áp dụng:
   * Không cho nhận ký tự và hiển thị thông báo chức năng sẽ phát triển sau
   */
  const handleVoucherAttempt = () => {
    setVoucherNoticeVisible(true);
  };

  /**
   * Bước 1 -> Bước 2: Khách nhấn "Tiến hành đặt hàng" từ Giỏ hàng
   * Kiểm tra giỏ hàng -> Kiểm tra trạng thái đăng nhập (JWT)
   */
  const handleProceedToCheckout = () => {
    if (items.length === 0) return;

    // Kiểm tra trạng thái xác thực & hạn dùng JWT
    const hasValidSession = verifySession();
    if (!hasValidSession || !isAuthenticated) {
      // AC-US-CART-04-02 & UC-CART-001 AF-06: Yêu cầu đăng nhập, giữ nguyên giỏ hàng
      openAuthModal("login", {
        resumeCheckout: true,
        reasonMessage:
          "Vui lòng đăng nhập tài khoản khách hàng để tiến hành đặt hàng. Giỏ hàng của bạn được giữ nguyên.",
      });
      return;
    }

    setVoucherNoticeVisible(false);
    setCheckoutStep("review");
  };

  /**
   * Bước 2 (Checkout) -> Gọi Create Order API (POST /orders) (SCRUM-43)
   * Phần xử lý loading/error UI chi tiết và hiển thị dữ liệu Order Response thuộc SCRUM-44
   */
  const handleConfirmCreateOrder = async () => {
    if (submittingRef.current) return;
    if (items.length === 0) {
      setCheckoutStep("cart");
      return;
    }

    // Kiểm tra lại phiên đăng nhập trước khi gọi API
    const sessionOk = verifySession();
    if (!sessionOk || !accessToken) {
      setCheckoutStep("cart");
      handleUnauthorizedCheckout(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục đặt hàng (giỏ hàng của bạn vẫn được giữ nguyên)."
      );
      return;
    }

    const payload = mapToCreateOrderPayload();
    submittingRef.current = true;

    try {
      await createOrderApi(payload, accessToken);
      // TUYỆT ĐỐI KHÔNG xóa giỏ hàng khi đơn ở trạng thái PENDING (AC-US-CART-04-02, BR-07, API Contract v3.0)
      // Hiển thị thông báo SCRUM-44 đang phát triển cho phần xử lý Order Response
      setScrum44NoticeOpen(true);
    } catch (err: unknown) {
      const orderErr = err as Partial<OrderServiceError>;
      if (orderErr?.statusCode === 401 || orderErr?.code === "UNAUTHORIZED") {
        // 401 UNAUTHORIZED: Xóa phiên hết hạn, giữ nguyên giỏ hàng và mở Login modal
        setCheckoutStep("cart");
        handleUnauthorizedCheckout(
          "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để tiếp tục đặt hàng (giỏ hàng của bạn được giữ nguyên)."
        );
        return;
      }
      // Phần xử lý loading/error UI chi tiết và dữ liệu Order Response thuộc SCRUM-44
      setScrum44NoticeOpen(true);
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <>
      {/* 1. LỚP PHỦ MỜ (SCRIM / BACKDROP) */}
      <div
        id="cartDrawerScrim"
        aria-hidden="true"
        onClick={handleCloseDrawer}
        className={`fixed inset-0 bg-inverse-surface/30 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isCartOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 2. KHUNG NỘI DUNG GIỎ HÀNG & CHECKOUT TRƯỢT TỪ BÊN PHẢI */}
      <aside
        id="cartDrawerPanel"
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng và Đặt hàng"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] max-w-full bg-surface-container-lowest shadow-[-12px_0_40px_rgba(30,21,16,0.18)] flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out transform ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ================================================================== */}
        {/* HEADER GIỎ HÀNG / CHECKOUT */}
        {/* ================================================================== */}
        <div className="p-space-lg bg-surface-container-lowest flex-shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.03)] z-10">
          <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-surface-container-high gap-2">
            {activeStep === "review" ? (
              <button
                id="btnBackToCartStep"
                type="button"
                onClick={() => {
                  setVoucherNoticeVisible(false);
                  setCheckoutStep("cart");
                }}
                className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_back
                </span>
                <span>Quay lại Giỏ hàng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_back
                </span>
                <span>Quay lại Thực đơn</span>
              </button>
            )}

            <div className="flex items-center gap-2 flex-shrink-0">
              {activeStep === "cart" && items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="text-outline hover:text-error transition-colors font-label-md text-label-md px-2 py-1 rounded hover:bg-surface-container-high cursor-pointer whitespace-nowrap"
                  title="Xóa toàn bộ giỏ hàng"
                >
                  Xóa tất cả
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface transition-colors cursor-pointer flex-shrink-0"
                aria-label="Đóng giỏ hàng"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          </div>

          {/* Tiêu đề theo từng bước của Checkout Flow (SCRUM-43) — không bị xuống dòng */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0">
                {activeStep === "review" ? "fact_check" : "shopping_cart"}
              </span>
              <h2 className="font-title-md text-title-md text-on-surface font-bold tracking-tight whitespace-nowrap">
                {activeStep === "review"
                  ? "Xác nhận Đặt hàng"
                  : "Giỏ hàng của bạn"}
              </h2>
              <span
                id="cartCountBadge"
                className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-md text-[12px] font-semibold whitespace-nowrap flex-shrink-0"
              >
                ({totalQuantity} món)
              </span>
            </div>

            {/* Step Indicator gọn gàng, không xuống dòng */}
            <div className="flex items-center gap-1 text-[11px] font-label-md text-on-surface-variant whitespace-nowrap flex-shrink-0">
              <span
                className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                  activeStep === "cart"
                    ? "bg-primary text-on-primary font-semibold"
                    : "bg-surface-container"
                }`}
              >
                1. Giỏ
              </span>
              <span>→</span>
              <span
                className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                  activeStep === "review"
                    ? "bg-primary text-on-primary font-semibold"
                    : "bg-surface-container"
                }`}
              >
                2. Đặt hàng
              </span>
            </div>
          </div>

          {/* Thông báo quy tắc máy chủ theo API Contract v2.1 & Stitch UI */}
          {activeStep === "cart" && (
            <div
              id="cartServerAlert"
              className="mt-3 p-2.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-[12px] text-on-surface-variant flex items-start gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-tertiary flex-shrink-0">
                info
              </span>
              <span id="cartServerAlertMsg" className="leading-tight">
                Thông tin giỏ hàng sẽ được máy chủ kiểm tra tình trạng tồn kho
                và tính giá chính thức khi tiến hành đặt hàng.
              </span>
            </div>
          )}

          {/* Toast phản hồi nhanh trong drawer */}
          {feedbackMessage && (
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
        {/* BODY: RENDER THEO BƯỚC ("cart" | "review") */}
        {/* ================================================================== */}
        <div
          className="flex-1 overflow-y-auto px-space-lg py-space-sm space-y-3.5"
          id="cartContentContainer"
        >
          {/* -------------------------------------------------------------- */}
          {/* BƯỚC 1: GIỎ HÀNG ("cart") */}
          {/* -------------------------------------------------------------- */}
          {activeStep === "cart" && (
            <>
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
                    Khám phá các dòng cà phê thủ công đặc sản và bánh tươi để
                    thêm vào giỏ hàng ngay hôm nay!
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
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
                      ? "Tiêu chuẩn"
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
            </>
          )}

          {/* -------------------------------------------------------------- */}
          {/* BƯỚC 2: XÁC NHẬN ĐẶT HÀNG / CHECKOUT ("review") */}
          {/* -------------------------------------------------------------- */}
          {activeStep === "review" && (
            <div id="checkoutReviewSection" className="space-y-4 py-1">
              {/* Thông tin khách hàng đã xác thực */}
              <div
                id="checkoutCustomerCard"
                className="p-3.5 rounded-xl bg-surface border border-outline-variant/40 shadow-sm space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-label-md uppercase tracking-wider text-outline font-semibold whitespace-nowrap">
                    Tài khoản đặt hàng
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-medium whitespace-nowrap">
                    <span className="material-symbols-outlined text-[13px]">
                      verified_user
                    </span>
                    Đã xác thực
                  </span>
                </div>
                <div className="font-title-sm text-title-sm text-on-surface font-bold">
                  {getDisplayCustomerName(user)}
                </div>
                {user?.email && (
                  <div className="text-[12px] text-on-surface-variant">
                    {user.email}
                  </div>
                )}
              </div>

              {/* Tóm tắt danh sách món sẽ gửi lên POST /orders */}
              <div
                id="checkoutItemsSummary"
                className="p-3.5 rounded-xl bg-surface border border-outline-variant/40 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-surface-container-high">
                  <span className="font-title-sm text-title-sm text-on-surface font-bold whitespace-nowrap">
                    Chi tiết món ({items.length} dòng • {totalQuantity} ly)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherNoticeVisible(false);
                      setCheckoutStep("cart");
                    }}
                    className="text-[12px] font-label-md text-primary hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Chỉnh sửa giỏ
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const sizeLabel =
                      item.size === "ONE_SIZE"
                        ? "Tiêu chuẩn"
                        : `Size ${item.size}`;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 text-[13px] pb-2 border-b border-surface-container last:border-b-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-on-surface truncate">
                            {item.quantity}x {item.productName}
                          </div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">
                            {sizeLabel}
                            {item.toppings.length > 0
                              ? ` • +${item.toppings
                                  .map((t) => t.name)
                                  .join(", ")}`
                              : " • Không topping"}
                          </div>
                          {item.note && (
                            <div className="text-[11px] text-tertiary italic mt-0.5">
                              Ghi chú: {item.note}
                            </div>
                          )}
                        </div>
                        <div className="text-right whitespace-nowrap font-semibold text-primary">
                          {formatVnd(item.lineTotalVnd)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ô Mã ưu đãi / Voucher ở bước Checkout — Không cho nhận và thông báo phát triển sau */}
              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/40 shadow-sm space-y-2">
                <label
                  htmlFor="checkoutCouponInput"
                  className="block font-label-md text-[12px] text-on-surface font-semibold"
                >
                  Mã ưu đãi / Voucher
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
                      confirmation_number
                    </span>
                    <input
                      id="checkoutCouponInput"
                      type="text"
                      readOnly
                      value=""
                      onClick={handleVoucherAttempt}
                      onFocus={handleVoucherAttempt}
                      onKeyDown={(e) => {
                        e.preventDefault();
                        handleVoucherAttempt();
                      }}
                      placeholder="Nhập mã ưu đãi (Sắp ra mắt)"
                      className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg font-body-md text-on-surface-variant placeholder:text-outline focus:outline-none cursor-not-allowed text-[13px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVoucherAttempt}
                    className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface-variant font-label-md text-[12px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
                {voucherNoticeVisible && (
                  <div
                    id="checkoutVoucherDevNotice"
                    className="p-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-[11px] font-medium flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px] flex-shrink-0">
                      info
                    </span>
                    <span>
                      Chức năng nhập mã ưu đãi / Voucher hiện chưa hỗ trợ và sẽ
                      được phát triển ở giai đoạn sau.
                    </span>
                  </div>
                )}
              </div>

              {/* Lưu ý quy tắc nghiệp vụ giữ chỗ tồn kho & bảo toàn giỏ hàng */}
              <div
                id="checkoutPricingSummary"
                className="p-3 rounded-xl bg-surface-container-high/70 border border-outline-variant/40 text-[12px] text-on-surface-variant space-y-1"
              >
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    shield_lock
                  </span>
                  <span>Cam kết đồng bộ dữ liệu máy chủ</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Khi xác nhận, hệ thống gửi yêu cầu{" "}
                  <code className="font-mono text-primary">POST /orders</code>{" "}
                  theo chuẩn API Contract v3.0. Giỏ hàng của bạn vẫn được giữ
                  nguyên an toàn cho tới khi hoàn tất thanh toán.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* FOOTER: RENDER THEO BƯỚC ("cart" | "review") */}
        {/* ================================================================== */}
        {activeStep === "cart" && items.length > 0 && (
          <div className="p-space-lg bg-surface-container-lowest flex-shrink-0 border-t border-surface-container-high shadow-[0_-4px_16px_rgba(44,32,24,0.04)] z-10 space-y-3">
            {/* Ô Mã ưu đãi / Voucher — Không cho nhận ký tự và thông báo phát triển sau */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
                    confirmation_number
                  </span>
                  <input
                    id="couponCodeInput"
                    type="text"
                    readOnly
                    value=""
                    onClick={handleVoucherAttempt}
                    onFocus={handleVoucherAttempt}
                    onKeyDown={(e) => {
                      e.preventDefault();
                      handleVoucherAttempt();
                    }}
                    placeholder="Nhập mã ưu đãi (Sắp ra mắt)"
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg font-body-md text-[13px] text-on-surface-variant placeholder:text-outline focus:outline-none cursor-not-allowed transition-all"
                  />
                </div>
                <button
                  id="btnApplyVoucher"
                  type="button"
                  onClick={handleVoucherAttempt}
                  className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface-variant font-label-md text-[12px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
              {voucherNoticeVisible && (
                <div
                  id="cartVoucherDevNotice"
                  className="mt-1.5 p-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-[11px] font-medium flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px] flex-shrink-0">
                    info
                  </span>
                  <span>
                    Chức năng nhập mã ưu đãi / Voucher hiện chưa hỗ trợ và sẽ
                    được phát triển ở giai đoạn sau.
                  </span>
                </div>
              )}
            </div>

            {/* Trạng thái đăng nhập hiện tại (Auth Guard Indicator) */}
            <div
              id="cartAuthStatusBanner"
              className="px-3 py-2 rounded-lg bg-surface-container flex items-center justify-between gap-2 text-[12px]"
            >
              {isAuthenticated && user ? (
                <div className="flex items-center gap-1.5 text-on-surface truncate">
                  <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0">
                    account_circle
                  </span>
                  <span className="truncate">
                    Đặt hàng với tên:{" "}
                    <strong>{getDisplayCustomerName(user)}</strong>
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-tertiary flex-shrink-0">
                      lock
                    </span>
                    <span>Cần đăng nhập khi tiến hành đặt hàng</span>
                  </div>
                  <button
                    id="btnCartQuickLogin"
                    type="button"
                    onClick={() =>
                      openAuthModal("login", {
                        resumeCheckout: false,
                        reasonMessage:
                          "Đăng nhập để lưu thông tin và sẵn sàng đặt hàng. Giỏ hàng của bạn được giữ nguyên.",
                      })
                    }
                    className="text-primary font-label-md font-bold hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                </>
              )}
            </div>

            {/* Tổng tiền tạm tính */}
            <div className="pt-0.5 space-y-1">
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
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-xl font-title-sm text-title-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer whitespace-nowrap"
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="material-symbols-outlined text-[20px]">
                  shopping_bag_speed
                </span>
                <span>Tiến hành đặt hàng</span>
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap">
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

        {/* FOOTER BƯỚC 2: XÁC NHẬN ĐẶT HÀNG ("review") */}
        {activeStep === "review" && items.length > 0 && (
          <div className="p-space-lg bg-surface-container-lowest flex-shrink-0 border-t border-surface-container-high shadow-[0_-4px_16px_rgba(44,32,24,0.04)] z-10 space-y-3">
            <div className="flex justify-between items-baseline gap-3">
              <span className="font-title-sm text-title-sm text-on-surface font-bold whitespace-nowrap">
                Tổng tạm tính ({totalQuantity} ly)
              </span>
              <span className="font-headline-md text-headline-md text-primary font-bold whitespace-nowrap">
                {formattedSubtotal}
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setVoucherNoticeVisible(false);
                  setCheckoutStep("cart");
                }}
                className="px-4 py-3 rounded-xl border border-outline-variant text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                Quay lại
              </button>

              <button
                id="btnConfirmCreateOrder"
                type="button"
                onClick={handleConfirmCreateOrder}
                className="flex-1 py-3 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-title-sm text-title-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">
                  check_circle
                </span>
                <span className="whitespace-nowrap">Xác nhận Đặt hàng</span>
              </button>
            </div>
          </div>
        )}

        {/* Hộp thoại xác nhận Xóa tất cả */}
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

        {/* Modal thông báo SCRUM-44 đang phát triển (Integrate Cart with Order flow: xử lý loading/error và dữ liệu order response) */}
        {scrum44NoticeOpen && (
          <div
            id="scrum44NoticeModal"
            className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <div className="bg-surface rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">
                  construction
                </span>
              </div>
              <div className="text-center">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">
                  Đã gọi Create Order (POST /orders)
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                  Luồng Checkout (Cart → yêu cầu Login nếu chưa xác thực →
                  Checkout → gọi <code className="font-mono">POST /orders</code>
                  ) của <strong>SCRUM-43</strong> đã thực thi. Chức năng{" "}
                  <strong>
                    Integrate Cart with Order flow: xử lý loading/error và dữ
                    liệu order response
                  </strong>{" "}
                  hiện đang được phát triển cho <strong>SCRUM-44</strong>.
                </p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-lg text-left text-[11px] font-mono text-on-surface-variant max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(mapToCreateOrderPayload(), null, 2)}</pre>
              </div>
              <button
                type="button"
                onClick={() => setScrum44NoticeOpen(false)}
                className="w-full py-2.5 px-3 rounded-lg bg-primary text-on-primary font-label-md hover:bg-primary-container transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
