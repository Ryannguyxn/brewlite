"use client";

import React from "react";

export interface PointTransaction {
  id: string;
  timestamp: string;
  title: string;
  reference: string;
  source: string;
  deltaText: string;
  balanceAfter: number;
  type: "earn" | "spend" | "bonus";
}

export const INITIAL_TRANSACTIONS: PointTransaction[] = [
  {
    id: "tx-1",
    timestamp: "24/10/2025 • 09:15",
    title: "Tích điểm đơn hàng hoàn tất",
    reference: "#BL-89241",
    source: "BrewLite Saigon Center",
    deltaText: "+16 điểm",
    balanceAfter: 240,
    type: "earn",
  },
  {
    id: "tx-2",
    timestamp: "20/10/2025 • 15:40",
    title: "Tích điểm đơn hàng hoàn tất",
    reference: "#BL-88924",
    source: "BrewLite Hồ Con Rùa",
    deltaText: "+24 điểm",
    balanceAfter: 224,
    type: "earn",
  },
  {
    id: "tx-3",
    timestamp: "18/10/2025 • 11:22",
    title: "Đổi Voucher COFFEEVIP20",
    reference: "REDEEM-9921",
    source: "Cửa hàng Rewards Online",
    deltaText: "-120 điểm",
    balanceAfter: 200,
    type: "spend",
  },
  {
    id: "tx-4",
    timestamp: "15/10/2025 • 08:00",
    title: "Thưởng duy trì chuỗi tuần Hạng Vàng",
    reference: "REWARD-WEEKLY",
    source: "Hệ thống BrewLite Rewards",
    deltaText: "+20 điểm",
    balanceAfter: 320,
    type: "bonus",
  },
];

interface PointsHistoryTabProps {
  transactions: PointTransaction[];
}

export default function PointsHistoryTab({
  transactions,
}: PointsHistoryTabProps) {
  return (
    <div className="flex flex-col gap-space-lg">
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-md border-b border-surface-container">
          <div>
            <h3 className="font-title-md text-title-md text-on-surface font-bold">
              Nhật ký biến động BrewPoints
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Sao kê chi tiết các lượt tích điểm từ đơn hàng và tiêu điểm đổi
              voucher
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-high transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                filter_alt
              </span>
              <span>Lọc theo tháng</span>
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-high transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                file_download
              </span>
              <span>Xuất sao kê</span>
            </button>
          </div>
        </div>

        {/* History Transactions Table */}
        <div className="overflow-x-auto mt-space-sm">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="text-on-surface-variant font-label-md text-label-md border-b border-surface-container">
                <th className="py-3 px-2">Thời gian</th>
                <th className="py-3 px-2">Loại giao dịch</th>
                <th className="py-3 px-2">Mã tham chiếu</th>
                <th className="py-3 px-2">Chi nhánh / Nguồn</th>
                <th className="py-3 px-2 text-right">Biến động điểm</th>
                <th className="py-3 px-2 text-right">Số dư sau GD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {transactions.map((tx) => {
                const iconBg =
                  tx.type === "earn"
                    ? "bg-secondary-fixed text-secondary"
                    : tx.type === "spend"
                    ? "bg-error-container text-error"
                    : "bg-primary-fixed text-primary";

                const iconName =
                  tx.type === "earn"
                    ? "add"
                    : tx.type === "spend"
                    ? "remove"
                    : "military_tech";

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3.5 px-2 text-on-surface font-medium">
                      {tx.timestamp}
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {iconName}
                          </span>
                        </span>
                        <span className="font-semibold text-on-surface">
                          {tx.title}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`py-3.5 px-2 font-mono ${
                        tx.type === "earn"
                          ? "text-primary font-semibold"
                          : "text-outline"
                      }`}
                    >
                      {tx.reference}
                    </td>
                    <td className="py-3.5 px-2 text-on-surface-variant">
                      {tx.source}
                    </td>
                    <td
                      className={`py-3.5 px-2 text-right font-bold font-mono ${
                        tx.type === "spend" ? "text-error" : "text-secondary"
                      }`}
                    >
                      {tx.deltaText}
                    </td>
                    <td className="py-3.5 px-2 text-right text-on-surface font-semibold font-mono">
                      {tx.balanceAfter}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-space-md pt-space-sm flex items-center justify-between text-body-sm text-outline border-t border-surface-container">
          <span>Hiển thị {transactions.length} trên 38 giao dịch</span>
          <div className="flex items-center gap-1">
            <button
              className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer"
              type="button"
            >
              1
            </button>
            <button
              className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              type="button"
            >
              2
            </button>
            <button
              className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              type="button"
            >
              3
            </button>
            <span className="px-1">...</span>
            <button
              className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              type="button"
            >
              9
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
