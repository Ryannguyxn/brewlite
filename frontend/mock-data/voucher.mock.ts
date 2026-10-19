import type {
  MembershipPerk,
  MembershipRule,
  PointTransaction,
  RewardCatalogItem,
  VoucherTicket,
} from "./types";

// ============================================================================
// MOCK DATA: KHO VOUCHER, CỬA HÀNG ĐỔI QUÀ BREWPOINTS, SAO KÊ & QUYỀN LỢI HẠNG
// ============================================================================

export const MOCK_VOUCHERS: VoucherTicket[] = [
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

export const MOCK_REWARD_CATALOG: RewardCatalogItem[] = [
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

export const MOCK_POINT_TRANSACTIONS: PointTransaction[] = [
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

export const MOCK_GOLD_PERKS: MembershipPerk[] = [
  {
    id: "perk-1",
    icon: "percent",
    iconBgClass: "bg-primary-fixed",
    iconTextClass: "text-primary",
    title: "Tích lũy 8% trên giá trị hóa đơn",
    description: "Mỗi 10.000 đ thanh toán quy đổi thành 1 BrewPoint.",
  },
  {
    id: "perk-2",
    icon: "cake",
    iconBgClass: "bg-secondary-fixed",
    iconTextClass: "text-secondary",
    title: "Tặng 01 Bánh ngọt Specialty sinh nhật",
    description: "Voucher tự động kích hoạt vào tháng sinh nhật của bạn.",
  },
  {
    id: "perk-3",
    icon: "local_shipping",
    iconBgClass: "bg-tertiary-fixed",
    iconTextClass: "text-tertiary",
    title: "Ưu tiên giao hàng & Voucher FreeShip",
    description:
      "Nhận 02 mã Freeship bán kính 5km vào ngày 1 hàng tháng.",
  },
];

export const MOCK_MEMBERSHIP_RULES: MembershipRule[] = [
  {
    id: "rule-1",
    icon: "verified",
    iconBgClass: "bg-primary-fixed",
    iconTextClass: "text-primary",
    title: "Hạn sử dụng điểm",
    description:
      "Điểm BrewPoints có giá trị trong 12 tháng kể từ ngày tích lũy phát sinh gần nhất.",
  },
  {
    id: "rule-2",
    icon: "sync_saved_locally",
    iconBgClass: "bg-secondary-fixed",
    iconTextClass: "text-secondary",
    title: "Tự động áp dụng",
    description:
      "Voucher sau khi đổi sẽ nằm trong ví và tự gợi ý khi bạn tiến hành đặt món.",
  },
  {
    id: "rule-3",
    icon: "phone_in_talk",
    iconBgClass: "bg-tertiary-fixed",
    iconTextClass: "text-tertiary",
    title: "Hỗ trợ Hội viên VIP",
    description:
      "Đường dây nóng độc quyền: 1900 6868 (Phím 2) hỗ trợ kiểm tra quyền lợi tức thì.",
  },
];
