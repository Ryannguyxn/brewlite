import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";
import CartDrawer, {
  executeCheckoutOrderSubmission,
  type OrderCallOutcome,
  proceedToCheckoutStep,
} from "@/components/CartDrawer";
import { AuthContext, type AuthContextType } from "@/context/AuthContext";
import {
  ACTIVE_ORDER_STORAGE_KEY,
  buildCreateOrderPayloadFromCart,
  CartContext,
  type CartContextValue,
  type CartItem,
  generateCartItemKey,
  mergeDuplicateCartItems,
  persistActiveOrderForUser,
  restoreActiveOrderForUser,
  validateAndSanitizeCartItem,
} from "@/context/CartContext";
import type {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
  OrderSubmissionErrorState,
} from "@/mock-data";
import {
  clearStoredSession,
  getStoredToken,
  setStoredSession,
} from "@/services/auth.service";
import {
  createOrderApi,
  describeOrderErrorDetails,
  getFriendlyOrderErrorTitle,
  normalizeCouponCode,
  type OrderServiceError,
  sanitizeCreateOrderPayload,
  toOrderSubmissionErrorState,
  validateCouponCodeInput,
  validateCreateOrderPayload,
  validateOrderResponseData,
} from "@/services/order.service";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const localStorageMock = new MemoryStorage();
const sessionStorageMock = new MemoryStorage();

(globalThis as Record<string, unknown>).localStorage = localStorageMock;
(globalThis as Record<string, unknown>).sessionStorage = sessionStorageMock;
(globalThis as Record<string, unknown>).window = globalThis;

function createValidMockJwt(
  sub = "550e8400-e29b-41d4-a716-446655440000",
  expiresInSeconds = 3600
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

function createSampleCartItems(): CartItem[] {
  return [
    {
      id: "cart-line-1",
      productId: "550e8400-e29b-41d4-a716-446655440000",
      productName: "Cà Phê Sữa Đá Sài Gòn",
      imageUrl: "/images/ca-phe-sua-da-sai-gon.jpg",
      size: "M",
      sizeMultiplierPercent: 120,
      sizePriceVnd: 54000,
      basePriceVnd: 45000,
      toppings: [
        {
          id: "7d44a44c-8d1a-4af3-98cb-90e5d4c8a001",
          name: "Trân châu trắng",
          priceVnd: 5000,
        },
      ],
      toppingIds: ["7d44a44c-8d1a-4af3-98cb-90e5d4c8a001"],
      quantity: 2,
      unitPriceVnd: 59000,
      lineTotalVnd: 118000,
      note: "Ít đá",
      sizePolicy: "STANDARD",
    },
  ];
}

function createValidOrderResponse(): CreateOrderResponseDto {
  return {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    status: "PENDING",
    items: [
      {
        id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
        productId: "550e8400-e29b-41d4-a716-446655440000",
        productName: "Cà Phê Sữa Đá Sài Gòn",
        size: "M",
        sizeMultiplierPercent: 120,
        basePriceVnd: 45000,
        quantity: 2,
        unitPriceVnd: 59000,
        lineTotalVnd: 118000,
        toppings: [
          {
            id: "7d44a44c-8d1a-4af3-98cb-90e5d4c8a001",
            name: "Trân châu trắng",
            priceVnd: 5000,
          },
        ],
      },
    ],
    couponCode: null,
    subtotalVnd: 118000,
    discountVnd: 0,
    totalVnd: 118000,
    createdAt: "2026-10-26T15:00:00.000Z",
  };
}

function renderCartDrawerMarkup(options: {
  items?: CartItem[];
  isAuthenticated?: boolean;
  userId?: string;
  initialCheckoutStep?: "cart" | "review";
  initialIsSubmittingOrder?: boolean;
  initialOrderOutcome?: OrderCallOutcome | null;
  activeOrder?: CreateOrderResponseDto | null;
  onClearCart?: () => void;
}): string {
  const items = options.items ?? createSampleCartItems();
  const isAuthenticated = options.isAuthenticated ?? true;
  const userId = options.userId ?? "550e8400-e29b-41d4-a716-446655440000";
  const mockToken = isAuthenticated ? createValidMockJwt(userId) : null;

  const cartValue: CartContextValue = {
    items,
    totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
    totalLines: items.length,
    subtotalVnd: items.reduce((sum, i) => sum + i.lineTotalVnd, 0),
    formattedSubtotal: "118.000 ₫",
    isCartOpen: true,
    couponCode: "",
    setCouponCode: () => {},
    feedbackMessage: null,
    feedbackType: null,
    addToCart: () => ({ success: true, message: "OK" }),
    updateQuantity: () => {},
    incrementQuantity: () => {},
    decrementQuantity: () => {},
    removeFromCart: () => {},
    clearCart: options.onClearCart ?? (() => {}),
    openCart: () => {},
    closeCart: () => {},
    toggleCart: () => {},
    dismissFeedback: () => {},
    mapToCreateOrderPayload: () => buildCreateOrderPayloadFromCart(items),
    activeOrder: options.activeOrder ?? null,
    isSubmittingOrder: options.initialIsSubmittingOrder ?? false,
    orderError: null,
    setActiveOrder: () => {},
    setIsSubmittingOrder: () => {},
    setOrderError: () => {},
    clearOrderFlowState: () => {},
  };

  const authValue: AuthContextType = {
    user: isAuthenticated
      ? {
          id: userId,
          email: "khachhang@brewlite.vn",
          fullName: "Nguyễn Văn A",
        }
      : null,
    accessToken: mockToken,
    isAuthenticated,
    isLoading: false,
    login: async () => {},
    register: async () => ({
      id: userId,
      email: "khachhang@brewlite.vn",
      fullName: "Nguyễn Văn A",
      createdAt: "2026-10-26T15:00:00.000Z",
    }),
    logout: () => {},
    verifySession: () => isAuthenticated,
    handleUnauthorizedCheckout: () => {},
    pendingCheckout: false,
    setPendingCheckout: () => {},
    isAuthModalOpen: false,
    authModalMode: "login",
    authModalMessage: null,
    openAuthModal: () => {},
    closeAuthModal: () => {},
  };

  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: authValue },
      React.createElement(
        CartContext.Provider,
        { value: cartValue },
        React.createElement(CartDrawer, {
          initialCheckoutStep: options.initialCheckoutStep ?? "review",
          initialIsSubmittingOrder: options.initialIsSubmittingOrder ?? false,
          initialOrderOutcome: options.initialOrderOutcome ?? null,
        })
      )
    )
  );
}

