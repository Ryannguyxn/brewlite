"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MembershipHeroCard from "@/components/MembershipHeroCard";
import VoucherWalletTab from "@/components/VoucherWalletTab";
import RewardExchangeTab from "@/components/RewardExchangeTab";
import PointsHistoryTab from "@/components/PointsHistoryTab";

import {
  MOCK_GOLD_PERKS,
  MOCK_INITIAL_CART_ITEMS,
  MOCK_MEMBERSHIP_RULES,
  MOCK_POINT_TRANSACTIONS,
  MOCK_REWARD_CATALOG,
  MOCK_UPSELL_OFFER,
  MOCK_USER_PROFILE,
  MOCK_VOUCHERS,
  type CartItem,
  type MembershipPerk,
  type MembershipRule,
  type PointTransaction,
  type RewardCatalogItem,
  type UserProfile,
  type VoucherTicket,
} from "@/mock-data";
import {
  fetchCartData,
  fetchVoucherAndRewardsData,
  redeemRewardMock,
} from "@/services/api.service";

export default function VoucherPage() {
  // ==========================================================================
  // PHẦN 1: QUẢN LÝ STATE & GỌI DỮ LIỆU TỪ SERVICE (LOGIC TÁCH BIỆT UI)
  // ==========================================================================
  const [activeTab, setActiveTab] = useState<"wallet" | "exchange" | "history">(
    "wallet"
  );
  const [userProfile, setUserProfile] =
    useState<UserProfile>(MOCK_USER_PROFILE);
  const [userPoints, setUserPoints] = useState(MOCK_USER_PROFILE.points);
  const [vouchers, setVouchers] = useState<VoucherTicket[]>(MOCK_VOUCHERS);
  const [rewardCatalog, setRewardCatalog] =
    useState<RewardCatalogItem[]>(MOCK_REWARD_CATALOG);
  const [transactions, setTransactions] = useState<PointTransaction[]>(
    MOCK_POINT_TRANSACTIONS
  );
  const [goldPerks, setGoldPerks] =
    useState<MembershipPerk[]>(MOCK_GOLD_PERKS);
  const [membershipRules, setMembershipRules] = useState<MembershipRule[]>(
    MOCK_MEMBERSHIP_RULES
  );

  const [manualPromoCode, setManualPromoCode] = useState("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    isSuccess: boolean;
  }>({
    visible: false,
    message: "",
    isSuccess: true,
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(
    MOCK_INITIAL_CART_ITEMS
  );

  // Gọi hàm giả lập API khi vào trang Voucher & Rewards
  useEffect(() => {
    let isMounted = true;

    async function loadVoucherPageData() {
      // TODO: Thay thế fetchVoucherAndRewardsData() & fetchCartData() trong services/api.service.ts
      // bằng axios.get('http://localhost:3001/loyalty/me') và '/vouchers/me' khi ghép Backend thật.
      const [voucherRes, cartRes] = await Promise.all([
        fetchVoucherAndRewardsData(),
        fetchCartData(),
      ]);

      if (!isMounted) return;
      setUserProfile(voucherRes.userProfile);
      setUserPoints(voucherRes.userProfile.points);
      setVouchers(voucherRes.vouchers);
      setRewardCatalog(voucherRes.rewardCatalog);
      setTransactions(voucherRes.transactions);
      setGoldPerks(voucherRes.goldPerks);
      setMembershipRules(voucherRes.membershipRules);
      setCartItems(cartRes.items);
    }

    loadVoucherPageData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalCartQty = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const showToast = (message: string, isSuccess = true) => {
    setToast({ visible: true, message, isSuccess });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(code)
        .then(() => showToast(`Đã sao chép mã voucher: ${code}`))
        .catch(() => showToast(`Đã sao chép mã: ${code}`));
    } else {
      showToast(`Đã sao chép mã: ${code}`);
    }
  };

  const handleUseVoucher = (voucher: VoucherTicket) => {
    showToast(`Đã chọn áp dụng mã ${voucher.code} vào giỏ hàng!`);
    setIsCartOpen(true);
  };

  const handleApplyManualCode = () => {
    const val = manualPromoCode.trim().toUpperCase();
    if (!val) {
      showToast("Vui lòng nhập mã ưu đãi hợp lệ", false);
      return;
    }
    // TODO: Thay thế lưu mã thủ công bằng axios.post('http://localhost:3001/vouchers/claim', { code: val })
    const newTicket: VoucherTicket = {
      id: `v-manual-${Date.now()}`,
      category: "cash",
      badgeLabel: "MÃ LƯU",
      mainValue: "20.000",
      subValue: "VNĐ",
      conditionNote: "Cho đơn từ 100k",
      title: `Ưu đãi đặc biệt (${val})`,
      expiryBadge: "Còn 14 ngày",
      description:
        "Mã ưu đãi bạn vừa lưu trực tiếp vào Kho Voucher của BrewLite.",
      code: val,
      expiryDate: "HSD: 30/11/2025",
      variant: "primary",
    };
    setVouchers((prev) => [newTicket, ...prev]);
    setManualPromoCode("");
    setActiveTab("wallet");
    showToast(`Đã lưu mã ${val} vào ví voucher của bạn!`);
  };

  const handleRedeemReward = async (reward: RewardCatalogItem) => {
    if (userPoints < reward.points) {
      showToast("Bạn chưa đủ điểm để đổi phần quà này", false);
      return;
    }
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn dùng ${reward.points} BrewPoints để đổi [${reward.title}]?`
    );
    if (!confirmed) return;

    // TODO: Thay thế hàm redeemRewardMock trong services/api.service.ts bằng axios.post('/loyalty/redeem', ...)
    const res = await redeemRewardMock(reward);
    const nextBalance = userPoints - reward.points;
    setUserPoints(nextBalance);
    setVouchers((prev) => [res.newVoucher, ...prev]);
    setTransactions((prev) => [
      { ...res.newTransaction, balanceAfter: nextBalance },
      ...prev,
    ]);

    showToast("Đổi quà thành công! Đã chuyển vào Kho Voucher của bạn.");
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleRestoreDefaultCart = () => {
    setCartItems(MOCK_INITIAL_CART_ITEMS);
  };

  const handleAddUpsell = () => {
    const upsellItem = MOCK_UPSELL_OFFER.item;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === upsellItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === upsellItem.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...upsellItem }];
    });
  };

  // ==========================================================================
  // PHẦN 2: HIỂN THỊ GIAO DIỆN (UI RENDERING)
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface">
      <Header
        cartCount={totalCartQty}
        onOpenCart={() => setIsCartOpen(true)}
        activeNav="khuyen-mai"
        userProfile={{ ...userProfile, points: userPoints }}
      />

      <main className="w-full pt-20 bg-background min-h-screen flex-1">
        <div className="flex flex-col w-full">
          {/* Main Content Canvas (Desktop 1440px target, max-w-[1320px]) */}
          <div className="max-w-[1320px] w-full mx-auto px-margin py-space-lg flex flex-col gap-space-xl">
            {/* 1. Breadcrumb & Section Intro */}
            <div className="flex flex-col gap-space-xs">
              <nav className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <Link className="hover:text-primary transition-colors" href="/">
                  Trang chủ
                </Link>
                <span className="text-outline-variant">/</span>
                <span className="hover:text-primary transition-colors cursor-pointer">
                  Tài khoản
                </span>
                <span className="text-outline-variant">/</span>
                <span className="text-primary font-semibold">
                  Đổi điểm &amp; Kho Voucher
                </span>
              </nav>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/50 text-on-primary-fixed-variant font-label-md text-label-md mb-2">
                    <span
                      className="material-symbols-outlined text-[16px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      military_tech
                    </span>
                    BrewLite Privilege Program
                  </span>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
                    BrewLite Rewards &amp; Kho Voucher Ưu Đãi
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
                    Tận hưởng đặc quyền tích lũy sau mỗi tách cà phê thủ công.
                    Đổi hạt điểm BrewPoints lấy voucher giảm giá, thức uống cao
                    cấp và quà tặng độc quyền.
                  </p>
                </div>

                {/* Quick stats summary card */}
                <div className="flex items-center gap-space-md bg-surface-container-low p-space-sm px-space-md rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">
                        savings
                      </span>
                    </div>
                    <div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Đã tiết kiệm tháng này
                      </p>
                      <p className="font-title-sm text-title-sm text-primary font-bold">
                        {userProfile.savedThisMonth.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-surface-container-highest" />
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[22px]">
                        confirmation_number
                      </span>
                    </div>
                    <div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Voucher sẵn sàng
                      </p>
                      <p className="font-title-sm text-title-sm text-on-surface font-bold">
                        {vouchers.length} mã khả dụng
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Hero Gold Membership Card Showcase */}
            <MembershipHeroCard
              points={userPoints}
              userProfile={userProfile}
              perks={goldPerks}
              onOpenQr={() => setIsQrModalOpen(true)}
              onSwitchTab={setActiveTab}
            />

            {/* 3. Segmented Navigation Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md bg-surface-container-low p-1.5 rounded-xl">
              <div
                className="flex items-center gap-1 w-full sm:w-auto"
                role="tablist"
              >
                <button
                  onClick={() => setActiveTab("wallet")}
                  className={`flex items-center justify-center gap-2 px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-all flex-1 sm:flex-initial cursor-pointer ${
                    activeTab === "wallet"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    account_balance_wallet
                  </span>
                  <span>Kho Voucher của tôi ({vouchers.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("exchange")}
                  className={`flex items-center justify-center gap-2 px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-all flex-1 sm:flex-initial cursor-pointer ${
                    activeTab === "exchange"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    redeem
                  </span>
                  <span>Đổi điểm nhận Voucher &amp; Quà</span>
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center justify-center gap-2 px-space-md py-2.5 rounded-lg font-label-lg text-label-lg transition-all flex-1 sm:flex-initial cursor-pointer ${
                    activeTab === "history"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    receipt_long
                  </span>
                  <span>Lịch sử tích &amp; dùng điểm</span>
                </button>
              </div>

              {/* Quick Add Promo Code bar in Tab strip */}
              <div className="flex items-center gap-2 w-full sm:w-auto px-2">
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[18px]">
                      sell
                    </span>
                  </span>
                  <input
                    className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-sm text-body-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary uppercase tracking-wider"
                    placeholder="Nhập mã ưu đãi riêng..."
                    type="text"
                    value={manualPromoCode}
                    onChange={(e) => setManualPromoCode(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleApplyManualCode}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-label-md text-label-md transition-colors flex-shrink-0 cursor-pointer"
                  type="button"
                >
                  Lưu mã
                </button>
              </div>
            </div>

            {/* TAB 1: KHO VOUCHER CỦA TÔI */}
            {activeTab === "wallet" && (
              <VoucherWalletTab
                vouchers={vouchers}
                onCopyCode={handleCopyCode}
                onUseVoucher={handleUseVoucher}
              />
            )}

            {/* TAB 2: ĐỔI ĐIỂM NHẬN VOUCHER & QUÀ TẶNG */}
            {activeTab === "exchange" && (
              <RewardExchangeTab
                userPoints={userPoints}
                rewards={rewardCatalog}
                onRedeem={handleRedeemReward}
              />
            )}

            {/* TAB 3: LỊCH SỬ TÍCH & DÙNG ĐIỂM */}
            {activeTab === "history" && (
              <PointsHistoryTab transactions={transactions} />
            )}

            {/* 5. Bottom Compact Membership Rules & FAQs */}
            <div
              id="rules"
              className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-space-sm"
            >
              {membershipRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${rule.iconBgClass} flex items-center justify-center ${rule.iconTextClass} flex-shrink-0`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {rule.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-title-sm text-title-sm text-on-surface font-bold">
                      {rule.title}
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {rule.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Membership Modal */}
          {isQrModalOpen && (
            <div
              className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsQrModalOpen(false);
              }}
            >
              <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-space-lg shadow-2xl relative flex flex-col items-center text-center">
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
                <span className="px-3 py-1 rounded-full bg-primary-fixed text-primary font-label-md text-label-md font-bold mb-3">
                  Thẻ Hội Viên Điện Tử
                </span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">
                  {userProfile.fullName}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Mã thẻ: {userProfile.memberCode.replace("#", "")} (
                  {userProfile.tierName})
                </p>

                <div className="my-space-md p-4 bg-white rounded-xl shadow-inner border border-surface-container flex items-center justify-center">
                  <svg
                    className="w-48 h-48 text-on-surface"
                    fill="currentColor"
                    viewBox="0 0 100 100"
                  >
                    <path d="M0 0h30v30H0zm5 5h20v20H5zM70 0h30v30H70zm5 5h20v20H75zM0 70h30v30H0zm5 5h20v20H5zM10 10h10v10H10zM80 10h10v10H80zM10 80h10v10H10zM40 0h10v20H40zm20 10h10v20H60zm-20 30h20v10H40zm-10 10h10v20H30zm40 10h20v10H70zm-20 10h10v20H50zm30 10h10v20H80zm-40 20h20v10H40z" />
                  </svg>
                </div>

                <p className="font-body-sm text-body-sm text-outline">
                  Đưa mã này cho thu ngân tại quầy thanh toán trước khi in hóa
                  đơn để tích 8% điểm.
                </p>
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="mt-space-md w-full py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                  type="button"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          )}

          {/* Toast Notification Box */}
          <div
            className={`fixed bottom-6 right-6 z-50 bg-on-surface text-surface-container-lowest px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 pointer-events-none ${
              toast.visible
                ? "translate-y-0 opacity-100"
                : "translate-y-24 opacity-0"
            }`}
          >
            <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
              {toast.isSuccess ? "check_circle" : "info"}
            </span>
            <span className="font-body-md text-body-md">{toast.message}</span>
          </div>
        </div>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onRestoreDefaultCart={handleRestoreDefaultCart}
        onAddUpsell={handleAddUpsell}
      />

      <Footer />
    </div>
  );
}
