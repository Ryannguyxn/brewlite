// ============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES / INTERFACES) CHO BREWLITE FRONTEND
// Đồng đội Backend/Frontend có thể đối chiếu trực tiếp với DTO của NestJS/Prisma
// ============================================================================

export type CategoryId =
  | "all"
  | "traditional"
  | "espresso"
  | "tea"
  | "bakery";

export interface CategoryOption {
  id: CategoryId;
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: CategoryId;
  rating: string;
  reviews: string;
  description: string;
  price: number;
  image: string;
  imageAlt: string;
  badge?: "Best Seller" | "Mới";
  outOfStock?: boolean;
}

export interface CartCustomization {
  text: string;
  dotColor: string;
  muted?: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  image: string;
  imageAlt: string;
  customizations: CartCustomization[];
}

export interface UpsellOffer {
  id: string;
  title: string;
  subtitle: string;
  item: CartItem;
}

export interface CartConfig {
  freeshipThreshold: number;
  defaultShippingFee: number;
  defaultVoucherCode: string;
  defaultMemberDiscount: number;
  pickupBranchName: string;
  pickupTimeNotice: string;
  taxNotice: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  memberCode: string;
  memberSince: string;
  tierName: string;
  tierBadge: string;
  nextTierName: string;
  points: number;
  nextTierPoints: number;
  savedThisMonth: number;
  avatarUrl: string;
  nextTierPerksSummary: string;
  equivalentRewardHint: string;
}

export interface HeroBannerData {
  seasonBadge: string;
  roastSubtitle: string;
  headlineLine1: string;
  headlineHighlight: string;
  description: string;
  featuredLabel: string;
  featuredDrinkName: string;
  featuredPromoText: string;
}

export interface BranchInfo {
  id: string;
  name: string;
  address: string;
}

export interface QuickLink {
  label: string;
  href: string;
}

export interface SiteConfigData {
  brandName: string;
  logoUrl: string;
  selectedBranch: string;
  searchPlaceholder: string;
  hotline: string;
  brandStory: string;
  copyright: string;
  tagline: string;
  deliveryHighlight: string;
  totalCatalogCount: number;
  branches: BranchInfo[];
  quickLinks: QuickLink[];
  rewardsBanner: {
    title: string;
    description: string;
    inputPlaceholder: string;
    buttonLabel: string;
  };
}

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

export interface MembershipPerk {
  id: string;
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
  title: string;
  description: string;
}

export interface MembershipRule {
  id: string;
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
  title: string;
  description: string;
}
