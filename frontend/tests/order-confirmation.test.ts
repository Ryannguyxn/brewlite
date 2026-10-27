import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  type OrderConfirmationData,
  computeOrderRemainingSeconds,
  isOrderExpired,
  formatRemainingTime,
  findOrderForConfirmation,
  fetchMyOrdersApi,
  submitRetryPaymentApi,
  generateIdempotencyKey,
} from "../services/order-confirmation.service";

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
  return `${header}.${payload}.mockSignature123`;
}

describe("SCRUM-68: Order Confirmation Service & Logic Automated Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  const mockOrderSuccess: OrderConfirmationData = {
    id: "550e8400-e29b-41d4-a716-446655440010",
    status: "PAID",
    createdAt: "2026-10-25T01:50:00.000Z",
    expiresAt: "2026-10-25T02:05:00.000Z",
    subtotalVnd: 118000,
    discountVnd: 20000,
    totalVnd: 98000,
    couponCode: "WELCOME20",
    pointsEarned: 9,
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Cà Phê Muối",
        size: "M",
        sizeMultiplierPercent: 120,
        basePriceVnd: 35000,
        unitPriceVnd: 42000,
        quantity: 2,
        lineTotalVnd: 84000,
        toppings: [{ id: "top-1", name: "Kem Cheese", priceVnd: 10000 }],
      },
    ],
    payment: {
      id: "550e8400-e29b-41d4-a716-446655440020",
      status: "SUCCESS",
      method: "CARD",
      methodLast4: "0001",
      amountVnd: 98000,
      mockReference: "MOCK-CARD-0001-1234",
      failureReason: null,
      createdAt: "2026-10-25T01:51:00.000Z",
    },
  };

  const mockOrderFailed: OrderConfirmationData = {
    id: "550e8400-e29b-41d4-a716-446655440011",
    status: "PAYMENT_FAILED",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    subtotalVnd: 65000,
    discountVnd: 0,
    totalVnd: 65000,
    couponCode: null,
    pointsEarned: 0,
    items: [
      {
        id: "item-2",
        productId: "prod-2",
        productName: "Cà Phê Sữa Đá",
        size: "S",
        sizeMultiplierPercent: 100,
        basePriceVnd: 35000,
        unitPriceVnd: 35000,
        quantity: 1,
        lineTotalVnd: 35000,
        toppings: [],
      },
    ],
    payment: {
      id: "550e8400-e29b-41d4-a716-446655440021",
      status: "FAILED",
      method: "CARD",
      methodLast4: "0002",
      amountVnd: 65000,
      mockReference: "MOCK-CARD-0002-5678",
      failureReason: "PAYMENT_DECLINED",
      createdAt: new Date().toISOString(),
    },
  };

  describe("1. Expiration & Countdown Logic (15 phút theo Contract v3.0)", () => {
    it("should compute remaining seconds accurately when order is active", () => {
      const now = Date.now();
      const expiresAt = new Date(now + 300 * 1000).toISOString();
      const remaining = computeOrderRemainingSeconds(expiresAt, now);
      assert.equal(remaining, 300);
      assert.equal(formatRemainingTime(remaining), "05:00");
    });

    it("should return 0 when order expiresAt is in the past", () => {
      const now = Date.now();
      const expiresAt = new Date(now - 10 * 1000).toISOString();
      const remaining = computeOrderRemainingSeconds(expiresAt, now);
      assert.equal(remaining, 0);
      assert.equal(formatRemainingTime(remaining), "00:00");
    });

    it("should correctly identify expired orders via isOrderExpired", () => {
      const now = Date.now();
      assert.equal(isOrderExpired(mockOrderFailed, now), false);

      const expiredOrder = {
        ...mockOrderFailed,
        expiresAt: new Date(now - 1000).toISOString(),
      };
      assert.equal(isOrderExpired(expiredOrder, now), true);

      const cancelledOrder = {
        ...mockOrderFailed,
        status: "CANCELLED",
      };
      assert.equal(isOrderExpired(cancelledOrder, now), true);
    });

    it("should rely strictly on expiresAt and NOT infer/fallback from createdAt", () => {
      const now = Date.now();
      const created16MinAgo = new Date(now - 16 * 60 * 1000).toISOString();
      assert.equal(
        isOrderExpired(
          { createdAt: created16MinAgo, status: "PAYMENT_FAILED" },
          now
        ),
        false
      );
    });
  });

  describe("2. Order Lookup & Confirmation Selection (GET /orders/me)", () => {
    const orderList = [mockOrderFailed, mockOrderSuccess];

    it("should find order by specific targetOrderId", () => {
      const result = findOrderForConfirmation(orderList, mockOrderSuccess.id);
      assert.notEqual(result, null);
      assert.equal(result?.id, mockOrderSuccess.id);
      assert.equal(result?.status, "PAID");
    });

    it("should fallback to the most recent order when targetOrderId is not passed", () => {
      const result = findOrderForConfirmation(orderList);
      assert.notEqual(result, null);
      assert.equal(result?.id, mockOrderFailed.id);
    });

    it("should return null when orderList is empty", () => {
      assert.equal(findOrderForConfirmation([]), null);
    });
  });

  describe("3. Idempotency Key Generation", () => {
    it("should generate a 36-character UUIDv4 for Idempotency-Key", () => {
      const key = generateIdempotencyKey();
      assert.equal(typeof key, "string");
      assert.equal(key.length, 36);
      assert.equal(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          key
        ),
        true
      );
    });
  });

  describe("4. API Calls & Authorization Guards", () => {
    it("should throw UNAUTHORIZED when calling fetchMyOrdersApi without valid token", async () => {
      await assert.rejects(
        async () => {
          await fetchMyOrdersApi("");
        },
        { message: "UNAUTHORIZED" }
      );
    });

    it("should throw UNAUTHORIZED when calling submitRetryPaymentApi without token", async () => {
      await assert.rejects(
        async () => {
          await submitRetryPaymentApi({
            orderId: mockOrderFailed.id,
            method: "CARD",
            identifier: "1234567890121234",
            token: "",
          });
        },
        { message: "UNAUTHORIZED" }
      );
    });

    it("should reject invalid UUID orderId in submitRetryPaymentApi", async () => {
      const validToken = createValidMockJwt();
      await assert.rejects(
        async () => {
          await submitRetryPaymentApi({
            orderId: "invalid-uuid",
            method: "CARD",
            identifier: "1234567890121234",
            token: validToken,
          });
        },
        { message: "INVALID_ORDER_ID" }
      );
    });

    it("should successfully call POST /payments with correct headers and payload", async () => {
      const validToken = createValidMockJwt();
      const expectedResponse = {
        paymentId: "550e8400-e29b-41d4-a716-446655440099",
        orderId: mockOrderFailed.id,
        paymentStatus: "SUCCESS",
        orderStatus: "PAID",
        amountVnd: 65000,
        method: "CARD",
        methodLast4: "1234",
        mockReference: "MOCK-CARD-1234-abcd",
        pointsEarned: 6,
        failureReason: null,
        createdAt: new Date().toISOString(),
      };

      let capturedInit: RequestInit = {};

      global.fetch = (async (_url: string, init?: RequestInit) => {
        if (init) capturedInit = init;
        return {
          ok: true,
          status: 200,
          json: async () => expectedResponse,
        } as Response;
      }) as typeof fetch;

      const result = await submitRetryPaymentApi({
        orderId: mockOrderFailed.id,
        method: "CARD",
        identifier: "1234567890121234",
        token: validToken,
      });

      assert.equal(result.paymentStatus, "SUCCESS");
      assert.equal(result.orderStatus, "PAID");
      assert.equal(result.pointsEarned, 6);

      assert.equal(capturedInit.method, "POST");
      const headers = capturedInit.headers as Record<string, string>;
      assert.equal(headers?.["Authorization"], `Bearer ${validToken}`);
      assert.ok(headers?.["Idempotency-Key"]);
      const parsedBody = JSON.parse(String(capturedInit.body));
      assert.equal(parsedBody.orderId, mockOrderFailed.id);
      assert.equal(parsedBody.method, "CARD");
      assert.equal(parsedBody.paymentDetails.cardNumber, "1234567890121234");
    });
  });
});
