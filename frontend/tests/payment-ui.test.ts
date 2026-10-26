import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";
import PaymentPageView from "@/components/PaymentPageView";
import { AuthContext, type AuthContextType } from "@/context/AuthContext";
import { CartContext, type CartContextValue } from "@/context/CartContext";
import type { CreateOrderResponseDto, MyOrderDto } from "@/mock-data";
import {
  buildCreatePaymentPayload,
  fetchMyOrdersApi,
  generateIdempotencyKey,
  selectTargetOrderFromMyOrders,
  submitPaymentApi,
  toPaymentSubmissionErrorState,
  validateCreatePaymentPayload,
  validateIdempotencyKey,
} from "@/services/payment.service";

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

function createSampleOrderSnapshot(): CreateOrderResponseDto {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    status: "PENDING",
    createdAt: "2026-10-27T02:00:00.000Z",
    subtotalVnd: 118000,
    discountVnd: 20000,
    totalVnd: 98000,
    couponCode: "WELCOME20",
    items: [
      {
        id: "550e8400-e29b-41d4-a716-446655440011",
        productId: "a1000000-0000-4000-8000-000000000001",
        productName: "Cà phê Sữa Đá",
        size: "M",
        sizeMultiplierPercent: 120,
        basePriceVnd: 30000,
        quantity: 1,
        unitPriceVnd: 46000,
        lineTotalVnd: 46000,
        toppings: [
          {
            id: "7d44a44c-8d1a-4af3-98cb-90e5d4c8a001",
            name: "Thạch Cà Phê",
            priceVnd: 10000,
          },
        ],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440012",
        productId: "a2000000-0000-4000-8000-000000000002",
        productName: "Cold Brew Cam Sả",
        size: "L",
        sizeMultiplierPercent: 140,
        basePriceVnd: 43000,
        quantity: 1,
        unitPriceVnd: 72000,
        lineTotalVnd: 72000,
        toppings: [
          {
            id: "7d44a44c-8d1a-4af3-98cb-90e5d4c8a002",
            name: "Kem Cheese",
            priceVnd: 12000,
          },
        ],
      },
    ],
  };
}

function renderPaymentMarkup(
  props: React.ComponentProps<typeof PaymentPageView> = {}
): string {
  const order =
    props.initialOrder === undefined
      ? createSampleOrderSnapshot()
      : props.initialOrder;

  const cartValue: CartContextValue = {
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
    activeOrder: order,
  };

  const authValue: AuthContextType = {
    user: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "haidang@brewlite.vn",
      fullName: "Nguyễn Hải Đăng",
    },
    accessToken: createValidMockJwt(),
    isAuthenticated: true,
    isLoading: false,
    login: async () => {},
    register: async () => ({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "haidang@brewlite.vn",
      fullName: "Nguyễn Hải Đăng",
    }),
    logout: () => {},
    verifySession: () => true,
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
        React.createElement(PaymentPageView, {
          ...props,
          initialOrder: order,
        })
      )
    )
  );
}

