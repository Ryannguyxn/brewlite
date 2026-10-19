"use client";

import React, { useState } from "react";

export interface RewardCatalogItem {
  id: string;
  tag: string;
  popular?: boolean;
  physical?: boolean;
  points: number;
  title: string;
  description: string;
  stockText: string;
  image: string;
  imageAlt: string;
}

export const REWARD_CATALOG: RewardCatalogItem[] = [
  {
    id: "r1",
    tag: "Voucher Điện Tử",
    points: 60,
    title: "Voucher giảm giá 15.000 đ",
    description:
      "Giảm trực tiếp 15.000 đ cho bất kỳ đơn hàng takeaway hoặc thưởng thức tại quán.",
    stockText: "Còn lại 148 suất",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWVIQjOqtVh8C9EqOs7xdWBS95lyArl3pWpWD6ksginfLTDne3OYFhwVnT317QMxuFegjEw5VlQC1Ep-tPavpkGVapFwKuNSPITGRzm61CuDrKNUqdejYez7lzM47REmolwL2EB4OjvxGNc8IC4iHN1ObQ4GECvwLww8kJLmG0Gu8TODigW2NVT6jcj6hirCjXqmhz6gPr4yUTMMJ38iVsoiZAiDh-8plFQaWhx4q13dJR1R0z7bUn",
    imageAlt: "Voucher giảm giá 15.000 đ",
  },
  {
    id: "r2",
    tag: "Vận Chuyển",
    points: 80,
    title: "Miễn phí vận chuyển toàn thành phố",
    description:
      "Tối đa 25.000 đ phí vận chuyển. Áp dụng cho chi nhánh Saigon Center, Hồ Con Rùa và Thảo Điền.",
    stockText: "Còn lại 85 suất",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDae47uEZnw4snsY35BdcH5WhDGH-lwlAsaT-yce7TS6ZTdJ8IXJFqNZH4fDPX0O5ptjJJMirgX-A4Ole_X1lhIWLdVPXI5aFSHlH1OXb2dbX2xc3xRqlbMoCaI5K95cHC_tGDeQSSi1ravSsYITsVMOhw5a5lHEmFjoSVXH4o2M-tSWxtNw8-t7hCtY9bA1VAQZQjt7u7QWRzyPe4BRXu_tZnxFcPSGUiIhAQoHa-QksoDVAW47SiD",
    imageAlt: "Miễn phí vận chuyển toàn thành phố",
  },
  {
    id: "r3",
    tag: "★ Phổ biến nhất",
    popular: true,
    points: 120,
    title: "01 Ly Cà Phê Sữa Đá Sài Gòn (M)",
    description:
      "Hạt Robusta Fine Đắk Lắk đậm đà hòa quyện cùng sữa đặc nguyên kem thơm béo truyền thống.",
    stockText: "Đã đổi 312 lượt",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBQCt7aEPGEetbRM7b711vmga7aWxURD1SFcWcOPss1PGxLq9JGDsR0OW0DktfbC0tKn9xPtFoJJruJ10CdNGONt1mmyeHUeD_bVxpQmHiTKTpi-buW6JrbtrIi38kvAny3tcuOmxNKoCV1-HUmFJoLg9hM98D9HG24yE53U5ArF89yV6wQLFLNoTe8e8Bc3HZ1qNpE8cEVAmVMbILUYjPNZZnBS9N5JEpPIgSym_FRGvxUlp5ReE_i",
    imageAlt: "01 Ly Cà Phê Sữa Đá Sài Gòn (M)",
  },
  {
    id: "r4",
    tag: "Voucher Giảm Giá",
    points: 140,
    title: "Voucher giảm giá 35.000 đ",
    description:
      "Áp dụng cho mọi hóa đơn từ 150.000 đ. Thích hợp cho buổi cà phê gặp gỡ bạn bè hoặc làm việc.",
    stockText: "Còn lại 40 suất",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSCu5B1S1-x38dYSXC9uF-Du5JLkG5NRqkHuWg5_KSXbwcjio3OjWMgkJSnDkdyUjgYdp8SlKGFuMP2rKmpVfZd_KM0wM5RU7Mx7RP1l1fl38XYcwEDDjGPaRBtB3YCtGWsjtwJXs2J6R2fcC3UXH23Dg9fwmQtnd5MFDKuAxVHy4nwW_Q_p-GerN0LT4cRrT_hvRnpOFN5p3VhyGKDSJ5LnhqVoQJ73afY1ym095oZt1bAXDL1_2u",
    imageAlt: "Voucher giảm giá 35.000 đ",
  },
  {
    id: "r5",
    tag: "Specialty Drink",
    points: 180,
    title: "01 Ly Cold Brew Cam Sả Thảo Mộc (L)",
    description:
      "Cold brew 18h ủ lạnh kết hợp nước ép cam tươi và sả đập dập thơm mát sảng khoái.",
    stockText: "Còn lại 25 suất",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9gDu53BXXyxu843amGzpq8UdY1Vjg8_zKbjF4LbyMx9vQuwiCnI2fF9kjcPH194pCrqlNItW8_SS26gxDudi975Am0EGIzTgkSvMvZdraHszkODXAXdqyQGzpuCZE1eQ4Km-4A2N-VCyvz43Eqa7FasAvUE7ICCFF1drflITLYxb9ecnRnex7IL5NlmzRaifpbmWu-fMcTZQJMvfLGFQClmsRs1bqVh3Y6X3nGUciNJ2OoGDNFp4V",
    imageAlt: "01 Ly Cold Brew Cam Sả Thảo Mộc (L)",
  },
  {
    id: "r6",
    tag: "Quà Tặng Hiện Vật",
    physical: true,
    points: 320,
    title: "Bình Giữ Nhiệt BrewLite Eco 500ml",
    description:
      "Chất liệu Inox 304 giữ nóng/lạnh 12 tiếng, nắp tre tự nhiên khắc laser thương hiệu độc quyền.",
    stockText: "Còn 12 bình",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCX4XsjBLKuKwC_m1zNC6LZYljopruEAU5QBSnaU9HcoU2iYtMUHQPOHhPkxmbj73D8auqNTuZ2WZLQ-SdMelMedmiBMIEyBY-FMYUZ-w9YDhW6r1oWZm3z5yNuSzYytAhFSC2BqqSSfx_Z9MAcl_RUOuFYmnPmKRUOZpXU7yVDifRsEzotJcrJhyZL_lPSVgDKRQ7dEfV3wF4Di0v3f77Sx-7XhQ5VsGtTgRbKvFauRIcQjrrEVuxh",
    imageAlt: "Bình Giữ Nhiệt BrewLite Eco 500ml",
  },
];

