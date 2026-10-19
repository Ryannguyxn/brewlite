"use client";

import React, { useState } from "react";

export interface VoucherTicket {
  id: string;
  category: "cash" | "shipping" | "gift";
  badgeLabel: string;
  mainValue: string;
  subValue: string;
  conditionNote: string;
  title: string;
  expiryBadge: string;
  expiryUrgent?: boolean;
  description: string;
  code: string;
  expiryDate: string;
  variant: "primary" | "secondary" | "tertiary" | "gift";
  iconName?: string;
}

export const INITIAL_VOUCHERS: VoucherTicket[] = [
  {
    id: "v1",
    category: "cash",
    badgeLabel: "GIẢM TIỀN MẶT",
    mainValue: "20.000",
    subValue: "VNĐ",
    conditionNote: "Cho đơn từ 150k",
    title: "Giảm 20.000 đ đơn hàng",
    expiryBadge: "Còn 5 ngày",
    expiryUrgent: true,
    description:
      "Áp dụng cho mọi hóa đơn từ 150.000 đ. Thưởng thức trọn vẹn hương vị Robusta Đắk Lắk & Arabica Cầu Đất.",
    code: "COFFEEVIP20",
    expiryDate: "HSD: 30/10/2025",
    variant: "primary",
  },
  {
    id: "v2",
    category: "shipping",
    badgeLabel: "FREESHIP",
    mainValue: "25.000",
    subValue: "VNĐ",
    conditionNote: "Bán kính ≤ 5km",
    title: "Miễn phí giao hàng 25k",
    expiryBadge: "Còn 12 ngày",
    description:
      "Đặc quyền thành viên Hạng Vàng. Miễn phí vận chuyển cho đơn hàng giao nhanh tận nơi.",
    code: "FREESHIPGOLD",
    expiryDate: "HSD: 06/11/2025",
    variant: "secondary",
  },
  {
    id: "v3",
    category: "cash",
    badgeLabel: "SPECIALTY",
    mainValue: "15%",
    subValue: "GIẢM TỐI ĐA 40K",
    conditionNote: "Dòng Cold Brew",
    title: "Giảm 15% Cold Brew & Drip",
    expiryBadge: "Còn 20 ngày",
    description:
      "Áp dụng toàn bộ menu Cold Brew ngâm ủ 18 tiếng và Single Origin Pour-over tuyển chọn.",
    code: "THANKS15",
    expiryDate: "HSD: 15/11/2025",
    variant: "tertiary",
  },
  {
    id: "v4",
    category: "gift",
    badgeLabel: "TẶNG MÓN",
    mainValue: "",
    subValue: "CROISSANT",
    conditionNote: "Kèm 2 ly Size L",
    title: "Tặng 01 Croissant Bơ Pháp",
    expiryBadge: "Còn 7 ngày",
    expiryUrgent: true,
    description:
      "Bánh nướng thủ công bơ nhập khẩu thơm lừng, giòn rụm khi order từ 2 ly thức uống Size L.",
    code: "FREEBAKERY",
    expiryDate: "HSD: 01/11/2025",
    variant: "gift",
    iconName: "bakery_dining",
  },
];

interface VoucherWalletTabProps {
  vouchers: VoucherTicket[];
  onCopyCode: (code: string) => void;
  onUseVoucher: (voucher: VoucherTicket) => void;
}

