import {
  MOCK_CART_CONFIG,
  MOCK_CATALOG_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_GOLD_PERKS,
  MOCK_HERO_BANNER,
  MOCK_INITIAL_CART_ITEMS,
  MOCK_MEMBERSHIP_RULES,
  MOCK_POINT_TRANSACTIONS,
  MOCK_PRICE_FILTER_OPTIONS,
  MOCK_REWARD_CATALOG,
  MOCK_SITE_CONFIG,
  MOCK_SORT_OPTIONS,
  MOCK_UPSELL_OFFER,
  MOCK_USER_PROFILE,
  MOCK_VOUCHERS,
  type CartConfig,
  type CartItem,
  type CategoryOption,
  type HeroBannerData,
  type MembershipPerk,
  type MembershipRule,
  type PointTransaction,
  type ProductItem,
  type RewardCatalogItem,
  type SelectOption,
  type SiteConfigData,
  type UpsellOffer,
  type UserProfile,
  type VoucherTicket,
} from "@/mock-data";

// ============================================================================
// GIẢ LẬP GỌI API BACKEND (MOCK API SERVICE)
// Khi ghép nối NestJS Backend, đồng đội chỉ cần thay nội dung bên trong các hàm
// bên dưới bằng fetch() hoặc axios.get() / axios.post() tới REST API thật.
// ============================================================================

const SIMULATED_NETWORK_DELAY_MS = 180;

function simulateDelay<T>(data: T, ms = SIMULATED_NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(structuredClone(data));
    }, ms);
  });
}

/**
 * Lấy danh sách sản phẩm và bộ lọc trang Thực đơn (Catalog)
 */
export async function fetchCatalogData(): Promise<{
  products: ProductItem[];
  categories: CategoryOption[];
  sortOptions: SelectOption[];
  priceFilterOptions: SelectOption[];
  heroBanner: HeroBannerData;
  siteConfig: SiteConfigData;
}> {
  // TODO: Thay thế hàm fetchCatalogData này bằng axios.get('http://localhost:3001/products')
  // Ví dụ:
  // const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products`);
  // return res.data;
  return simulateDelay({
    products: MOCK_CATALOG_PRODUCTS,
    categories: MOCK_CATEGORIES,
    sortOptions: MOCK_SORT_OPTIONS,
    priceFilterOptions: MOCK_PRICE_FILTER_OPTIONS,
    heroBanner: MOCK_HERO_BANNER,
    siteConfig: MOCK_SITE_CONFIG,
  });
}

/**
 * Lấy dữ liệu giỏ hàng hiện tại của người dùng & cấu hình tính phí
 */
export async function fetchCartData(): Promise<{
  items: CartItem[];
  upsellOffer: UpsellOffer;
  cartConfig: CartConfig;
}> {
  // TODO: Thay thế hàm fetchCartData này bằng axios.get('http://localhost:3001/cart') hoặc lấy từ Zustand / Context
  return simulateDelay({
    items: MOCK_INITIAL_CART_ITEMS,
    upsellOffer: MOCK_UPSELL_OFFER,
    cartConfig: MOCK_CART_CONFIG,
  });
}

/**
 * Giả lập gửi đơn hàng mới lên Backend (Task 6: POST /orders)
 */
export async function createOrderMock(payload: {
  items: CartItem[];
  voucherCode?: string;
  totalAmount: number;
}): Promise<{ orderId: string; status: "PENDING" }> {
  // TODO: Thay thế hàm createOrderMock này bằng axios.post('http://localhost:3001/orders', payload)
  return simulateDelay({
    orderId: `BL-${Math.floor(10000 + Math.random() * 90000)}`,
    status: "PENDING",
  });
}

/**
 * Lấy toàn bộ dữ liệu trang Đổi điểm tích lũy & Kho Voucher (Task 10: Loyalty & Coupon)
 */
export async function fetchVoucherAndRewardsData(): Promise<{
  userProfile: UserProfile;
  vouchers: VoucherTicket[];
  rewardCatalog: RewardCatalogItem[];
  transactions: PointTransaction[];
  goldPerks: MembershipPerk[];
  membershipRules: MembershipRule[];
}> {
  // TODO: Thay thế hàm fetchVoucherAndRewardsData này bằng:
  // const [profileRes, vouchersRes, rewardsRes, txRes] = await Promise.all([
  //   axios.get('http://localhost:3001/loyalty/me'),
  //   axios.get('http://localhost:3001/vouchers/me'),
  //   axios.get('http://localhost:3001/loyalty/rewards'),
  //   axios.get('http://localhost:3001/loyalty/transactions'),
  // ]);
  return simulateDelay({
    userProfile: MOCK_USER_PROFILE,
    vouchers: MOCK_VOUCHERS,
    rewardCatalog: MOCK_REWARD_CATALOG,
    transactions: MOCK_POINT_TRANSACTIONS,
    goldPerks: MOCK_GOLD_PERKS,
    membershipRules: MOCK_MEMBERSHIP_RULES,
  });
}

/**
 * Giả lập đổi điểm BrewPoints nhận Voucher / Quà tặng
 */
export async function redeemRewardMock(reward: RewardCatalogItem): Promise<{
  newVoucher: VoucherTicket;
  newTransaction: PointTransaction;
}> {
  // TODO: Thay thế hàm redeemRewardMock này bằng axios.post('http://localhost:3001/loyalty/redeem', { rewardId: reward.id })
  const generatedCode = `REWARD${reward.points}`;
  return simulateDelay({
    newVoucher: {
      id: `v-redeem-${Date.now()}`,
      category: reward.tag === "Vận Chuyển" ? "shipping" : "cash",
      badgeLabel: "ĐỔI ĐIỂM",
      mainValue: `${reward.points}P`,
      subValue: "REWARD",
      conditionNote: "Đổi từ BrewPoints",
      title: reward.title,
      expiryBadge: "Còn 30 ngày",
      description: reward.description,
      code: generatedCode,
      expiryDate: "HSD: 30/11/2025",
      variant: "secondary",
    },
    newTransaction: {
      id: `tx-${Date.now()}`,
      timestamp: "Vừa xong",
      title: `Đổi quà: ${reward.title}`,
      reference: `REDEEM-${Math.floor(1000 + Math.random() * 9000)}`,
      source: "Cửa hàng Rewards Online",
      deltaText: `-${reward.points} điểm`,
      balanceAfter: 0,
      type: "spend",
    },
  });
}
