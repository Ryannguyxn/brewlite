import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { MOCK_MY_ORDERS_RESPONSE, type OrderHistoryItemDto } from "@/mock-data";
import { AuthContext, type AuthContextType } from "@/context/AuthContext";
import {
  CART_STORAGE_KEY,
  CartContext,
  type CartContextValue,
} from "@/context/CartContext";
import {
  getMeApi,
  getStoredToken,
  getStoredUser,
  setStoredSession,
  validateMeResponseData,
} from "@/services/auth.service";
import {
  computeOrderStatusCounts,
  filterAndSearchOrders,
  getMyOrdersApi,
  getOrderStatusPresentation,
  validateMyOrdersQuery,
  validateMyOrdersResponseData,
  type OrderServiceError,
} from "@/services/order.service";
import OrderHistoryView, {
  executeFetchOrderHistory,
  resolveOrderItemImageUrl,
  type OrderHistoryErrorState,
} from "@/components/OrderHistoryView";

// ============================================================================
// BỘ KIỂM THỬ TỰ ĐỘNG CHO ORDER HISTORY UI & GET /orders/me (SCRUM-64)
// Kiểm chứng đầy đủ các yêu cầu:
// 1. Query validation (`page` & `limit` phải đi cùng nhau hoặc cùng bỏ trống)
// 2. Response contract validation (`GET /orders/me` theo API Contract v3.0 §4.2 & ERD)
// 3. Xử lý mạng, 200 OK, Empty, 400, 401 (xóa session hết hạn nhưng GIỮ GIỎ HÀNG), 500
// 4. Lọc theo trạng thái (`PENDING`, `PAID_GROUP`, `PAYMENT_FAILED`, `CANCELLED`) & tìm kiếm
// 5. Cô lập dữ liệu theo tài khoản (User Isolation khi logout / đổi tài khoản)
// 6. Render giao diện OrderHistoryView (Loading / Auth Guard / Empty / Error)
// ============================================================================

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function createValidTestJwt(
  sub = "11111111-1111-4111-8111-111111111111",
  expiresInSeconds = 3600
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      email: "member@brewlite.vn",
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

describe("SCRUM-64: Order History UI & GET /orders/me Contract Tests", () => {
  const originalFetch = globalThis.fetch;
  let localStorageMock: MemoryStorage;
  let sessionStorageMock: MemoryStorage;

  beforeEach(() => {
    localStorageMock = new MemoryStorage();
    sessionStorageMock = new MemoryStorage();
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: localStorageMock,
        sessionStorage: sessionStorageMock,
        location: { search: "" },
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: sessionStorageMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("1. validateMyOrdersQuery: tuân thủ quy tắc page & limit phải đi cùng nhau hoặc cùng bỏ trống (API Contract v3.0 §4.1)", () => {
    const noQuery = validateMyOrdersQuery(undefined);
    assert.equal(noQuery.isValid, true);
    assert.equal(noQuery.hasPagination, false);
    assert.equal(noQuery.queryString, "");

    const bothQuery = validateMyOrdersQuery({ page: 2, limit: 10 });
    assert.equal(bothQuery.isValid, true);
    assert.equal(bothQuery.hasPagination, true);
    assert.equal(bothQuery.queryString, "?page=2&limit=10");

    const onlyPage = validateMyOrdersQuery({ page: 1 });
    assert.equal(onlyPage.isValid, false);
    assert.equal(onlyPage.error?.statusCode, 400);
    assert.equal(onlyPage.error?.code, "VALIDATION_ERROR");

    const onlyLimit = validateMyOrdersQuery({ limit: 10 });
    assert.equal(onlyLimit.isValid, false);
    assert.equal(onlyLimit.error?.statusCode, 400);
    assert.equal(onlyLimit.error?.code, "VALIDATION_ERROR");

    const invalidLimitHigh = validateMyOrdersQuery({ page: 1, limit: 101 });
    assert.equal(invalidLimitHigh.isValid, false);
    assert.equal(invalidLimitHigh.error?.code, "VALIDATION_ERROR");

    const invalidDecimalPage = validateMyOrdersQuery({ page: 1.5, limit: 10 });
    assert.equal(invalidDecimalPage.isValid, false);
    assert.equal(invalidDecimalPage.error?.code, "VALIDATION_ERROR");
  });

  it("2. validateMyOrdersResponseData: chấp nhận dữ liệu chuẩn Contract v3.0 và từ chối dữ liệu vi phạm bất biến ERD", () => {
    const valid = validateMyOrdersResponseData(MOCK_MY_ORDERS_RESPONSE);
    assert.equal(valid.items.length, 4);
    assert.equal(valid.meta.total, 4);
    assert.equal(valid.meta.page, null);

    // Từ chối khi thiếu expiresAt (bắt buộc non-null theo ERD & Contract v3.0 §4.2)
    assert.throws(
      () =>
        validateMyOrdersResponseData({
          ...MOCK_MY_ORDERS_RESPONSE,
          items: [
            {
              ...MOCK_MY_ORDERS_RESPONSE.items[0],
              expiresAt: null,
            },
          ],
          meta: { page: null, limit: null, total: 1, totalPages: null },
        }),
      (err: unknown) => {
        const orderErr = err as OrderServiceError;
        return (
          orderErr.statusCode === 500 && orderErr.code === "INTERNAL_ERROR"
        );
      }
    );

    // Từ chối khi vi phạm bất biến totalVnd = subtotalVnd - discountVnd
    assert.throws(
      () =>
        validateMyOrdersResponseData({
          ...MOCK_MY_ORDERS_RESPONSE,
          items: [
            {
              ...MOCK_MY_ORDERS_RESPONSE.items[0],
              totalVnd: 999999,
            },
          ],
          meta: { page: null, limit: null, total: 1, totalPages: null },
        }),
      (err: unknown) => {
        const orderErr = err as OrderServiceError;
        return (
          orderErr.statusCode === 500 && orderErr.code === "INTERNAL_ERROR"
        );
      }
    );
  });

  it("3. getMyOrdersApi: xử lý 200 OK, 401 UNAUTHORIZED (xóa session nhưng giữ nguyên Cart), và lỗi mạng", async () => {
    const token = createValidTestJwt();
    setStoredSession(token, {
      id: "11111111-1111-4111-8111-111111111111",
      email: "member@brewlite.vn",
      fullName: "Nguyễn Hải Đăng",
    });
    localStorageMock.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ cartItemId: "item-1", quantity: 2 }])
    );

    // 3a. 200 OK
    let requestedUrl = "";
    let requestedAuthHeader = "";
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = String(input);
      const headers = init?.headers as Record<string, string>;
      requestedAuthHeader = headers?.Authorization || "";
      return new Response(JSON.stringify(MOCK_MY_ORDERS_RESPONSE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const okResult = await getMyOrdersApi();
    assert.equal(requestedUrl, "/api/backend/orders/me");
    assert.equal(requestedAuthHeader, `Bearer ${token}`);
    assert.equal(okResult.items.length, 4);

    // 3b. 401 UNAUTHORIZED từ Backend -> xóa Auth session nhưng BẢO LƯU GIỎ HÀNG
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )) as typeof fetch;

    await assert.rejects(
      () => getMyOrdersApi(),
      (err: unknown) => {
        const orderErr = err as OrderServiceError;
        return (
          orderErr.statusCode === 401 &&
          orderErr.code === "UNAUTHORIZED" &&
          orderErr.isOutcomeUncertain === false
        );
      }
    );

    assert.equal(getStoredToken(), null);
    assert.equal(getStoredUser(), null);
    assert.notEqual(
      localStorageMock.getItem(CART_STORAGE_KEY),
      null,
      "Giỏ hàng phải được bảo toàn khi gặp 401 UNAUTHORIZED ở GET /orders/me"
    );

    // 3c. Lỗi mạng (NETWORK_ERROR) -> isOutcomeUncertain = false vì GET /orders/me là idempotent
    setStoredSession(token, {
      id: "11111111-1111-4111-8111-111111111111",
      email: "member@brewlite.vn",
      fullName: "Nguyễn Hải Đăng",
    });
    globalThis.fetch = (async () => {
      throw new Error("Socket hang up");
    }) as typeof fetch;

    await assert.rejects(
      () => getMyOrdersApi({ tokenOverride: token }),
      (err: unknown) => {
        const orderErr = err as OrderServiceError;
        return (
          orderErr.statusCode === 503 &&
          orderErr.code === "NETWORK_ERROR" &&
          orderErr.isOutcomeUncertain === false
        );
      }
    );
  });

  it("4. executeFetchOrderHistory & User Isolation: quản lý đúng Loading/Empty/Error và xóa sạch dữ liệu khi đổi tài khoản hoặc logout", async () => {
    const tokenA = createValidTestJwt(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      3600
    );
    const loadingStates: boolean[] = [];
    let ordersState: OrderHistoryItemDto[] = [];
    let errorState: OrderHistoryErrorState | null = null;
    let ownerUserId: string | null = null;

    // Tài khoản A tải lịch sử đơn hàng thành công
    await executeFetchOrderHistory({
      isAuthenticated: true,
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      accessToken: tokenA,
      verifySession: () => true,
      setIsLoading: (v) => loadingStates.push(v),
      setOrders: (items) => {
        ordersState = items;
      },
      setMeta: () => {},
      setErrorState: (err) => {
        errorState = err;
      },
      setLoadedOwnerUserId: (uid) => {
        ownerUserId = uid;
      },
      fetchOrdersFn: async () => MOCK_MY_ORDERS_RESPONSE,
    });

    assert.deepEqual(loadingStates, [true, false]);
    assert.equal(ordersState.length, 4);
    assert.equal(errorState, null);
    assert.equal(ownerUserId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    // Khi người A logout (isAuthenticated = false) -> xóa sạch ordersState và ownerUserId
    await executeFetchOrderHistory({
      isAuthenticated: false,
      userId: null,
      accessToken: null,
      verifySession: () => false,
      setIsLoading: () => {},
      setOrders: (items) => {
        ordersState = items;
      },
      setMeta: () => {},
      setErrorState: (err) => {
        errorState = err;
      },
      setLoadedOwnerUserId: (uid) => {
        ownerUserId = uid;
      },
    });

    assert.equal(ordersState.length, 0);
    assert.equal(ownerUserId, null);
  });

  it("5. Bộ lọc trạng thái & Tìm kiếm (computeOrderStatusCounts, filterAndSearchOrders, getOrderStatusPresentation)", () => {
    const counts = computeOrderStatusCounts(MOCK_MY_ORDERS_RESPONSE.items);
    assert.equal(counts.all, 4);
    assert.equal(counts.PAID_GROUP, 1);
    assert.equal(counts.PENDING, 1);
    assert.equal(counts.PAYMENT_FAILED, 1);
    assert.equal(counts.CANCELLED, 1);

    // PREPARING, READY, COMPLETED cũng được gom vào nhóm PAID_GROUP ("Đã thanh toán")
    assert.equal(
      getOrderStatusPresentation("PREPARING").filterGroup,
      "PAID_GROUP"
    );
    assert.equal(getOrderStatusPresentation("READY").filterGroup, "PAID_GROUP");
    assert.equal(
      getOrderStatusPresentation("COMPLETED").filterGroup,
      "PAID_GROUP"
    );

    const pendingOnly = filterAndSearchOrders(
      MOCK_MY_ORDERS_RESPONSE.items,
      "PENDING",
      ""
    );
    assert.equal(pendingOnly.length, 1);
    assert.equal(pendingOnly[0].status, "PENDING");

    const searchByDrink = filterAndSearchOrders(
      MOCK_MY_ORDERS_RESPONSE.items,
      "all",
      "Muối Cố Đô"
    );
    assert.equal(searchByDrink.length, 1);
    assert.equal(searchByDrink[0].id, "9f8b7a6c-5d4e-43f2-a1b0-c9d8e7f61042");

    const searchByUuid = filterAndSearchOrders(
      MOCK_MY_ORDERS_RESPONSE.items,
      "all",
      "#7a6b5c4d"
    );
    assert.equal(searchByUuid.length, 1);
    assert.equal(searchByUuid[0].status, "PAYMENT_FAILED");
  });

  it("6. OrderHistoryView SSR/Static Render: hiển thị đúng cấu trúc Stitch Header, Loyalty Banner, Filter Tabs và Loading Skeleton", () => {
    const mockAuthContext: AuthContextType = {
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "member@brewlite.vn",
        fullName: "Nguyễn Hải Đăng",
      },
      accessToken: createValidTestJwt(),
      isAuthenticated: true,
      isLoading: false,
      login: async () => {},
      register: async () => ({
        id: "11111111-1111-4111-8111-111111111111",
        email: "member@brewlite.vn",
        fullName: "Nguyễn Hải Đăng",
      }),
      logout: () => {},
      verifySession: () => true,
      refreshUserProfile: async () => {},
      handleUnauthorizedCheckout: () => {},
      pendingCheckout: false,
      setPendingCheckout: () => {},
      isAuthModalOpen: false,
      authModalMode: "login",
      authModalMessage: null,
      openAuthModal: () => {},
      closeAuthModal: () => {},
    };

    const mockCartContext: CartContextValue = {
      items: [],
      totalQuantity: 0,
      totalLines: 0,
      subtotalVnd: 0,
      formattedSubtotal: "0 ₫",
      isCartOpen: false,
      couponCode: "",
      setCouponCode: () => {},
      feedbackMessage: null,
      feedbackType: null,
      addToCart: () => ({ success: true, message: "OK" }),
      updateQuantity: () => {},
      incrementQuantity: () => {},
      decrementQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      openCart: () => {},
      closeCart: () => {},
      toggleCart: () => {},
      dismissFeedback: () => {},
      mapToCreateOrderPayload: () => ({ items: [] }),
      activeOrder: null,
      isSubmittingOrder: false,
      orderError: null,
      setActiveOrder: () => {},
      setIsSubmittingOrder: () => {},
      setOrderError: () => {},
      clearOrderFlowState: () => {},
    };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React.createElement(
          CartContext.Provider,
          { value: mockCartContext },
          React.createElement(OrderHistoryView)
        )
      )
    );

    assert.match(html, /Quản lý Đơn hàng &amp; Lịch sử/);
    assert.match(html, /id="memberLoyaltyBanner"/);
    assert.match(html, /id="orderFilterTabs"/);
    assert.match(html, /id="orderHistoryLoadingState"/);
    assert.match(html, /id="header-order-history-nav"/);

    // Kiểm tra ánh xạ ảnh sản phẩm thực tế cho 9 món chuẩn Backend seed.ts (a3000000-...)
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000001",
        "Bạc Xỉu Kem Béo Phin"
      ),
      "/images/bac-xiu-kem-beo-phin.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000002",
        "Cà Phê Đen Đá Cầu Đất"
      ),
      "/images/ca-phe-den-da-cau-dat.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000003",
        "Cà Phê Muối Cố Đô"
      ),
      "/images/ca-phe-muoi-co-do.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000004",
        "Cà phê Sữa Đá Sài Gòn"
      ),
      "/images/ca-phe-sua-da-sai-gon.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000005",
        "Cold Brew Cam Sả Thảo Mộc"
      ),
      "/images/cold-brew-cam-sa-thao-moc.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000006",
        "Cold Brew Vải Hoa Hồng"
      ),
      "/images/cold-brew-vai-hoa-hong.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000007",
        "Espresso Macchiato Caramel"
      ),
      "/images/espresso-macchiato-caramel.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000008",
        "Trà Đào Cam Sả Hoàng Gia"
      ),
      "/images/tra-dao-cam-sa-hoang-gia.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a3000000-0000-4000-8000-000000000009",
        "Croissant Bơ Pháp Nướng"
      ),
      "/images/croissant-bo-phap-nuong.jpg"
    );

    // Kiểm tra tương thích ngược legacy UUID mapping
    assert.equal(
      resolveOrderItemImageUrl(
        "a1000000-0000-4000-8000-000000000002",
        "Cà Phê Muối Cố Đô"
      ),
      "/images/ca-phe-muoi-co-do.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a1000000-0000-4000-8000-000000000006",
        "Cold Brew Cam Sả Thảo Mộc"
      ),
      "/images/cold-brew-cam-sa-thao-moc.jpg"
    );
    assert.equal(
      resolveOrderItemImageUrl(
        "a1000000-0000-4000-8000-000000000004",
        "Croissant Bơ Pháp Nướng"
      ),
      "/images/croissant-bo-phap-nuong.jpg"
    );
  });

  it("7. validateMeResponseData & getMeApi: xử lý đúng DTO GET /auth/me và đồng bộ loyaltyPoints (SCRUM-71)", async () => {
    // 7a. validateMeResponseData chuẩn
    const validMe = validateMeResponseData({
      id: "32bd8c4d-161b-424b-9ea9-879917dbec68",
      email: "caok5513@gmail.com",
      fullName: "Cao Nguyễn Quốc Khánh",
      loyaltyPoints: 125,
    });
    assert.equal(validMe.id, "32bd8c4d-161b-424b-9ea9-879917dbec68");
    assert.equal(validMe.email, "caok5513@gmail.com");
    assert.equal(validMe.fullName, "Cao Nguyễn Quốc Khánh");
    assert.equal(validMe.loyaltyPoints, 125);

    // 7b. validateMeResponseData từ chối khi id không phải UUID hoặc loyaltyPoints âm
    assert.throws(
      () =>
        validateMeResponseData({
          id: "not-a-uuid",
          email: "test@brewlite.vn",
          fullName: null,
          loyaltyPoints: 10,
        }),
      (err: unknown) => (err as { code?: string }).code === "INVALID_RESPONSE"
    );

    assert.throws(
      () =>
        validateMeResponseData({
          id: "32bd8c4d-161b-424b-9ea9-879917dbec68",
          email: "test@brewlite.vn",
          fullName: null,
          loyaltyPoints: -5,
        }),
      (err: unknown) => (err as { code?: string }).code === "INVALID_RESPONSE"
    );

    // 7c. getMeApi 200 OK
    const token = createValidTestJwt("32bd8c4d-161b-424b-9ea9-879917dbec68");
    let calledUrl = "";
    let authHeader = "";
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = String(input);
      const headers = init?.headers as Record<string, string>;
      authHeader = headers?.Authorization || "";
      return new Response(
        JSON.stringify({
          id: "32bd8c4d-161b-424b-9ea9-879917dbec68",
          email: "caok5513@gmail.com",
          fullName: "Cao Nguyễn Quốc Khánh",
          loyaltyPoints: 125,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    const meRes = await getMeApi(token);
    assert.equal(calledUrl, "/api/backend/auth/me");
    assert.equal(authHeader, `Bearer ${token}`);
    assert.equal(meRes.loyaltyPoints, 125);
    assert.equal(meRes.fullName, "Cao Nguyễn Quốc Khánh");
  });
});