describe("SCRUM-67 Payment UI & Real API Integration (POST /payments & GET /orders/me — Contract v3.0)", () => {
  it("1. builds and validates strict CARD and WALLET payloads per API Contract v3.0 §3.1", () => {
    const cardPayload = buildCreatePaymentPayload({
      orderId: "  550E8400-E29B-41D4-A716-446655440010 ",
      method: "CARD",
      cardNumber: "1234567890121234",
      phoneNumber: "0912345678",
    });

    assert.deepEqual(cardPayload, {
      orderId: "550e8400-e29b-41d4-a716-446655440010",
      method: "CARD",
      paymentDetails: { cardNumber: "1234567890121234" },
    });
    assert.equal("phoneNumber" in cardPayload.paymentDetails, false);
    assert.equal(
      "userId" in (cardPayload as unknown as Record<string, unknown>),
      false
    );
    assert.equal(
      "amountVnd" in (cardPayload as unknown as Record<string, unknown>),
      false
    );

    const walletPayload = buildCreatePaymentPayload({
      orderId: "550e8400-e29b-41d4-a716-446655440010",
      method: "WALLET",
      cardNumber: "1234567890121234",
      phoneNumber: "0912345678",
    });

    assert.deepEqual(walletPayload, {
      orderId: "550e8400-e29b-41d4-a716-446655440010",
      method: "WALLET",
      paymentDetails: { phoneNumber: "0912345678" },
    });
    assert.equal("cardNumber" in walletPayload.paymentDetails, false);

    // Reject invalid lengths or mismatched paymentDetails
    assert.equal(
      validateCreatePaymentPayload({
        orderId: "550e8400-e29b-41d4-a716-446655440010",
        method: "CARD",
        paymentDetails: { cardNumber: "12345" },
      }).isValid,
      false
    );
    assert.equal(
      validateCreatePaymentPayload({
        orderId: "550e8400-e29b-41d4-a716-446655440010",
        method: "WALLET",
        paymentDetails: { phoneNumber: "09123" },
      }).isValid,
      false
    );
  });

  it("2. calls real POST /payments and GET /orders/me APIs with Bearer JWT and Idempotency-Key", async () => {
    const token = createValidMockJwt();
    const idemKey = generateIdempotencyKey("idem");
    assert.equal(validateIdempotencyKey(idemKey).isValid, true);

    const savedFetch = globalThis.fetch;
    try {
      let capturedUrl = "";
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: unknown = null;

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedHeaders = (init?.headers || {}) as Record<string, string>;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : null;

        if (capturedUrl.endsWith("/payments")) {
          return new Response(
            JSON.stringify({
              paymentId: "550e8400-e29b-41d4-a716-446655440020",
              orderId: "550e8400-e29b-41d4-a716-446655440010",
              paymentStatus: "SUCCESS",
              orderStatus: "PAID",
              amountVnd: 98000,
              method: "CARD",
              methodLast4: "1234",
              mockReference: "MOCK-0003",
              pointsEarned: 9,
              failureReason: null,
              createdAt: "2026-10-27T02:00:00.000Z",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Idempotency-Replayed": "false",
              },
            }
          );
        }

        const myOrder: MyOrderDto = {
          ...createSampleOrderSnapshot(),
          expiresAt: "2026-10-27T02:15:00.000Z",
          pointsEarned: 0,
          payment: null,
        };
        return new Response(
          JSON.stringify({
            items: [myOrder],
            meta: { page: null, limit: null, total: 1, totalPages: null },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      // Test GET /orders/me
      const myOrders = await fetchMyOrdersApi(token);
      assert.equal(myOrders.items.length, 1);
      const selected = selectTargetOrderFromMyOrders(myOrders.items, null);
      assert.ok(selected);
      assert.equal(selected.id, "550e8400-e29b-41d4-a716-446655440010");

      // Test POST /payments
      const payRes = await submitPaymentApi(
        {
          orderId: "550e8400-e29b-41d4-a716-446655440010",
          method: "CARD",
          paymentDetails: { cardNumber: "1234567890121234" },
        },
        idemKey,
        { accessToken: token }
      );

      assert.equal(capturedHeaders["Authorization"], `Bearer ${token}`);
      assert.equal(capturedHeaders["Idempotency-Key"], idemKey);
      assert.deepEqual(capturedBody, {
        orderId: "550e8400-e29b-41d4-a716-446655440010",
        method: "CARD",
        paymentDetails: { cardNumber: "1234567890121234" },
      });
      assert.equal(payRes.replayed, false);
      assert.equal(payRes.response.paymentStatus, "SUCCESS");
      assert.equal(payRes.response.orderStatus, "PAID");
      assert.equal(payRes.response.pointsEarned, 9);
    } finally {
      globalThis.fetch = savedFetch;
    }
  });

  it("3. renders Stitch Payment UI with real order snapshot, CARD/WALLET selectors, loading state, and error state", () => {
    const defaultHtml = renderPaymentMarkup();
    assert.ok(defaultHtml.includes('id="radioCard"'));
    assert.ok(defaultHtml.includes('id="radioWallet"'));
    assert.ok(defaultHtml.includes('id="cardInputNumber"'));
    assert.ok(defaultHtml.includes('id="walletInputPhone"'));
    assert.ok(defaultHtml.includes('id="btnSubmitPayment"'));
    assert.ok(defaultHtml.includes("550e8400-e29b-41d4-a716-446655440010"));
    assert.ok(defaultHtml.includes("WELCOME20"));
    assert.ok(defaultHtml.includes("98.000"));

    // Loading state
    const loadingHtml = renderPaymentMarkup({ initialIsSubmitting: true });
    assert.ok(loadingHtml.includes("Đang xử lý POST /payments..."));

    // Error state with retry same key (409 PAYMENT_IN_PROGRESS)
    const errorHtml = renderPaymentMarkup({
      initialPaymentError: {
        statusCode: 409,
        code: "PAYMENT_IN_PROGRESS",
        message: "Giao dịch đang xử lý.",
        canRetrySameKey: true,
        shouldGenerateNewKey: false,
        idempotencyKey: "idem-test-12345678",
      },
    });
    assert.ok(errorHtml.includes('id="paymentErrorBanner"'));
    assert.ok(errorHtml.includes('id="btnRetrySameIdempotencyKey"'));
    assert.ok(errorHtml.includes("idem-test-12345678"));
  });
});
