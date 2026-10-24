"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { FALLBACK_DRINK_IMAGE, formatVnd } from "@/services/api.service";

export default function CartDrawer() {
  const {
    items,
    totalQuantity,
    subtotalVnd,
    formattedSubtotal,
    isCartOpen,
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
  const [checkoutNoticeOpen, setCheckoutNoticeOpen] = useState(false);

  // Khóa cuộn trang nền khi Cart Drawer đang mở
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setConfirmClearOpen(false);
      setCheckoutNoticeOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // Xử lý phím Escape để đóng drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
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

  const handleCheckoutClick = () => {
    if (items.length === 0) return;
    setCheckoutNoticeOpen(true);
  };

  return (
    <>
      {/* 1. LỚP PHỦ MỜ (SCRIM / BACKDROP) */}
      <div
        id="cartDrawerScrim"
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 bg-inverse-surface/30 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
              className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              <span>Quay lại Thực đơn</span>
            </button>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
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
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
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
              Thông tin giỏ hàng sẽ được máy chủ kiểm tra tình trạng tồn kho khi
              tiến hành đặt hàng.
            </span>
          </div>

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
                  ? "Tiêu chuẩn"
                  : `Size ${item.size}`;

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-surface rounded-xl shadow-[0_2px_12px_rgba(44,32,24,0.04)] hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-start gap-3">
                    {/* Ảnh sản phẩm */}
                    <div
                      className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0 shadow-sm border border-outline-variant/30 overflow-hidden bg-surface-container"
                    >
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
        {/* FOOTER: TỔNG TIỀN TẠM TÍNH & NÚT TIẾN HÀNH ĐẶT HÀNG */}
        {/* ================================================================== */}
        {items.length > 0 && (
          <div className="p-space-lg bg-surface-container-lowest flex-shrink-0 border-t border-surface-container-high shadow-[0_-4px_16px_rgba(44,32,24,0.04)] z-10 space-y-3">
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
                <span>Tiến hành đặt hàng</span>
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

        {/* Modal thông báo Checkout / Payload Mapping Ready */}
        {checkoutNoticeOpen && (
          <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">
                  check_circle
                </span>
              </div>
              <div className="text-center">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">
                  Sẵn sàng chuyển sang Đặt hàng
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Giỏ hàng đã sẵn sàng payload theo chuẩn API Contract v2.1 (
                  {totalQuantity} món, {items.length} dòng). Luồng Checkout &
                  Auth đang được hoàn thiện ở các task tiếp theo (SCRUM-41 &
                  SCRUM-42).
                </p>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-lg text-left text-[11px] font-mono text-on-surface-variant max-h-32 overflow-y-auto">
                <pre>
                  {JSON.stringify(mapToCreateOrderPayload(), null, 2)}
                </pre>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutNoticeOpen(false)}
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