export default function VoucherWalletTab({
  vouchers,
  onCopyCode,
  onUseVoucher,
}: VoucherWalletTabProps) {
  const [filter, setFilter] = useState<"all" | "cash" | "shipping" | "gift">(
    "all"
  );

  const filtered =
    filter === "all"
      ? vouchers
      : vouchers.filter((v) => v.category === filter);

  const cashCount = vouchers.filter((v) => v.category === "cash").length;
  const shipCount = vouchers.filter((v) => v.category === "shipping").length;
  const giftCount = vouchers.filter((v) => v.category === "gift").length;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-on-surface text-surface-container-lowest"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
            type="button"
          >
            Tất cả ({vouchers.length})
          </button>
          <button
            onClick={() => setFilter("cash")}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
              filter === "cash"
                ? "bg-on-surface text-surface-container-lowest"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
            type="button"
          >
            Giảm tiền mặt ({cashCount})
          </button>
          <button
            onClick={() => setFilter("shipping")}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
              filter === "shipping"
                ? "bg-on-surface text-surface-container-lowest"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
            type="button"
          >
            Miễn phí vận chuyển ({shipCount})
          </button>
          <button
            onClick={() => setFilter("gift")}
            className={`px-4 py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
              filter === "gift"
                ? "bg-on-surface text-surface-container-lowest"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
            }`}
            type="button"
          >
            Tặng món ({giftCount})
          </button>
        </div>
        <div className="text-on-surface-variant font-body-sm text-body-sm">
          Sắp xếp theo:{" "}
          <span className="text-primary font-semibold cursor-pointer">
            Sắp hết hạn trước
          </span>
        </div>
      </div>

      {/* Ticket Coupon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {filtered.map((ticket) => {
          const leftBg =
            ticket.variant === "primary"
              ? "bg-gradient-to-br from-primary-fixed to-primary-container"
              : ticket.variant === "secondary"
              ? "bg-gradient-to-br from-secondary-fixed to-secondary"
              : ticket.variant === "tertiary"
              ? "bg-gradient-to-br from-tertiary-fixed to-tertiary-container"
              : "bg-gradient-to-br from-primary-fixed-dim to-secondary-container";

          const badgeClass =
            ticket.variant === "primary"
              ? "bg-on-primary-fixed/20 text-on-primary-fixed"
              : ticket.variant === "secondary"
              ? "bg-on-secondary-fixed/20 text-on-secondary-fixed"
              : ticket.variant === "tertiary"
              ? "bg-on-tertiary-fixed/20 text-on-tertiary-fixed"
              : "bg-on-secondary-container/20 text-on-secondary-container";

          const textColorClass =
            ticket.variant === "primary"
              ? "text-on-primary-container"
              : ticket.variant === "secondary"
              ? "text-on-secondary"
              : ticket.variant === "tertiary"
              ? "text-on-tertiary-container"
              : "text-on-secondary-container";

          return (
            <div
              key={ticket.id}
              className="relative bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col sm:flex-row items-stretch group"
            >
              {/* Ticket Left Notch & Value */}
              <div
                className={`sm:w-44 ${leftBg} p-space-md flex flex-col justify-between items-center text-center relative`}
              >
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${badgeClass} font-label-md text-[11px] font-bold`}
                >
                  {ticket.badgeLabel}
                </span>

                <div className="my-auto py-2">
                  {ticket.iconName ? (
                    <>
                      <span
                        className={`material-symbols-outlined text-[36px] ${textColorClass}`}
                      >
                        {ticket.iconName}
                      </span>
                      <span
                        className={`block font-title-sm text-title-sm ${textColorClass} font-semibold mt-1`}
                      >
                        {ticket.subValue}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`font-display-lg text-[32px] leading-tight font-extrabold ${textColorClass}`}
                      >
                        {ticket.mainValue}
                      </span>
                      <span
                        className={`block font-title-sm text-title-sm ${textColorClass} font-semibold -mt-1`}
                      >
                        {ticket.subValue}
                      </span>
                    </>
                  )}
                </div>

                <span
                  className={`font-body-sm text-[11px] ${textColorClass}/80`}
                >
                  {ticket.conditionNote}
                </span>

                <div className="hidden sm:block absolute -top-3 -right-3 w-6 h-6 rounded-full bg-background" />
                <div className="hidden sm:block absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-background" />
              </div>

              {/* Ticket Right Details */}
              <div className="flex-1 p-space-md flex flex-col justify-between gap-space-sm bg-surface-container-lowest">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-title-md text-title-md text-on-surface font-bold">
                      {ticket.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-md text-[11px] ${
                        ticket.expiryUrgent
                          ? "bg-error-container text-on-error-container font-bold"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {ticket.expiryUrgent ? "alarm" : "schedule"}
                      </span>{" "}
                      {ticket.expiryBadge}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {ticket.description}
                  </p>
                </div>

                {/* Code copy & CTA */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container font-label-md text-label-md text-primary font-mono select-all">
                    <span>{ticket.code}</span>
                    <button
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      onClick={() => onCopyCode(ticket.code)}
                      title="Sao chép mã"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        content_copy
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-body-sm text-[11px] text-outline">
                      {ticket.expiryDate}
                    </span>
                    <button
                      onClick={() => onUseVoucher(ticket)}
                      className="px-4 py-1.5 rounded-lg bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
                      type="button"
                    >
                      Dùng ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
