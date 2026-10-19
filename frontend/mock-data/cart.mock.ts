import type { CartConfig, CartItem, UpsellOffer } from "./types";

// ============================================================================
// MOCK DATA: GIỎ HÀNG MẶC ĐỊNH, UP-SELL OFFER & CẤU HÌNH TÍNH PHÍ GIỎ HÀNG
// ============================================================================

export const MOCK_CART_CONFIG: CartConfig = {
  freeshipThreshold: 280000,
  defaultShippingFee: 15000,
  defaultVoucherCode: "BREWLITE20K",
  defaultMemberDiscount: 20000,
  pickupBranchName: "BrewLite Saigon Center",
  pickupTimeNotice: "trong 15 phút",
  taxNotice: "(Đã bao gồm thuế GTGT 8%)",
};

export const MOCK_INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: "cartItem1",
    name: "Cà phê Sữa Đá Sài Gòn",
    unitPrice: 65000,
    qty: 2,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC7mqw_OV826ImKUuoqFmyvYBg5mAvCPmco-fM1eqk5rTK9ax6WTVGwSemiuxwE_0H3PLN1ZVHLWXG9ag-VSJ3qkX8P5LJgNUu2L_RqjOLxsTlxKcOE-3mDMXhhd4IqN_EyYQNhDG3wMWVytts_MJITKYS65c-DghftfAmFK_A6f4IfY1egjY5_zqL0R-9eLlF6m7paMntYIruek4dh5sPv2ynR4Gq2W2FLdwRjDwp1Sg4Ff8HezrGI",
    imageAlt:
      "Close up shot of Vietnamese Iced Milk Coffee in clear glass with condensed milk layer and rich crema swirls, studio cafe style.",
    customizations: [
      {
        text: "Size M (+6.000đ) • 50% đường",
        dotColor: "bg-primary/60",
      },
      {
        text: "Topping: Thạch Cà Phê (+8.000đ), Kem Cheese (+12.000đ)",
        dotColor: "bg-secondary-container",
        muted: true,
      },
    ],
  },
  {
    id: "cartItem2",
    name: "Cold Brew Cam Sả Thảo Mộc",
    unitPrice: 74000,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA87eEtI2K7XoNg3hivIlqub1VYiLPalxZmmrFHAfBXHsxVAh64sxZb1tEAOKFAFFZSzQuYji2F8_hutr4nKoDKPdY2L-7FFhAvioWB1DN2d6MD7ZziWdaqj4DXkLYpN1lp0JHxKKE40zMB7uTcxk44cRWS9GCC2JMK_ziL2QasOLwnz54fi5GK25MAsNZjmDSEUXgGB7FjbZdgUUQMvvuPdvefagAuGkKMtHrHuEOpGXTv4bDgRZlQ",
    imageAlt:
      "Amber cold brew coffee infused with fresh orange slice and fragrant lemongrass stalk in clear modern tumbler, cafe lighting.",
    customizations: [
      {
        text: "Size L (+12.000đ) • Không topping",
        dotColor: "bg-primary/60",
      },
      {
        text: "Đá riêng 70%",
        dotColor: "bg-secondary-container",
        muted: true,
      },
    ],
  },
  {
    id: "cartItem3",
    name: "Croissant Bơ Pháp Nướng",
    unitPrice: 38000,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCEGhGqvQFCMTt4S_1bFUl-uGRXw8MVCXbawPjxWNnD81K9caHnZK4_WuPC1gdWPGOZgHErFgihRB-bV0bEKz6wNt8SyuZgdf3ILKQUM2nYaTioYTYHutAJGAXRpCpMnANkaDzWchuO3srZEHf_T-SIrPK39x0p9gcaw5y4hjC4JQTHHA23PtmWSx9OhIcAydVDjCJ3J4kwm-KlMQl166cAsZZLCNZYSYDoONFyhETPvOmmyViV0K0W",
    imageAlt:
      "Flaky golden buttery Parisian croissant warmed fresh from the oven, served on minimal aesthetic cafe napkin.",
    customizations: [
      {
        text: "Yêu cầu: Nướng nóng giòn trước khi giao",
        dotColor: "bg-tertiary",
      },
    ],
  },
];

export const MOCK_UPSELL_OFFER: UpsellOffer = {
  id: "upsell-almond-cookie",
  title: "Thêm Bánh Quy Bơ Hạnh Nhân?",
  subtitle: "Chỉ +18.000đ khi gọi cùng Cold Brew",
  item: {
    id: "cartItemUpsell",
    name: "Bánh Quy Bơ Hạnh Nhân",
    unitPrice: 18000,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCEGhGqvQFCMTt4S_1bFUl-uGRXw8MVCXbawPjxWNnD81K9caHnZK4_WuPC1gdWPGOZgHErFgihRB-bV0bEKz6wNt8SyuZgdf3ILKQUM2nYaTioYTYHutAJGAXRpCpMnANkaDzWchuO3srZEHf_T-SIrPK39x0p9gcaw5y4hjC4JQTHHA23PtmWSx9OhIcAydVDjCJ3J4kwm-KlMQl166cAsZZLCNZYSYDoONFyhETPvOmmyViV0K0W",
    imageAlt: "Bánh Quy Bơ Hạnh Nhân giòn thơm",
    customizations: [
      {
        text: "Ưu đãi mua kèm Cold Brew",
        dotColor: "bg-tertiary",
      },
    ],
  },
};