interface RewardExchangeTabProps {
  userPoints: number;
  onRedeem: (reward: RewardCatalogItem) => void;
}

export default function RewardExchangeTab({
  userPoints,
  onRedeem,
}: RewardExchangeTabProps) {
  const [rangeFilter, setRangeFilter] = useState<
    "all" | "under100" | "100to200" | "over200"
  >("all");

  const filteredRewards = REWARD_CATALOG.filter((item) => {
    if (rangeFilter === "under100") return item.points < 100;
    if (rangeFilter === "100to200")
      return item.points >= 100 && item.points <= 200;
    if (rangeFilter === "over200") return item.points > 200;
    return true;
  });

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              storefront
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Cửa hàng Đổi quà BrewPoints
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Số dư khả dụng hiện tại:{" "}
            <strong className="text-primary font-bold">
              {userPoints} BrewPoints
            </strong>
            . Điểm sau khi đổi sẽ lập tức chuyển thành voucher trong ví.
          </p>
        </div>

        {/* Filter range buttons */}
        <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg shadow-sm overflow-x-auto">
          <button
            onClick={() => setRangeFilter("all")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "all"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            Tất cả
          </button>
          <button
            onClick={() => setRangeFilter("under100")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "under100"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            Dưới 100 điểm
          </button>
          <button
            onClick={() => setRangeFilter("100to200")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "100to200"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            100 - 200 điểm
          </button>
          <button
            onClick={() => setRangeFilter("over200")}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
              rangeFilter === "over200"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
            type="button"
          >
            Trên 200 điểm
          </button>
        </div>
      </div>

      {/* Reward Exchange Grid (6 Rewards - 3 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filteredRewards.map((reward) => {
          const canRedeem = userPoints >= reward.points;
          const missingPoints = Math.max(0, reward.points - userPoints);
          const progressPct = Math.min(
            100,
            Math.round((userPoints / reward.points) * 100)
          );

          return (
            <div
              key={reward.id}
              className={`bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between group relative overflow-hidden transition-all ${
                canRedeem ? "hover:shadow-md" : "opacity-85"
              }`}
            >
              {!canRedeem && (
                <div className="absolute inset-0 bg-surface-container/20 pointer-events-none" />
              )}

              <div>
                <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container-low mb-space-sm">
                  <img
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      canRedeem
                        ? "group-hover:scale-105"
                        : "grayscale-[20%] group-hover:scale-100"
                    }`}
                    alt={reward.imageAlt}
                    src={reward.image}
                  />
                  <span
                    className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full font-label-md text-[11px] font-bold shadow-sm ${
                      reward.popular
                        ? "bg-primary text-on-primary"
                        : reward.physical
                        ? "bg-inverse-surface text-inverse-on-surface"
                        : "bg-surface-container-lowest/90 backdrop-blur-md text-primary"
                    }`}
                  >
                    {reward.tag}
                  </span>

                  <span
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full font-label-md text-[11px] font-semibold ${
                      canRedeem
                        ? "bg-secondary-fixed text-on-secondary-fixed"
                        : "bg-error-container text-on-error-container"
                    }`}
                  >
                    {canRedeem ? "Đủ điểm đổi" : `Thiếu ${missingPoints} điểm`}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1.5 font-title-sm text-title-sm font-bold ${
                    canRedeem ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {canRedeem ? "monetization_on" : "lock"}
                  </span>
                  <span>{reward.points} BrewPoints</span>
                </div>

                <h3 className="font-title-md text-title-md text-on-surface font-bold mt-1">
                  {reward.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                  {reward.description}
                </p>

                {!canRedeem && (
                  <div className="mt-3 bg-surface-container-low p-2.5 rounded-lg">
                    <div className="flex items-center justify-between text-[11px] font-label-md text-on-surface-variant mb-1">
                      <span>Tiến độ tích lũy</span>
                      <span className="font-bold text-primary">
                        {userPoints} / {reward.points} điểm
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-2 flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-outline">
                  {reward.stockText}
                </span>
                {canRedeem ? (
                  <button
                    onClick={() => onRedeem(reward)}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
                    type="button"
                  >
                    Đổi quà ngay
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 rounded-lg bg-surface-container-high text-outline cursor-not-allowed font-label-md text-label-md"
                    type="button"
                  >
                    Chưa đủ điểm
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
