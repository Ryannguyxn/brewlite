"use client";

import React, { useState } from "react";
import {
  MOCK_CART_CONFIG,
  MOCK_INITIAL_CART_ITEMS,
  MOCK_UPSELL_OFFER,
  type CartConfig,
  type CartItem,
  type UpsellOffer,
} from "@/mock-data";
import { createOrderMock } from "@/services/api.service";

export type { CartItem };
export const INITIAL_CART_ITEMS = MOCK_INITIAL_CART_ITEMS;

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  upsellOffer?: UpsellOffer;
  cartConfig?: CartConfig;
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onRestoreDefaultCart: () => void;
  onAddUpsell: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  upsellOffer = MOCK_UPSELL_OFFER,
  cartConfig = MOCK_CART_CONFIG,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onRestoreDefaultCart,
  onAddUpsell,
}: CartDrawerProps) {
  const [isMockEmpty, setIsMockEmpty] = useState(false);
  const [voucherCode, setVoucherCode] = useState(cartConfig.defaultVoucherCode);
  const [discount, setDiscount] = useState(cartConfig.defaultMemberDiscount);

  const visibleItems = isMockEmpty ? [] : items;
  const isEmpty = visibleItems.length === 0;
  const itemCount = visibleItems.length;
  const subtotal = visibleItems.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0
  );
  const freeshipThreshold = cartConfig.freeshipThreshold;
  const freeshipProgress = Math.min(
    100,
    Math.round((subtotal / freeshipThreshold) * 100)
  );
  const amountToFreeship = Math.max(0, freeshipThreshold - subtotal);
  const shippingFee =
    subtotal === 0
      ? 0
      : subtotal >= freeshipThreshold
      ? 0
      : cartConfig.defaultShippingFee;
  const appliedDiscount = subtotal > 0 ? discount : 0;
  const totalAmount = Math.max(0, subtotal - appliedDiscount + shippingFee);

  const toggleMockEmptyState = () => {
    if (isEmpty) {
      if (items.length === 0) {
        onRestoreDefaultCart();
      }
      setIsMockEmpty(false);
    } else {
      setIsMockEmpty(true);
    }
  };

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (code) {
      // TODO: Thay thế kiểm tra voucher này bằng axios.post('/api/vouchers/validate', { code })
      setDiscount(cartConfig.defaultMemberDiscount);
      alert(`Đã áp dụng thành công mã ưu đãi ${code} (-20.000đ)`);
    } else {
      setDiscount(0);
    }
  };

  const handleCheckout = async () => {
    // TODO: Thay thế hàm createOrderMock bên trong services/api.service.ts bằng axios.post('/orders', ...)
    const res = await createOrderMock({
      items: visibleItems,
      voucherCode,
      totalAmount,
    });
    alert(
      `Đơn hàng #${res.orderId} (${res.status}) đã tạo! Đang tiến hành tạo mã thanh toán VietQR & chuyển sang cổng giao dịch an toàn...`
    );
  };

  return (
    <>
      {/* Translucent Scrim / Overlay */}
      <div
        className={`fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel (440px Desktop Specification) */}
      <aside
        className={`fixed right-0 top-0 bottom-0 w-[440px] max-w-full bg-surface-container-lowest z-50 shadow-[-12px_0_40px_rgba(30,21,16,0.18)] flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* DRAWER TOP HEADER */}
        <div className="p-space-lg bg-surface-container-lowest flex-shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.03)] z-10">
          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[26px]">
                shopping_bag
              </span>
              <div>
                <h2 className="font-title-md text-title-md text-on-surface font-bold tracking-tight">
                  Giỏ hàng của bạn
                </h2>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  {isEmpty ? "0 món" : `${itemCount} món đã chọn`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <button
                className="text-outline hover:text-error transition-colors font-label-md text-label-md px-2 py-1 rounded hover:bg-surface-container-high cursor-pointer"
                onClick={onClearCart}
                title="Xóa toàn bộ"
                type="button"
              >
                Xóa tất cả
              </button>
              <button
                aria-label="Đóng giỏ hàng"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
                onClick={onClose}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          </div>

          {/* FREE SHIPPING PROGRESS COMPONENT */}
          <div className="bg-surface-container-low rounded-xl p-3.5 mt-space-xs shadow-sm">
            <div className="flex items-center justify-between font-label-md text-label-md mb-2">
              <span className="flex items-center gap-1.5 text-tertiary font-semibold">
                <span className="material-symbols-outlined text-[18px] text-tertiary">
                  local_shipping
                </span>
                Freeship đơn từ {formatVND(freeshipThreshold)}
              </span>
              <span className="text-primary font-bold">
                {freeshipProgress}%
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-secondary-container via-primary to-primary-container h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${freeshipProgress}%` }}
              />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">
                {amountToFreeship > 0 ? "add_circle" : "check_circle"}
              </span>
              {amountToFreeship > 0 ? (
                <>
                  Mua thêm{" "}
                  <strong className="text-on-surface font-semibold">
                    {formatVND(amountToFreeship)}
                  </strong>{" "}
                  để được{" "}
                  <span className="text-tertiary font-medium">
                    Miễn phí giao hàng!
                  </span>
                </>
              ) : (
                <span className="text-tertiary font-medium">
                  Đơn hàng của bạn đã đủ điều kiện Miễn phí giao hàng!
                </span>
              )}
            </p>
          </div>

          {/* Quick Toggle: Preview Empty State button */}
          <div className="flex items-center justify-between pt-2">
            <span className="font-body-sm text-[11px] text-outline">
              Chế độ kiểm tra giao diện:
            </span>
            <button
              className="font-label-md text-[11px] text-secondary hover:underline cursor-pointer flex items-center gap-1"
              onClick={toggleMockEmptyState}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">
                swap_horiz
              </span>
              <span>{isEmpty ? "Khôi phục giỏ" : "Xem lúc giỏ trống"}</span>
            </button>
          </div>
        </div>

        {/* DRAWER SCROLLABLE BODY / ITEMS LIST */}
        <div className="flex-1 overflow-y-auto px-space-lg py-space-sm space-y-3.5">
          {!isEmpty ? (
            <>
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-surface rounded-xl shadow-[0_2px_12px_rgba(44,32,24,0.04)] hover:shadow-md transition-shadow relative group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0 shadow-sm"
                      title={item.imageAlt}
                      style={{ backgroundImage: `url('${item.image}')` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-title-sm text-title-sm text-on-surface font-semibold truncate leading-tight">
                          {item.name}
                        </h4>
                        <button
                          className="text-outline-variant hover:text-error transition-colors p-0.5 rounded cursor-pointer"
                          onClick={() => onRemoveItem(item.id)}
                          title="Xóa món này"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>

                      {/* Customizations List */}
                      <div className="mt-1 space-y-0.5 text-on-surface-variant font-body-sm text-body-sm text-[12px] leading-relaxed">
                        {item.customizations.map((c, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-1.5 ${
                              c.muted ? "text-outline" : ""
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`}
                            />
                            <span>{c.text}</span>
                          </div>
                        ))}
                      </div>

                      {/* Quantity Stepper and Subtotal Row */}
                      <div className="flex items-center justify-between mt-3 pt-2">
                        <div className="flex items-center bg-surface-container rounded-lg p-0.5 shadow-inner">
                          <button
                            aria-label="Giảm số lượng"
                            className={`w-7 h-7 flex items-center justify-center rounded bg-surface hover:bg-surface-container-high transition-colors cursor-pointer ${
                              item.qty === 1 ? "text-error" : "text-on-surface"
                            }`}
                            onClick={() => onUpdateQty(item.id, -1)}
                            title={
                              item.qty === 1 ? "Bỏ món này" : "Giảm số lượng"
                            }
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {item.qty === 1 ? "delete" : "remove"}
                            </span>
                          </button>
                          <span className="font-label-lg text-label-lg text-on-surface w-7 text-center">
                            {item.qty}
                          </span>
                          <button
                            aria-label="Tăng số lượng"
                            className="w-7 h-7 flex items-center justify-center rounded bg-surface hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                            onClick={() => onUpdateQty(item.id, 1)}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              add
                            </span>
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="font-price-lg text-price-lg text-primary font-bold">
                            {formatVND(item.unitPrice * item.qty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* UP-SELL MINI BANNER / RECOMMENDATION */}
              <div className="p-3 bg-secondary-fixed/40 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[24px]">
                  coffee_maker
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-title-sm text-[13px] text-on-secondary-fixed font-semibold leading-tight">
                    {upsellOffer.title}
                  </p>
                  <p className="font-body-sm text-[11px] text-on-secondary-fixed-variant leading-tight">
                    {upsellOffer.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsMockEmpty(false);
                    onAddUpsell();
                  }}
                  className="px-3 py-1 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary transition-colors flex-shrink-0 cursor-pointer"
                  type="button"
                >
                  + Thêm
                </button>
              </div>
            </>
          ) : (
            /* MOCK EMPTY STATE VIEW */
            <div className="flex flex-col items-center justify-center text-center py-12 px-space-md bg-surface-container-low rounded-xl">
              <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-space-md text-outline">
                <span className="material-symbols-outlined text-[40px] text-primary">
                  local_cafe
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mb-1">
                Giỏ hàng trống
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mb-space-lg">
                Hãy chọn một ly cà phê thơm ngon từ menu đặc sản để bắt đầu ngày
                mới tràn đầy cảm hứng!
              </p>
              <button
                className="px-6 py-2.5 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary-container transition-colors cursor-pointer"
                onClick={onClose}
                type="button"
              >
                Khám phá thực đơn ngay
              </button>
            </div>
          )}
        </div>

        {/* DRAWER PINNED BOTTOM SECTION (Summary & Action) */}
        <div
          className={`bg-surface-container-lowest p-space-lg shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex-shrink-0 z-20 space-y-space-sm transition-opacity ${
            isEmpty ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {/* Voucher Input Bar */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[18px]">
                  sell
                </span>
              </span>
              <input
                className="w-full pl-9 pr-3 py-2 bg-surface-container-low text-on-surface placeholder:text-outline font-label-md text-label-md rounded-lg focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider"
                placeholder="Nhập mã ưu đãi BREW..."
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
            </div>
            <button
              className="px-4 py-2 bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors flex-shrink-0 cursor-pointer"
              onClick={handleApplyVoucher}
              type="button"
            >
              Áp dụng
            </button>
          </div>

          {/* Financial Calculation Rows */}
          <div className="pt-2 space-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex justify-between items-center">
              <span>Tạm tính ({itemCount} món)</span>
              <span className="font-label-lg text-label-lg text-on-surface">
                {formatVND(subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-primary font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  stars
                </span>
                Giảm giá thành viên (Hải Đăng)
              </span>
              <span>-{formatVND(appliedDiscount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <span>Phí giao hàng</span>
                <span
                  className="material-symbols-outlined text-outline text-[14px]"
                  title="Khoảng cách 2.4km từ chi nhánh Saigon Center"
                >
                  help_outline
                </span>
              </span>
              <span className="text-on-surface font-label-md">
                {shippingFee === 0 && subtotal > 0
                  ? "Miễn phí"
                  : formatVND(shippingFee)}
              </span>
            </div>

            {/* Total Calculation Divider & Highlight */}
            <div className="pt-2 mt-2 flex justify-between items-baseline">
              <div>
                <span className="font-title-sm text-title-sm text-on-surface font-bold">
                  Tổng thanh toán
                </span>
                <span className="block font-body-sm text-[11px] text-outline leading-tight">
                  {cartConfig.taxNotice}
                </span>
              </div>
              <div className="text-right">
                <span className="font-headline-md text-headline-md text-primary font-bold">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout CTA Button */}
          <button
            className="w-full py-3.5 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-xl font-title-sm text-title-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
            onClick={handleCheckout}
            type="button"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] group-hover:animate-pulse">
                check_circle
              </span>
              <span>Tạo đơn hàng &amp; Thanh toán</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-price-lg">
                {formatVND(totalAmount)}
              </span>
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </div>
          </button>

          {/* Store Pickup Option Notice */}
          <p className="text-center font-body-sm text-[11px] text-on-surface-variant flex items-center justify-center gap-1 pt-0.5">
            <span className="material-symbols-outlined text-[14px] text-primary">
              storefront
            </span>
            Hoặc nhận trực tiếp tại{" "}
            <strong>{cartConfig.pickupBranchName}</strong>{" "}
            {cartConfig.pickupTimeNotice}
          </p>
        </div>
      </aside>
    </>
  );
}
