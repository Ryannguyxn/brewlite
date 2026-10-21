import type {
  HeroBannerData,
  SiteConfigData,
  UserProfile,
} from "./types";

// ============================================================================
// MOCK DATA GIAO DIỆN CHUNG: HEADER, HERO BANNER & FOOTER
// (Giữ nguyên toàn bộ hình ảnh Logo & Avatar từ trang trước)
// ============================================================================

export const MOCK_USER_PROFILE: UserProfile = {
  id: "user-01",
  fullName: "Nguyễn Hải Đăng",
  memberCode: "#BL-8942-GLD",
  memberSince: "03/2023",
  tierName: "Hạng Vàng",
  tierBadge: "★ HẠNG VÀNG",
  nextTierName: "HẠNG KIM CƯƠNG",
  points: 240,
  nextTierPoints: 300,
  savedThisMonth: 210000,
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAmjZyk-pzjwkCEoPO7SFsUXdOHYNQDc63AaSSxPr76MYlbtIIHpTaCKlf9fuYeGovvBP7GGh2hWDdcNHr4te7tpNsNap4v1zhAGOMsCPmkginD83t0GdeIN1gPvEpX2le9utpBZPeP5d4PoRCAZMXFUgz8V4IqWDd7QcFfUM4RGZu7HgVYtEBYehumIn2cweDn97IH39PPlG7klYsm12FxPwb0rJ5Kj0IZB6P99gC4t0pCp12y_PzS",
  nextTierPerksSummary:
    "Đặc quyền mới: Tích x1.5 điểm • Free Upsize • Quà sinh nhật",
  equivalentRewardHint: "02 ly Specialty Coffee",
};

export const MOCK_HERO_BANNER: HeroBannerData = {
  seasonBadge: "Niên vụ mới 2025 • Cầu Đất Farm",
  roastSubtitle: "Rang mộc thủ công mẻ nhỏ",
  headlineLine1: "Thưởng Thức Vị Nguyên Bản",
  headlineHighlight: "Từng Giọt Cà Phê Thủ Công",
  description:
    "Tận hưởng bộ sưu tập cà phê phin truyền thống phối trộn Robusta mật ong Buôn Ma Thuột cùng dòng Arabica Bourbon trứ danh, pha chế theo tỉ lệ vàng chuẩn gu người Việt.",
  featuredLabel: "Món pha chế hôm nay",
  featuredDrinkName: "Cà Phê Muối Cố Đô",
  featuredPromoText: "Size S (100%) • Size M (120%) • Size L (140%)",
};

export const MOCK_SITE_CONFIG: SiteConfigData = {
  brandName: "BrewLite",
  logoUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCXc4_MXJFOX6cH9aqKb1GUvI22wWtCiixATqMzxvfLUHdNh-RMpdpq4aKguUIbRNeklKhZ2_XMAdoKAQR1i0D8hr9JlS_jFWECEfVRnjVvMBDndAfuRQo7zLqe_xWw8ESAd7J9Dy3j7kFGH76FadaxIE8md5pOUkzAW_G-q76cyP-MzzPQia5WNtJ7PCvAcMprzobIqdlsJEB-ECd3DB3G4JZztoE7bxQSNVHcbHvqIJ4y3Zwra1vq",
  selectedBranch: "Chi nhánh: Saigon Center",
  searchPlaceholder: "Tìm kiếm cà phê, món uống yêu thích...",
  hotline: "1900 6868",
  brandStory:
    "Trải nghiệm cà phê đặc sản thủ công tuyển chọn từ nông trại Cầu Đất và Đắk Lắk. Mỗi tách cà phê là một câu chuyện tôn vinh giá trị nguyên bản.",
  copyright: "© 2025 BrewLite Specialty Coffee Co. Mọi quyền được bảo lưu.",
  tagline: "Thiết kế cho người yêu cà phê nguyên bản Việt Nam.",
  deliveryHighlight: "Phục vụ nhanh chóng • Chuẩn vị cà phê thủ công",
  totalCatalogCount: 8,
  branches: [
    {
      id: "branch-1",
      name: "BrewLite Saigon Center",
      address:
        "BrewLite Saigon Center: Tầng B2, 65 Lê Lợi, P. Bến Nghé, Quận 1, TP. HCM",
    },
    {
      id: "branch-2",
      name: "BrewLite Hồ Con Rùa",
      address:
        "BrewLite Hồ Con Rùa: 02 Công Xã Paris, P. Bến Nghé, Quận 1, TP. HCM",
    },
    {
      id: "branch-3",
      name: "BrewLite Thảo Điền",
      address: "BrewLite Thảo Điền: 38 Xuân Thủy, P. Thảo Điền, TP. Thủ Đức",
    },
  ],
  quickLinks: [
    { label: "Thực đơn đặc sản", href: "/" },
    { label: "Ưu đãi thành viên", href: "#" },
    { label: "Câu chuyện hạt cà phê", href: "#footer" },
    { label: "Kiểm tra đơn hàng", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
    { label: "Điều khoản dịch vụ", href: "#" },
  ],
};
