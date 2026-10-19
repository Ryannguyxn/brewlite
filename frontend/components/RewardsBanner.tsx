"use client";

import React, { useState } from "react";

export default function RewardsBanner() {
  const [phone, setPhone] = useState("");

  const handleSubscribe = () => {
    if (!phone.trim()) {
      alert("Vui lòng nhập số điện thoại của bạn để nhận ưu đãi!");
      return;
    }
    alert(
      `Chúc mừng! Số điện thoại ${phone} đã được đăng ký thành viên BrewLite Rewards.`
    );
    setPhone("");
  };

  return (
    <section
      id="rewards"
      className="max-w-[1320px] mx-auto px-margin w-full pb-space-xl"
    >
      <div className="p-space-xl rounded-xl bg-surface-container flex flex-col lg:flex-row items-center justify-between gap-space-lg">
        <div className="flex items-center gap-space-md">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[36px]">
              loyalty
            </span>
          </div>
          <div className="flex flex-col">
            <h4 className="font-headline-md text-headline-md text-on-surface">
              Đăng ký thành viên BrewLite Rewards
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Tích 1 điểm cho mỗi 10.000đ. Đổi ngay ly cà phê miễn phí và ưu đãi
              sinh nhật độc quyền.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-sm flex-shrink-0">
          <input
            className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm w-64"
            placeholder="Nhập số điện thoại của bạn..."
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            onClick={handleSubscribe}
            className="px-6 py-3 rounded-lg bg-primary text-on-primary font-title-sm text-title-sm hover:bg-primary-container shadow-md transition-colors whitespace-nowrap cursor-pointer"
            type="button"
          >
            Nhận Ưu Đãi
          </button>
        </div>
      </div>
    </section>
  );
}
