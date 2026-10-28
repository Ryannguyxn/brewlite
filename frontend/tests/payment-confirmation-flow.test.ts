import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { PaymentFailedRetryView } from "../components/PaymentFailedRetryView";
import { CartProvider, useCart, clearStoredActiveOrder } from "../context/CartContext";
import {
  type OrderConfirmationData,
  findOrderForConfirmation,
  fetchMyOrdersApi,
  submitRetryPaymentApi,
  generateIdempotencyKey,
  fetchAuthMeProfile,
} from "../services/order-confirmation.service";
import { createOrderApi } from "../services/order.service";
import type {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
} from "../mock-data";
import {
  executePaymentSubmission,
  type ExecutePaymentSubmissionDeps,
} from "../components/PaymentPageView";
import type { OrderStatus, PaymentResponseDto } from "../mock-data";

function createValidMockJwt(
  sub = "550e8400-e29b-41d4-a716-446655440001",
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
  return `${header}.${payload}.mockSignature123`;
}

describe("SCRUM-69: End-to-End Payment & Confirmation Flow Integration Tests", () => {
  let dom: JSDOM;
  let originalWindow: unknown;
  let originalDocument: unknown;
  let originalSelf: unknown;
  let originalLocalStorage: unknown;
  let originalSessionStorage: unknown;
  let globalTarget: {
    window: unknown;
    document: unknown;
    self: unknown;
    localStorage: unknown;
    sessionStorage: unknown;
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  let originalActEnv: boolean | undefined;

  const CART_KEY = "brewlite_cart_v1";

  const setupDom = () => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
      url: "http://localhost/order-confirmation?orderId=550e8400-e29b-41d4-a716-446655440010",
    });
    globalTarget = globalThis as unknown as typeof globalTarget;
    originalWindow = globalTarget.window;
    originalDocument = globalTarget.document;
    originalSelf = globalTarget.self;
    originalLocalStorage = globalTarget.localStorage;
    originalSessionStorage = globalTarget.sessionStorage;
    originalActEnv = globalTarget.IS_REACT_ACT_ENVIRONMENT;

    globalTarget.window = dom.window;
    globalTarget.document = dom.window.document;
    globalTarget.self = dom.window;
    globalTarget.localStorage = dom.window.localStorage;
    globalTarget.sessionStorage = dom.window.sessionStorage;
    globalTarget.IS_REACT_ACT_ENVIRONMENT = true;
  };

  const cleanupDom = () => {
    globalTarget.window = originalWindow;
    globalTarget.document = originalDocument;
    globalTarget.self = originalSelf;
    globalTarget.localStorage = originalLocalStorage;
    globalTarget.sessionStorage = originalSessionStorage;
    globalTarget.IS_REACT_ACT_ENVIRONMENT = originalActEnv;
    dom.window.close();
  };

  const createSampleCartItem = () => ({
    id: "cart-item-e2e-1",
    productId: "550e8400-e29b-41d4-a716-446655440001",
    productName: "Cà phê Sữa Đá",
    size: "M",
    sizeMultiplierPercent: 100,
    basePriceVnd: 35000,
    quantity: 2,
    unitPriceVnd: 35000,
    lineTotalVnd: 70000,
    toppings: [],
  });

  const createSampleOrder = (
    status: OrderStatus = "PENDING",
    overrides: Partial<OrderConfirmationData> = {}
  ): OrderConfirmationData => ({
    id: "550e8400-e29b-41d4-a716-446655440010",
    status,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    expiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
    subtotalVnd: 70000,
    discountVnd: 0,
    totalVnd: 70000,
    couponCode: null,
    pointsEarned: status === "PAID" ? 7 : 0,
    payment:
      status === "PAID"
        ? {
            id: "550e8400-e29b-41d4-a716-446655440077",
            method: "CARD",
            methodLast4: "1234",
            mockReference: "MOCK-REF-1234",
            amountVnd: 70000,
            status: "SUCCESS",
            failureReason: null,
            createdAt: new Date().toISOString(),
          }
        : null,
    items: [
      {
        id: "550e8400-e29b-41d4-a716-446655440011",
        productId: "550e8400-e29b-41d4-a716-446655440001",
        productName: "Cà phê Sữa Đá",
        size: "M",
        sizeMultiplierPercent: 100,
        basePriceVnd: 35000,
        quantity: 2,
        unitPriceVnd: 35000,
        lineTotalVnd: 70000,
        toppings: [],
      },
    ],
    ...overrides,
  });

  describe("1. Complete Happy Path E2E Flow: Checkout -> Payment -> Confirmation", () => {
    it("should seamlessly transition from Checkout (201 PENDING) to Payment (200 SUCCESS), clear Cart, and load Confirmation with Server Truth", async () => {
      setupDom();
      const mockToken = createValidMockJwt();
      let cartState = [createSampleCartItem()];
      dom.window.localStorage.setItem(CART_KEY, JSON.stringify(cartState));

      const pendingOrder: CreateOrderResponseDto = {
        id: "550e8400-e29b-41d4-a716-446655440010",
        status: "PENDING",
        createdAt: new Date().toISOString(),
        subtotalVnd: 70000,
        discountVnd: 0,
        totalVnd: 70000,
        couponCode: null,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            productName: "Cà phê Sữa Đá",
            size: "M",
            sizeMultiplierPercent: 100,
            basePriceVnd: 35000,
            quantity: 2,
            unitPriceVnd: 35000,
            lineTotalVnd: 70000,
            toppings: [],
          },
        ],
      };

      const paidOrderConfirmation = createSampleOrder("PAID");

      // Mock full backend API sequence
      global.fetch = async (url, init) => {
        const u = String(url);
        // 1. POST /orders (Checkout)
        if (u.includes("/orders") && init?.method === "POST") {
          return new Response(JSON.stringify(pendingOrder), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }
        // 2. POST /payments (Payment)
        if (u.includes("/payments") && init?.method === "POST") {
          return new Response(
            JSON.stringify({
              paymentId: "550e8400-e29b-41d4-a716-446655440020",
              orderId: pendingOrder.id,
              paymentStatus: "SUCCESS",
              orderStatus: "PAID",
              method: "CARD",
              methodLast4: "1234",
              mockReference: "MOCK-REF-HAPPY-PATH",
              amountVnd: 70000,
              pointsEarned: 7,
              failureReason: null,
              createdAt: new Date().toISOString(),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // 3. GET /orders/me (Confirmation)
        if (u.includes("/orders/me")) {
          return new Response(
            JSON.stringify({
              items: [paidOrderConfirmation],
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // 4. GET /auth/me (Confirmation)
        if (u.includes("/auth/me")) {
          return new Response(
            JSON.stringify({
              id: "550e8400-e29b-41d4-a716-446655440001",
              email: "customer@brewlite.vn",
              fullName: "Nguyễn Văn A",
              loyaltyPoints: 7,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      };

      try {
        // --- STEP 1: CHECKOUT ---
        const checkoutPayload: CreateOrderRequestDto = {
          items: [
            {
              productId: "550e8400-e29b-41d4-a716-446655440001",
              size: "M",
              quantity: 2,
              toppingIds: [],
            },
          ],
        };

        const createdOrder = await createOrderApi(checkoutPayload, mockToken);
        assert.equal(createdOrder.status, "PENDING");
        assert.equal(createdOrder.id, pendingOrder.id);
        // Cart must be preserved during PENDING checkout
        assert.equal(cartState.length, 1);

        // --- STEP 2: PAYMENT SUBMISSION ---
        let paymentOutcome: PaymentResponseDto | null = null;
        let cartCleared = false;
        let pointsAccrued = 0;

        const paymentDeps: ExecutePaymentSubmissionDeps = {
          activeOrder: createdOrder,
          orderStatus: "PENDING",
          payload: {
            orderId: createdOrder.id,
            method: "CARD",
            paymentDetails: { cardNumber: "1234567890121234" },
          },
          idempotencyKey: generateIdempotencyKey(),
          accessToken: mockToken,
          isAuthenticated: true,
          verifySession: () => true,
          openAuthModal: () => {},
          submittingRef: { current: false },
          isSubmitting: false,
          setIsSubmitting: () => {},
          setIdempotencyKey: () => {},
          setPaymentResult: (res) => {
            paymentOutcome = res;
          },
          setOrderStatus: () => {},
          setPaymentError: () => {},
          clearCart: () => {
            cartCleared = true;
            cartState = [];
            dom.window.localStorage.removeItem(CART_KEY);
          },
          onPointsEarned: (pts) => {
            pointsAccrued += pts;
          },
        };

        await executePaymentSubmission(paymentDeps);

        // Verification after payment
        assert.ok(paymentOutcome !== null);
        const settledOutcome = paymentOutcome as unknown as PaymentResponseDto;
        assert.equal(settledOutcome.paymentStatus, "SUCCESS");
        assert.equal(settledOutcome.orderStatus, "PAID");
        assert.equal(cartCleared, true, "Cart must be cleared on confirmed payment SUCCESS");
        assert.equal(pointsAccrued, 7);

        // --- STEP 3: CONFIRMATION VIA SERVER TRUTH ---
        const myOrders = await fetchMyOrdersApi(mockToken);
        const confirmationOrder = findOrderForConfirmation(myOrders, createdOrder.id);
        assert.ok(confirmationOrder !== null);
        assert.equal(confirmationOrder.status, "PAID");
        assert.equal(confirmationOrder.totalVnd, 70000);

        const profile = await fetchAuthMeProfile(mockToken);
        assert.ok(profile);
        assert.equal(profile.loyaltyPoints, 7);
      } finally {
        cleanupDom();
      }
    });
  });

  describe("2. FAILED Payment -> Confirmation Retry SUCCESS Flow", () => {
    it("should preserve Cart on FAILED payment, allow retry from Confirmation, rotate key, and clear Cart only once after SUCCESS", async () => {
      setupDom();
      const mockToken = createValidMockJwt();
      let cartItems = [createSampleCartItem()];
      dom.window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));

      const testOrder = createSampleOrder("PAYMENT_FAILED");
      const capturedKeys: string[] = [];

      global.fetch = async (url, init) => {
        const u = String(url);
        if (u.includes("/payments")) {
          const headers = (init?.headers || {}) as Record<string, string>;
          capturedKeys.push(headers["Idempotency-Key"] || headers["idempotency-key"]);

          if (capturedKeys.length === 1) {
            // First payment: Declined
            return new Response(
              JSON.stringify({
                paymentId: "550e8400-e29b-41d4-a716-446655440051",
                orderId: testOrder.id,
                paymentStatus: "FAILED",
                orderStatus: "PAYMENT_FAILED",
                method: "CARD",
                methodLast4: "0002",
                mockReference: "MOCK-DECLINED-0002",
                amountVnd: testOrder.totalVnd,
                pointsEarned: 0,
                failureReason: "PAYMENT_DECLINED",
                createdAt: new Date().toISOString(),
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          } else {
            // Second payment (Retry): Success
            return new Response(
              JSON.stringify({
                paymentId: "550e8400-e29b-41d4-a716-446655440052",
                orderId: testOrder.id,
                paymentStatus: "SUCCESS",
                orderStatus: "PAID",
                method: "CARD",
                methodLast4: "1234",
                mockReference: "MOCK-RETRY-SUCCESS",
                amountVnd: testOrder.totalVnd,
                pointsEarned: 7,
                failureReason: null,
                createdAt: new Date().toISOString(),
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
        }
        return new Response("Not found", { status: 404 });
      };

      try {
        // --- STEP 1: First payment fails ---
        let firstSubmitCartCleared = false;
        const firstDeps: ExecutePaymentSubmissionDeps = {
          activeOrder: testOrder as unknown as CreateOrderResponseDto,
          orderStatus: "PENDING",
          payload: {
            orderId: testOrder.id,
            method: "CARD",
            paymentDetails: { cardNumber: "1234567890120002" },
          },
          idempotencyKey: generateIdempotencyKey(),
          accessToken: mockToken,
          isAuthenticated: true,
          verifySession: () => true,
          openAuthModal: () => {},
          submittingRef: { current: false },
          isSubmitting: false,
          setIsSubmitting: () => {},
          setIdempotencyKey: () => {},
          setPaymentResult: () => {},
          setOrderStatus: () => {},
          setPaymentError: () => {},
          clearCart: () => {
            firstSubmitCartCleared = true;
          },
        };

        const firstResult = await executePaymentSubmission(firstDeps);
        assert.ok(firstResult.outcome);
        assert.equal(firstResult.outcome.type, "failed");
        assert.equal(firstSubmitCartCleared, false, "Cart MUST NOT be cleared when payment FAILED");
        assert.equal(cartItems.length, 1, "Cart items must be preserved");

        // --- STEP 2: Mount Confirmation Retry View with CartProvider ---
        const container = dom.window.document.getElementById("root")!;
        const root = createRoot(container);

        function MountedConfirmationFlowHarness({ order }: { order: OrderConfirmationData }) {
          const { items, clearCart } = useCart();
          const handleRetrySuccess = async () => {
            clearCart();
            clearStoredActiveOrder();
            cartItems = [];
          };

          return React.createElement(
            "div",
            null,
            React.createElement("span", { id: "flowCartCount" }, String(items.length)),
            React.createElement(PaymentFailedRetryView, {
              order,
              token: mockToken,
              onRetrySuccess: handleRetrySuccess,
              onRetryFailure: async () => null,
            })
          );
        }

        await act(async () => {
          root.render(
            React.createElement(
              CartProvider as React.ComponentType<{ key?: string }>,
              { key: "flow-retry" },
              React.createElement(MountedConfirmationFlowHarness, { order: testOrder })
            )
          );
        });

        assert.equal(container.querySelector("#flowCartCount")?.textContent, "1");

        // User submits retry payment with valid card
        await act(async () => {
          const form = container.querySelector("form") as HTMLFormElement;
          form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        });

        assert.equal(capturedKeys.length, 2);
        assert.notEqual(capturedKeys[0], capturedKeys[1], "Key must be rotated on retry");
        // Verify cart is cleared exactly once after retry SUCCESS
        assert.equal(container.querySelector("#flowCartCount")?.textContent, "0");
        assert.equal(cartItems.length, 0);

        await act(async () => {
          root.unmount();
        });
      } finally {
        cleanupDom();
      }
    });
  });

  describe("3. Network Error & Idempotency Key Preservation Integration", () => {
    it("should preserve the EXACT same Idempotency-Key on network timeout and succeed on second attempt without duplicate effects", async () => {
      setupDom();
      const mockToken = createValidMockJwt();
      const testOrder = createSampleOrder("PAYMENT_FAILED");

      const capturedKeys: string[] = [];
      let fetchAttempts = 0;

      global.fetch = async (url, init) => {
        const u = String(url);
        if (u.includes("/payments")) {
          fetchAttempts += 1;
          const headers = (init?.headers || {}) as Record<string, string>;
          capturedKeys.push(headers["Idempotency-Key"] || headers["idempotency-key"]);

          if (fetchAttempts === 1) {
            throw new TypeError("Failed to fetch (DNS timeout)");
          } else {
            return new Response(
              JSON.stringify({
                paymentId: "550e8400-e29b-41d4-a716-446655440088",
                orderId: testOrder.id,
                paymentStatus: "SUCCESS",
                orderStatus: "PAID",
                method: "CARD",
                methodLast4: "1234",
                mockReference: "MOCK-REPLAYED-SAME-KEY",
                amountVnd: testOrder.totalVnd,
                pointsEarned: 7,
                failureReason: null,
                createdAt: new Date().toISOString(),
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
        }
        return new Response("Not found", { status: 404 });
      };

      try {
        const container = dom.window.document.getElementById("root")!;
        const root = createRoot(container);
        let retrySuccessCalled = false;

        await act(async () => {
          root.render(
            React.createElement(PaymentFailedRetryView, {
              order: testOrder,
              token: mockToken,
              onRetrySuccess: () => {
                retrySuccessCalled = true;
              },
            })
          );
        });

        // First attempt -> Network error
        await act(async () => {
          const form = container.querySelector("form") as HTMLFormElement;
          form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        });

        assert.equal(capturedKeys.length, 1);
        assert.equal(retrySuccessCalled, false);
        assert.match(container.innerHTML, /Không thể kết nối đến máy chủ|Idempotency-Key đã được giữ nguyên/i);

        // Second attempt -> Retry with same key
        await act(async () => {
          const btnSameKey = container.querySelector("#btnRetrySameKey") as HTMLButtonElement;
          if (btnSameKey) {
            btnSameKey.click();
          } else {
            const form = container.querySelector("form") as HTMLFormElement;
            form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
          }
        });

        assert.equal(capturedKeys.length, 2);
        assert.equal(
          capturedKeys[0],
          capturedKeys[1],
          "Idempotency-Key BẮT BUỘC phải giữ nguyên khi thử lại sau lỗi mạng"
        );
        assert.equal(retrySuccessCalled, true);

        await act(async () => {
          root.unmount();
        });
      } finally {
        cleanupDom();
      }
    });
  });

  describe("4. 409 INVALID_TRANSITION -> Server Truth CANCELLED Terminal State Integration", () => {
    it("should fetch latest server truth on 409 INVALID_TRANSITION and immediately hide retry form when order is CANCELLED", async () => {
      setupDom();
      const mockToken = createValidMockJwt();
      let liveServerOrder = createSampleOrder("PAYMENT_FAILED");

      global.fetch = async (url) => {
        const u = String(url);
        if (u.includes("/payments")) {
          return new Response(
            JSON.stringify({
              statusCode: 409,
              message: "INVALID_TRANSITION: Cannot transition order from CANCELLED to PAID",
              error: "Conflict",
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      };

      try {
        const container = dom.window.document.getElementById("root")!;
        const root = createRoot(container);
        let refetchCalled = false;

        const mockReload = async (): Promise<OrderConfirmationData | null> => {
          refetchCalled = true;
          liveServerOrder = {
            ...liveServerOrder,
            status: "CANCELLED",
          };
          return liveServerOrder;
        };

        const renderView = () =>
          React.createElement(PaymentFailedRetryView, {
            order: liveServerOrder,
            token: mockToken,
            onRetrySuccess: () => {},
            onRetryFailure: mockReload,
          });

        await act(async () => {
          root.render(renderView());
        });

        assert.ok(container.querySelector("#btnSubmitRetryPayment"));

        // Click submit -> Triggers 409 INVALID_TRANSITION
        await act(async () => {
          const form = container.querySelector("form") as HTMLFormElement;
          form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        });

        assert.equal(refetchCalled, true, "onRetryFailure phải được gọi để reload server truth");

        // Re-render with server truth CANCELLED
        await act(async () => {
          root.render(renderView());
        });

        // Form and submit button must be completely gone
        assert.equal(container.querySelector("#btnSubmitRetryPayment"), null);
        assert.equal(container.querySelector("form"), null);
        assert.ok(container.querySelector("#orderTerminalStateNotice"));
        assert.match(container.innerHTML, /đã bị hủy/i);

        await act(async () => {
          root.unmount();
        });
      } finally {
        cleanupDom();
      }
    });
  });

  describe("5. User Isolation & Multi-Account Protection Integration", () => {
    it("should prevent User B from viewing User A's order confirmation snapshot (isolation invariant)", async () => {
      const userAToken = createValidMockJwt("user-a-uuid-0001");
      const userBToken = createValidMockJwt("user-b-uuid-0002");

      const userAOrder = createSampleOrder("PAID", {
        id: "550e8400-e29b-41d4-a716-446655440010",
      });
      const userBOrder = createSampleOrder("PAID", {
        id: "550e8400-e29b-41d4-a716-446655440099",
      });

      global.fetch = async (url, init) => {
        const u = String(url);
        const authHeader = (init?.headers as Record<string, string>)?.["Authorization"] || "";

        if (u.includes("/orders/me")) {
          if (authHeader.includes(userAToken)) {
            return new Response(
              JSON.stringify({
                items: [userAOrder],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
          if (authHeader.includes(userBToken)) {
            return new Response(
              JSON.stringify({
                items: [userBOrder],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
        }
        return new Response("Not found", { status: 404 });
      };

      // 1. User A can find their own order
      const ordersA = await fetchMyOrdersApi(userAToken);
      const matchA = findOrderForConfirmation(ordersA, userAOrder.id);
      assert.ok(matchA !== null);
      assert.equal(matchA.id, userAOrder.id);

      // 2. User B tries to look up User A's orderId -> must return null
      const ordersB = await fetchMyOrdersApi(userBToken);
      const matchB = findOrderForConfirmation(ordersB, userAOrder.id);
      assert.equal(matchB, null, "User B TUYỆT ĐỐI không thể tra cứu đơn của User A");
    });
  });

  describe("6. Zero VND Free Order End-to-End Integration (API Contract v3.0 §3.2)", () => {
    it("should successfully process 0 VND order (100% coupon discount) through payment and confirmation", async () => {
      const mockToken = createValidMockJwt();
      const freeOrder = createSampleOrder("PENDING", {
        id: "550e8400-e29b-41d4-a716-446655440000",
        subtotalVnd: 50000,
        discountVnd: 50000,
        totalVnd: 0,
        couponCode: "FREE100",
        pointsEarned: 0,
      });

      global.fetch = async (url) => {
        const u = String(url);
        if (u.includes("/payments")) {
          return new Response(
            JSON.stringify({
              paymentId: "550e8400-e29b-41d4-a716-446655440005",
              orderId: freeOrder.id,
              paymentStatus: "SUCCESS",
              orderStatus: "PAID",
              method: "CARD",
              methodLast4: "1234",
              mockReference: "MOCK-ZERO-VND",
              amountVnd: 0,
              pointsEarned: 0,
              failureReason: null,
              createdAt: new Date().toISOString(),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      };

      const result = await submitRetryPaymentApi({
        orderId: freeOrder.id,
        method: "CARD",
        identifier: "1234567890121234",
        token: mockToken,
        expectedAmountVnd: 0,
      });

      assert.equal(result.paymentStatus, "SUCCESS");
      assert.equal(result.orderStatus, "PAID");
      assert.equal(result.amountVnd, 0);
      assert.equal(result.pointsEarned, 0);
    });
  });
});