describe("SCRUM-43 & SCRUM-44 Checkout Flow, Cart Integration & POST /orders Automated Tests", () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe("1. Payload Mapping & Cart Normalization (API Contract v2.1 / v3.0)", () => {
    it("maps CartItem[] to CreateOrderDto stripping all client-only fields and normalizing UUIDs/couponCode", () => {
      const cartItems = createSampleCartItems();
      cartItems[0].productId = "  550E8400-E29B-41D4-A716-446655440000  ";
      cartItems[0].toppingIds = ["  7D44A44C-8D1A-4AF3-98CB-90E5D4C8A001 "];

      const payload = buildCreateOrderPayloadFromCart(
        cartItems,
        "  welcome20  "
      );

      assert.deepEqual(payload, {
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440000",
            size: "M",
            toppingIds: ["7d44a44c-8d1a-4af3-98cb-90e5d4c8a001"],
            quantity: 2,
          },
        ],
        couponCode: "WELCOME20",
      });

      // Verify forbidden client fields are never present
      const rawRecord = payload as unknown as Record<string, unknown>;
      assert.equal("userId" in rawRecord, false);
      assert.equal("status" in rawRecord, false);
      assert.equal("totalVnd" in rawRecord, false);
      assert.equal("subtotalVnd" in rawRecord, false);
      assert.equal(
        "unitPriceVnd" in
          (payload.items[0] as unknown as Record<string, unknown>),
        false
      );
      assert.equal(
        "productName" in
          (payload.items[0] as unknown as Record<string, unknown>),
        false
      );
    });

    it("rejects decimal quantity without Math.trunc auto-fixing and rejects duplicate merged quantity > 10 without Math.min clamping", () => {
      const decimalValidation = validateCreateOrderPayload({
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440000",
            size: "M",
            toppingIds: [],
            quantity: 2.5,
          },
        ],
      });
      assert.equal(decimalValidation.isValid, false);
      assert.equal(decimalValidation.error?.code, "VALIDATION_ERROR");
      assert.equal(decimalValidation.error?.isOutcomeUncertain, false);

      // Merging two duplicate lines (6 + 5 = 11 > 10) must throw instead of clamping to 10
      const itemA = validateAndSanitizeCartItem({
        id: "line-a",
        productId: "550e8400-e29b-41d4-a716-446655440000",
        productName: "Cà Phê Sữa Đá",
        size: "M",
        sizeMultiplierPercent: 120,
        basePriceVnd: 35000,
        toppings: [],
        quantity: 6,
      });
      const itemB = validateAndSanitizeCartItem({
        id: "line-b",
        productId: "550e8400-e29b-41d4-a716-446655440000",
        productName: "Cà Phê Sữa Đá",
        size: "M",
        sizeMultiplierPercent: 120,
        basePriceVnd: 35000,
        toppings: [],
        quantity: 5,
      });
      assert.ok(itemA && itemB);
      assert.equal(
        generateCartItemKey(itemA.productId, itemA.size, ["t2", "t1"]),
        generateCartItemKey(itemB.productId, itemB.size, ["T1", "T2"])
      );
      assert.throws(() => {
        mergeDuplicateCartItems([itemA, itemB]);
      }, /vượt quá giới hạn tối đa 10 ly/);
    });

    it("normalizes and validates couponCode whitespace and length constraints", () => {
      assert.equal(normalizeCouponCode("   "), undefined);
      assert.equal(
        validateCouponCodeInput("WELCOME10 EXTRA").isValid,
        false
      );
      assert.equal(validateCouponCodeInput("A".repeat(31)).isValid, false);
      assert.deepEqual(
        sanitizeCreateOrderPayload({
          items: [
            {
              productId: "550e8400-e29b-41d4-a716-446655440000",
              size: "S",
              toppingIds: [],
              quantity: 1,
            },
          ],
          couponCode: "   ",
        }),
        {
          items: [
            {
              productId: "550e8400-e29b-41d4-a716-446655440000",
              size: "S",
              toppingIds: [],
              quantity: 1,
            },
          ],
        }
      );
    });
  });

  describe("2. Error Details Mapping & Error State Normalization per API Contract (SCRUM-43 & SCRUM-44)", () => {
    it("maps INSUFFICIENT_STOCK details with requestedQuantity and availableQuantity per API Contract §8.7", () => {
      const productId = "550e8400-e29b-41d4-a716-446655440000";
      const lines = describeOrderErrorDetails(
        [
          {
            productId,
            requestedQuantity: 6,
            availableQuantity: 5,
          },
        ],
        { [productId]: "Cà Phê Sữa Đá Sài Gòn" }
      );

      assert.equal(lines.length, 1);
      assert.ok(lines[0].includes("Cà Phê Sữa Đá Sài Gòn"));
      assert.ok(lines[0].includes("yêu cầu: 6, khả dụng: 5"));
    });

    it("maps INVALID_CART reasons (PRODUCT_UNAVAILABLE, INVALID_SIZE, TOPPING_NOT_ALLOWED, etc.) per API Contract §8.7", () => {
      const lines = describeOrderErrorDetails([
        { itemIndex: 0, reason: "PRODUCT_UNAVAILABLE" },
        { itemIndex: 1, reason: "INVALID_SIZE" },
        { itemIndex: 2, reason: "TOPPING_NOT_ALLOWED" },
        { itemIndex: 3, reason: "TOPPING_NOT_FOUND" },
        { itemIndex: 4, reason: "TOPPING_UNAVAILABLE" },
        { itemIndex: 5, reason: "DUPLICATE_TOPPING" },
        { itemIndex: 6, reason: "TOO_MANY_TOPPINGS" },
        { itemIndex: 7, reason: "DUPLICATE_CONFIGURATION" },
        { itemIndex: 8, reason: "INVALID_PRICE_DATA" },
      ]);

      assert.equal(lines.length, 9);
      assert.ok(lines[0].includes("Dòng món #1") && lines[0].includes("không khả dụng"));
      assert.ok(lines[1].includes("Dòng món #2") && lines[1].includes("Kích cỡ đã chọn không hợp lệ"));
      assert.ok(lines[2].includes("Dòng món #3") && lines[2].includes("không hỗ trợ thêm topping"));
      assert.ok(lines[3].includes("Dòng món #4") && lines[3].includes("Topping đã chọn không tồn tại"));
      assert.ok(lines[4].includes("Dòng món #5") && lines[4].includes("Topping đã chọn hiện không khả dụng"));
      assert.ok(lines[5].includes("Dòng món #6") && lines[5].includes("trùng một loại topping"));
      assert.ok(lines[6].includes("Dòng món #7") && lines[6].includes("tối đa 3 loại topping"));
      assert.ok(lines[7].includes("Dòng món #8") && lines[7].includes("Trùng cấu hình"));
      assert.ok(lines[8].includes("Dòng món #9") && lines[8].includes("bảng giá"));
    });

    it("normalizes error codes (INVALID_COUPON, COUPON_UNAVAILABLE, PENDING_ORDER_EXISTS, INTERNAL_ERROR) via toOrderSubmissionErrorState", () => {
      const couponErr = toOrderSubmissionErrorState({
        statusCode: 400,
        code: "INVALID_COUPON",
        isOutcomeUncertain: false,
      });
      assert.equal(couponErr.isOutcomeUncertain, false);
      assert.equal(
        getFriendlyOrderErrorTitle(couponErr.code, couponErr.isOutcomeUncertain),
        "Mã khuyến mãi không khả dụng"
      );
      assert.ok(couponErr.message.includes("Mã khuyến mãi"));

      const internalErr = toOrderSubmissionErrorState({
        statusCode: 500,
        code: "INTERNAL_ERROR",
      });
      assert.equal(internalErr.isOutcomeUncertain, true);
      assert.equal(
        getFriendlyOrderErrorTitle(
          internalErr.code,
          internalErr.isOutcomeUncertain
        ),
        "Chưa thể xác nhận trạng thái đơn hàng"
      );
    });
  });

  describe("3. Checkout Step Auth Guard & 401 Unauthorized Handling", () => {
    it("blocks unauthenticated guest from entering review step, opens Login modal with resumeCheckout=true, and preserves Cart", () => {
      let authModalOpenedWith: {
        mode?: string;
        resumeCheckout?: boolean;
      } | null = null;
      let currentStep: "cart" | "review" = "cart";

      const proceeded = proceedToCheckoutStep({
        itemsCount: 2,
        isSubmittingOrder: false,
        isAuthenticated: false,
        verifySession: () => false,
        openAuthModal: (mode, options) => {
          authModalOpenedWith = {
            mode,
            resumeCheckout: options?.resumeCheckout,
          };
        },
        setVoucherNoticeVisible: () => {},
        setOrderCallOutcome: () => {},
        setCheckoutStep: (step) => {
          currentStep = step;
        },
      });

      assert.equal(proceeded, false);
      assert.equal(currentStep, "cart");
      assert.deepEqual(authModalOpenedWith, {
        mode: "login",
        resumeCheckout: true,
      });
    });

    it("handles 401 UNAUTHORIZED from POST /orders by clearing session and activeOrder snapshot, preserving Cart, reverting to cart step, and triggering handleUnauthorizedCheckout", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const mockToken = createValidMockJwt(userId);
      setStoredSession(mockToken, {
        id: userId,
        email: "user@brewlite.vn",
        fullName: "Khách Hàng",
      });
      persistActiveOrderForUser(createValidOrderResponse(), userId);
      assert.ok(sessionStorageMock.getItem(ACTIVE_ORDER_STORAGE_KEY));

      localStorageMock.setItem(
        "brewlite_cart_v1",
        JSON.stringify(createSampleCartItems())
      );

      const savedFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            statusCode: 401,
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );

      let stepAfter401: "cart" | "review" = "review";
      let unauthorizedReason: string | undefined;
      let isSubmitting = false;
      let activeOrderAfter401 = createValidOrderResponse() as CreateOrderResponseDto | null;
      const submittingRef = { current: false };
      const cartItems = createSampleCartItems();

      try {
        await executeCheckoutOrderSubmission({
          items: cartItems,
          accessToken: mockToken,
          userId,
          submittingRef,
          isSubmittingOrder: isSubmitting,
          setIsSubmittingOrder: (val) => {
            isSubmitting = val;
          },
          setCheckoutStep: (step) => {
            stepAfter401 = step;
          },
          setOrderCallOutcome: () => {},
          setActiveOrder: (order) => {
            activeOrderAfter401 = order;
          },
          verifySession: () => true,
          handleUnauthorizedCheckout: (reason) => {
            unauthorizedReason = reason;
          },
          mapToCreateOrderPayload: () =>
            buildCreateOrderPayloadFromCart(cartItems),
        });

        assert.equal(stepAfter401, "cart");
        assert.ok(
          unauthorizedReason &&
            unauthorizedReason.includes("giỏ hàng của bạn được giữ nguyên")
        );
        assert.equal(getStoredToken(), null, "Expired token must be cleared");
        assert.equal(
          sessionStorageMock.getItem(ACTIVE_ORDER_STORAGE_KEY),
          null,
          "Active PENDING order snapshot in sessionStorage must be cleared on 401"
        );
        assert.equal(
          activeOrderAfter401,
          null,
          "Active order state must be reset to null on 401"
        );
        assert.equal(cartItems.length, 1, "In-memory cart items must remain intact");
        assert.ok(
          localStorageMock
            .getItem("brewlite_cart_v1")
            ?.includes("550e8400-e29b-41d4-a716-446655440000"),
          "localStorage cart must be preserved on 401"
        );
      } finally {
        globalThis.fetch = savedFetch;
      }
    });
  });

  describe("4. Loading State & Double-Submit Prevention during POST /orders", () => {
    it("sets isSubmittingOrder=true while POST /orders is in-flight, blocks concurrent double-submit, and renders loading UI", async () => {
      const cartItems = createSampleCartItems();
      const mockToken = createValidMockJwt();
      const submittingRef = { current: false };
      const loadingTransitions: boolean[] = [];
      let isSubmitting = false;
      let apiCallCount = 0;

      let resolveOrderPromise!: (value: CreateOrderResponseDto) => void;
      const slowCreateOrderFn = async (
        payload: CreateOrderRequestDto
      ): Promise<CreateOrderResponseDto> => {
        apiCallCount++;
        assert.equal(payload.items.length, 1);
        return new Promise<CreateOrderResponseDto>((resolve) => {
          resolveOrderPromise = resolve;
        });
      };

      // Start first submission (do not await yet)
      const firstCallPromise = executeCheckoutOrderSubmission({
        items: cartItems,
        accessToken: mockToken,
        submittingRef,
        isSubmittingOrder: isSubmitting,
        setIsSubmittingOrder: (val) => {
          isSubmitting = val;
          loadingTransitions.push(val);
        },
        setCheckoutStep: () => {},
        setOrderCallOutcome: () => {},
        verifySession: () => true,
        handleUnauthorizedCheckout: () => {},
        mapToCreateOrderPayload: () =>
          buildCreateOrderPayloadFromCart(cartItems),
        createOrderFn: slowCreateOrderFn,
      });

      // Immediately verify loading state is active
      assert.equal(submittingRef.current, true);
      assert.equal(isSubmitting, true);
      assert.deepEqual(loadingTransitions, [true]);

      // Render CartDrawer in loading state and verify loading UI & disabled button
      const loadingHtml = renderCartDrawerMarkup({
        items: cartItems,
        initialCheckoutStep: "review",
        initialIsSubmittingOrder: true,
      });
      assert.ok(
        loadingHtml.includes('id="checkoutSubmittingBanner"'),
        "Must render #checkoutSubmittingBanner while submitting"
      );
      assert.ok(
        loadingHtml.includes("Đang xử lý đặt hàng..."),
        "Confirm button must show loading text"
      );
      assert.ok(
        loadingHtml.includes('aria-busy="true"'),
        "Confirm button and drawer must indicate aria-busy=true"
      );

      // Attempt a second concurrent submission (double-click) while first is still pending
      const secondCallResult = await executeCheckoutOrderSubmission({
        items: cartItems,
        accessToken: mockToken,
        submittingRef,
        isSubmittingOrder: isSubmitting,
        setIsSubmittingOrder: (val) => {
          isSubmitting = val;
        },
        setCheckoutStep: () => {},
        setOrderCallOutcome: () => {},
        verifySession: () => true,
        handleUnauthorizedCheckout: () => {},
        mapToCreateOrderPayload: () =>
          buildCreateOrderPayloadFromCart(cartItems),
        createOrderFn: slowCreateOrderFn,
      });

      assert.equal(secondCallResult.skipped, true);
      assert.equal(
        apiCallCount,
        1,
        "Double-click must NEVER trigger a second POST /orders call"
      );

      // Resolve first request and verify loading state resets to false
      resolveOrderPromise(createValidOrderResponse());
      const firstCallResult = await firstCallPromise;
      assert.equal(firstCallResult.skipped, false);
      assert.equal(firstCallResult.outcome?.type, "success");
      assert.equal(submittingRef.current, false);
      assert.equal(isSubmitting, false);
      assert.deepEqual(loadingTransitions, [true, false]);
    });
  });

  describe("5. 201 Created (PENDING) Order Success, ERD Invariants & Complete Snapshot Rendering (SCRUM-44)", () => {
    it("accepts HTTP 201 Created with valid PENDING order response, syncs activeOrder to CartContext, preserves Cart, and renders full OrderResponse snapshot", async () => {
      const mockToken = createValidMockJwt();
      const cartItems = createSampleCartItems();
      const validOrder: CreateOrderResponseDto = {
        ...createValidOrderResponse(),
        couponCode: "WELCOME10",
        subtotalVnd: 118000,
        discountVnd: 11800,
        totalVnd: 106200,
      };

      const savedFetch = globalThis.fetch;
      let capturedAuthHeader = "";
      let capturedBody: Record<string, unknown> | null = null;

      globalThis.fetch = async (_input, init) => {
        const headers = init?.headers as Record<string, string>;
        capturedAuthHeader = headers?.Authorization || "";
        capturedBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify(validOrder), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      };

      let capturedOutcome: OrderCallOutcome | null = null;
      let syncedActiveOrder: CreateOrderResponseDto | null = null;
      let clearCartCalled = false;
      localStorageMock.setItem("brewlite_cart_v1", JSON.stringify(cartItems));
      const clearCartSpy = () => {
        clearCartCalled = true;
        cartItems.length = 0;
        localStorageMock.removeItem("brewlite_cart_v1");
      };

      try {
        const res = await executeCheckoutOrderSubmission({
          items: cartItems,
          accessToken: mockToken,
          submittingRef: { current: false },
          isSubmittingOrder: false,
          setIsSubmittingOrder: () => {},
          setCheckoutStep: () => {},
          setOrderCallOutcome: (val) => {
            capturedOutcome = val;
          },
          setActiveOrder: (order) => {
            syncedActiveOrder = order;
          },
          verifySession: () => true,
          handleUnauthorizedCheckout: () => {},
          mapToCreateOrderPayload: () =>
            buildCreateOrderPayloadFromCart(cartItems),
          clearCart: clearCartSpy,
        });

        assert.equal(capturedAuthHeader, `Bearer ${mockToken}`);
        assert.deepEqual(capturedBody, {
          items: [
            {
              productId: "550e8400-e29b-41d4-a716-446655440000",
              size: "M",
              toppingIds: ["7d44a44c-8d1a-4af3-98cb-90e5d4c8a001"],
              quantity: 2,
            },
          ],
        });

        const outcome = res.outcome ?? capturedOutcome;
        assert.ok(outcome && outcome.type === "success");
        assert.equal(outcome.order.id, validOrder.id);
        assert.equal(outcome.order.status, "PENDING");
        assert.deepEqual(syncedActiveOrder, validOrder);

        const successHtml = renderCartDrawerMarkup({
          items: cartItems,
          initialCheckoutStep: "review",
          initialOrderOutcome: outcome,
          activeOrder: syncedActiveOrder,
          onClearCart: clearCartSpy,
        });

        assert.equal(
          clearCartCalled,
          false,
          "Cart must NOT be cleared while order is PENDING"
        );
        assert.equal(
          cartItems.length,
          1,
          "Cart items in memory must remain intact after 201 PENDING order creation"
        );
        assert.ok(
          localStorageMock
            .getItem("brewlite_cart_v1")
            ?.includes("550e8400-e29b-41d4-a716-446655440000"),
          "Cart items in localStorage must remain intact after 201 PENDING order creation"
        );
        assert.ok(successHtml.includes('id="orderSuccessNoticeModal"'));
        assert.ok(successHtml.includes('id="activePendingOrderBanner"'));
        assert.ok(successHtml.includes(validOrder.id));
        assert.ok(successHtml.includes("PENDING"));
        assert.ok(successHtml.includes("WELCOME10"));
        assert.ok(successHtml.includes("120%"));
        assert.ok(successHtml.includes("45.000"));
        assert.ok(successHtml.includes("59.000"));
        assert.ok(successHtml.includes("118.000"));
        assert.ok(successHtml.includes("11.800"));
        assert.ok(successHtml.includes("106.200"));
        assert.ok(
          successHtml.includes('id="serverPriceReconciliationNote"'),
          "Must display server-vs-client reconciliation note when totalVnd differs from client subtotal"
        );
      } finally {
        globalThis.fetch = savedFetch;
      }
    });

    it("scopes PENDING order snapshot to the authenticated ownerUserId, restores only for the same user, and purges snapshot on logout or when User B logs in on the same tab", () => {
      const userAId = "550e8400-e29b-41d4-a716-446655440000";
      const userBId = "660e8400-e29b-41d4-a716-446655440099";
      const userAToken = createValidMockJwt(userAId);
      const userBToken = createValidMockJwt(userBId);

      const userAOrder: CreateOrderResponseDto = {
        ...createValidOrderResponse(),
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        subtotalVnd: 118000,
        discountVnd: 18000,
        totalVnd: 100000,
      };

      setStoredSession(userAToken, {
        id: userAId,
        email: "usera@brewlite.vn",
        fullName: "User A",
      });
      localStorageMock.setItem(
        "brewlite_cart_v1",
        JSON.stringify(createSampleCartItems())
      );

      // 1. Persist snapshot for User A -> restores when currentUserId === userAId
      persistActiveOrderForUser(userAOrder, userAId);
      const restoredForUserA = restoreActiveOrderForUser(userAId);
      assert.ok(restoredForUserA);
      assert.equal(restoredForUserA.id, userAOrder.id);

      const userAHtml = renderCartDrawerMarkup({
        isAuthenticated: true,
        userId: userAId,
        initialCheckoutStep: "cart",
        activeOrder: restoredForUserA,
      });
      assert.ok(userAHtml.includes('id="activePendingOrderBanner"'));
      assert.ok(userAHtml.includes(userAOrder.id));

      // 2. If User B logs in on the same tab while User A's snapshot is still in sessionStorage:
      // CartDrawer & restoreActiveOrderForUser(userBId) & setStoredSession must purge User A's snapshot
      // and NEVER leak User A's order ID or totalVnd (100.000) to User B!
      const userBHtmlWhileSessionHasUserA = renderCartDrawerMarkup({
        isAuthenticated: true,
        userId: userBId,
        initialCheckoutStep: "cart",
        activeOrder: userAOrder, // Even if stale activeOrder was passed, cross-check against sessionStorage ownerUserId blocks it
      });
      assert.equal(
        userBHtmlWhileSessionHasUserA.includes('id="activePendingOrderBanner"'),
        false,
        "User B must NEVER see User A's activePendingOrderBanner"
      );
      assert.equal(
        userBHtmlWhileSessionHasUserA.includes(userAOrder.id),
        false,
        "User B must NEVER see User A's order ID"
      );
      assert.equal(
        sessionStorageMock.getItem(ACTIVE_ORDER_STORAGE_KEY),
        null,
        "Mismatched user snapshot must be immediately purged from sessionStorage"
      );

      // 3. Re-seed User A snapshot, then call setStoredSession for User B -> purges User A snapshot immediately
      persistActiveOrderForUser(userAOrder, userAId);
      assert.ok(sessionStorageMock.getItem(ACTIVE_ORDER_STORAGE_KEY));
      setStoredSession(userBToken, {
        id: userBId,
        email: "userb@brewlite.vn",
        fullName: "User B",
      });
      assert.equal(
        sessionStorageMock.getItem(ACTIVE_ORDER_STORAGE_KEY),
        null,
        "setStoredSession for User B must purge User A's active order snapshot"
      );
      assert.equal(restoreActiveOrderForUser(userBId), null);

      // 4. Re-seed User A snapshot, then User A logs out (clearStoredSession) -> purges active order snapshot while preserving Cart
      persistActiveOrderForUser(userAOrder, userAId);
      assert.ok(sessionStorageMock.getItem(ACTIVE_ORDER_STORAGE_KEY));
      clearStoredSession();
      assert.equal(
        sessionStorageMock.getItem(ACTIVE_ORDER_STORAGE_KEY),
        null,
        "Logout (clearStoredSession) must remove active order snapshot from sessionStorage"
      );
      assert.ok(
        localStorageMock
          .getItem("brewlite_cart_v1")
          ?.includes("550e8400-e29b-41d4-a716-446655440000"),
        "Logout must preserve Cart in localStorage"
      );

      const guestHtmlAfterLogout = renderCartDrawerMarkup({
        isAuthenticated: false,
        initialCheckoutStep: "cart",
        activeOrder: userAOrder,
      });
      assert.equal(
        guestHtmlAfterLogout.includes('id="activePendingOrderBanner"'),
        false,
        "Logged-out guest must NEVER see activePendingOrderBanner"
      );
      assert.equal(
        guestHtmlAfterLogout.includes(userAOrder.id),
        false,
        "Logged-out guest must NEVER see previous user's order ID"
      );
    });

    it("rejects HTTP 200 OK (requires 201 Created) and rejects missing required fields or ERD arithmetic invariant violations in Order Response with isOutcomeUncertain=true", async () => {
      const mockToken = createValidMockJwt();
      const orderDto: CreateOrderRequestDto = {
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440000",
            size: "M",
            toppingIds: [],
            quantity: 1,
          },
        ],
      };

      const savedFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () =>
          new Response(JSON.stringify(createValidOrderResponse()), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        await assert.rejects(
          async () => {
            await createOrderApi(orderDto, mockToken);
          },
          (err: OrderServiceError) => {
            assert.equal(err.statusCode, 500);
            assert.equal(err.code, "SERVER_ERROR");
            assert.equal(err.isOutcomeUncertain, true);
            return true;
          }
        );

        // Missing item.id in validateOrderResponseData must throw with isOutcomeUncertain = true
        const brokenOrder = createValidOrderResponse();
        brokenOrder.items[0].id = "";
        assert.throws(
          () => {
            validateOrderResponseData(brokenOrder);
          },
          (err: OrderServiceError) => {
            assert.equal(err.isOutcomeUncertain, true);
            return true;
          }
        );

        // ERD pricing invariant violation: totalVnd !== subtotalVnd - discountVnd
        const invalidTotalOrder = createValidOrderResponse();
        invalidTotalOrder.discountVnd = 10000;
        invalidTotalOrder.totalVnd = 118000; // should be 108000
        assert.throws(
          () => {
            validateOrderResponseData(invalidTotalOrder);
          },
          (err: OrderServiceError) => {
            assert.equal(err.isOutcomeUncertain, true);
            assert.ok(err.message.includes("totalVnd = subtotalVnd - discountVnd"));
            return true;
          }
        );

        // ERD line total invariant violation: lineTotalVnd !== unitPriceVnd * quantity
        const invalidLineOrder = createValidOrderResponse();
        invalidLineOrder.items[0].lineTotalVnd = 99000;
        invalidLineOrder.subtotalVnd = 99000;
        invalidLineOrder.totalVnd = 99000;
        assert.throws(
          () => {
            validateOrderResponseData(invalidLineOrder);
          },
          (err: OrderServiceError) => {
            assert.equal(err.isOutcomeUncertain, true);
            assert.ok(err.message.includes("lineTotalVnd = unitPriceVnd * quantity"));
            return true;
          }
        );
      } finally {
        globalThis.fetch = savedFetch;
      }
    });
  });

  describe("6. Network Error (No Retry) & Uncertain Order State vs Deterministic 400/409 Errors", () => {
    it("does NOT retry POST /orders on network failure, sets isOutcomeUncertain=true, and renders uncertain order state modal", async () => {
      const mockToken = createValidMockJwt();
      const cartItems = createSampleCartItems();
      const savedFetch = globalThis.fetch;
      let fetchAttempts = 0;

      globalThis.fetch = async () => {
        fetchAttempts++;
        throw new TypeError("Failed to fetch");
      };

      let capturedOutcome = null as OrderCallOutcome | null;
      let syncedOrderError = null as OrderSubmissionErrorState | null;

      try {
        const res = await executeCheckoutOrderSubmission({
          items: cartItems,
          accessToken: mockToken,
          submittingRef: { current: false },
          isSubmittingOrder: false,
          setIsSubmittingOrder: () => {},
          setCheckoutStep: () => {},
          setOrderCallOutcome: (val) => {
            capturedOutcome = val;
          },
          setOrderError: (err) => {
            syncedOrderError = err;
          },
          verifySession: () => true,
          handleUnauthorizedCheckout: () => {},
          mapToCreateOrderPayload: () =>
            buildCreateOrderPayloadFromCart(cartItems),
        });

        assert.equal(
          fetchAttempts,
          1,
          "POST /orders must NEVER retry on network error"
        );
        const outcome = res.outcome ?? capturedOutcome;
        assert.ok(outcome && outcome.type === "error");
        assert.equal(outcome.code, "NETWORK_ERROR");
        assert.equal(outcome.statusCode, 503);
        assert.equal(outcome.isOutcomeUncertain, true);
        assert.ok(syncedOrderError && syncedOrderError.isOutcomeUncertain);

        const uncertainErrorHtml = renderCartDrawerMarkup({
          items: cartItems,
          initialCheckoutStep: "review",
          initialOrderOutcome: outcome,
        });
        assert.ok(
          uncertainErrorHtml.includes("Chưa thể xác nhận trạng thái đơn hàng"),
          "Must display uncertain order status title"
        );
        assert.ok(
          uncertainErrorHtml.includes('id="uncertainOrderWarningBox"'),
          "Must display anti-duplicate warning box"
        );
        assert.equal(
          uncertainErrorHtml.includes("Đơn hàng chưa được tạo"),
          false,
          "Must NEVER falsely claim the order was not created when network fails after send"
        );
      } finally {
        globalThis.fetch = savedFetch;
      }
    });

    it("renders deterministic 409 INSUFFICIENT_STOCK error with isOutcomeUncertain=false and mapped requestedQuantity/availableQuantity details", async () => {
      const mockToken = createValidMockJwt();
      const cartItems = createSampleCartItems();
      const savedFetch = globalThis.fetch;

      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            statusCode: 409,
            message: "Insufficient product stock",
            error: "Conflict",
            code: "INSUFFICIENT_STOCK",
            details: [
              {
                productId: "550e8400-e29b-41d4-a716-446655440000",
                requestedQuantity: 6,
                availableQuantity: 5,
              },
            ],
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );

      let capturedOutcome: OrderCallOutcome | null = null;

      try {
        const res = await executeCheckoutOrderSubmission({
          items: cartItems,
          accessToken: mockToken,
          submittingRef: { current: false },
          isSubmittingOrder: false,
          setIsSubmittingOrder: () => {},
          setCheckoutStep: () => {},
          setOrderCallOutcome: (val) => {
            capturedOutcome = val;
          },
          verifySession: () => true,
          handleUnauthorizedCheckout: () => {},
          mapToCreateOrderPayload: () =>
            buildCreateOrderPayloadFromCart(cartItems),
        });

        const outcome = res.outcome ?? capturedOutcome;
        assert.ok(outcome && outcome.type === "error");
        assert.equal(outcome.statusCode, 409);
        assert.equal(outcome.code, "INSUFFICIENT_STOCK");
        assert.equal(outcome.isOutcomeUncertain, false);
        assert.equal(outcome.detailLines.length, 1);
        assert.ok(
          outcome.detailLines[0].includes("Cà Phê Sữa Đá Sài Gòn") &&
            outcome.detailLines[0].includes("yêu cầu: 6, khả dụng: 5")
        );

        const stockErrorHtml = renderCartDrawerMarkup({
          items: cartItems,
          initialCheckoutStep: "review",
          initialOrderOutcome: outcome,
        });
        assert.ok(stockErrorHtml.includes("Không thể tạo đơn hàng"));
        assert.ok(stockErrorHtml.includes('id="orderErrorDetailList"'));
        assert.ok(stockErrorHtml.includes("yêu cầu: 6, khả dụng: 5"));
      } finally {
        globalThis.fetch = savedFetch;
      }
    });
  });
});
