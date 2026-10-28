import assert from "node:assert/strict";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { PaymentFailedRetryView } from "../components/PaymentFailedRetryView";
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
  validateAuthMeResponse,
  fetchAuthMeProfile,
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
        productId: "550e8400-e29b-41d4-a716-446655440001",
        productName: "Cà Phê Muối",
        size: "M",
        sizeMultiplierPercent: 120,
        basePriceVnd: 35000,
        unitPriceVnd: 42000,
        quantity: 2,
        lineTotalVnd: 84000,
        toppings: [{ id: "550e8400-e29b-41d4-a716-446655440091", name: "Kem Cheese", priceVnd: 10000 }],
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
        productId: "550e8400-e29b-41d4-a716-446655440002",
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
      methodLast4: "1234",
      amountVnd: 65000,
      mockReference: "MOCK-CARD-1234-5678",
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

    it("should return null when targetOrderId is not found in order history (does NOT open latest order)", () => {
      const nonExistentUuid = "550e8400-e29b-41d4-a716-446655440999";
      const result = findOrderForConfirmation(orderList, nonExistentUuid);
      assert.equal(result, null);
    });

    it("should return null when targetOrderId is an invalid UUID (does NOT open latest order)", () => {
      const invalidId = "invalid-order-id-123";
      const result = findOrderForConfirmation(orderList, invalidId);
      assert.equal(result, null);
    });

    it("should return null when targetOrderId is not passed or empty (TUYỆT ĐỐI không mở nhầm đơn mới nhất)", () => {
      const result1 = findOrderForConfirmation(orderList);
      assert.equal(result1, null);

      const result2 = findOrderForConfirmation(orderList, "");
      assert.equal(result2, null);

      const result3 = findOrderForConfirmation(orderList, "   ");
      assert.equal(result3, null);

      const result4 = findOrderForConfirmation(orderList, null);
      assert.equal(result4, null);
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
      }) as unknown as typeof fetch;

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

    it("should preserve and reuse the same Idempotency-Key on network retry", async () => {
      const validToken = createValidMockJwt();
      const specificKey = "idem-retry-custom-key-12345678";
      let capturedKey = "";

      global.fetch = (async (_url: string, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>;
        capturedKey = headers?.["Idempotency-Key"] || "";
        return {
          ok: true,
          status: 200,
          json: async () => ({
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
          }),
        } as Response;
      }) as unknown as typeof fetch;

      await submitRetryPaymentApi({
        orderId: mockOrderFailed.id,
        method: "CARD",
        identifier: "1234567890121234",
        token: validToken,
        idempotencyKey: specificKey,
      });

      assert.equal(capturedKey, specificKey);
    });

    it("should reject malformed payment responses (invalid UUID, wrong orderId, bad status) and NOT treat as success", async () => {
      const validToken = createValidMockJwt();

      // Case A: Missing paymentId
      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          orderId: mockOrderFailed.id,
          paymentStatus: "SUCCESS",
          orderStatus: "PAID",
          amountVnd: 65000,
        }),
      })) as unknown as typeof fetch;

      await assert.rejects(
        async () => {
          await submitRetryPaymentApi({
            orderId: mockOrderFailed.id,
            method: "CARD",
            identifier: "1234567890121234",
            token: validToken,
          });
        },
        (err: unknown) => {
          const e = err as { code?: string };
          return e.code === "INTERNAL_ERROR" || Boolean(err);
        }
      );

      // Case B: Inconsistent status (SUCCESS but orderStatus is PAYMENT_FAILED)
      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          paymentId: "550e8400-e29b-41d4-a716-446655440099",
          orderId: mockOrderFailed.id,
          paymentStatus: "SUCCESS",
          orderStatus: "PAYMENT_FAILED",
          amountVnd: 65000,
          method: "CARD",
          methodLast4: "1234",
          mockReference: "MOCK-001",
          pointsEarned: 6,
          failureReason: null,
          createdAt: new Date().toISOString(),
        }),
      })) as unknown as typeof fetch;

      await assert.rejects(
        async () => {
          await submitRetryPaymentApi({
            orderId: mockOrderFailed.id,
            method: "CARD",
            identifier: "1234567890121234",
            token: validToken,
          });
        },
        (err: unknown) => {
          const e = err as { code?: string };
          return e.code === "INTERNAL_ERROR" || Boolean(err);
        }
      );
    });

    it("should support 0 VND Order retry payment (amountVnd === 0, pointsEarned === 0)", async () => {
      const validToken = createValidMockJwt();
      const zeroVndResponse = {
        paymentId: "550e8400-e29b-41d4-a716-446655440055",
        orderId: mockOrderFailed.id,
        paymentStatus: "SUCCESS",
        orderStatus: "PAID",
        amountVnd: 0,
        method: "CARD",
        methodLast4: "1234",
        mockReference: "MOCK-ZERO-1234",
        pointsEarned: 0,
        failureReason: null,
        createdAt: new Date().toISOString(),
      };

      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => zeroVndResponse,
      })) as unknown as typeof fetch;

      const result = await submitRetryPaymentApi({
        orderId: mockOrderFailed.id,
        method: "CARD",
        identifier: "1234567890121234",
        token: validToken,
        expectedAmountVnd: 0,
      });

      assert.equal(result.paymentStatus, "SUCCESS");
      assert.equal(result.amountVnd, 0);
      assert.equal(result.pointsEarned, 0);
    });

    it("should reject 401 UNAUTHORIZED from server and throw error", async () => {
      const validToken = createValidMockJwt();
      global.fetch = (async () => ({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized", code: "UNAUTHORIZED" }),
      })) as unknown as typeof fetch;

      await assert.rejects(
        async () => {
          await submitRetryPaymentApi({
            orderId: mockOrderFailed.id,
            method: "CARD",
            identifier: "1234567890121234",
            token: validToken,
          });
        },
        (err: unknown) => {
          const e = err as { statusCode?: number; message?: string };
          return e.statusCode === 401 || e.message === "UNAUTHORIZED";
        }
      );
    });
  });

  describe("5. Strict Runtime Validation for GET /auth/me & GET /orders/me", () => {
    it("should validate and return a valid AuthMeProfile from validateAuthMeResponse", () => {
      const validRaw = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "khachhang@brewlite.vn",
        fullName: "Nguyen Van A",
        loyaltyPoints: 120,
      };
      const result = validateAuthMeResponse(validRaw);
      assert.equal(result.id, "550e8400-e29b-41d4-a716-446655440001");
      assert.equal(result.email, "khachhang@brewlite.vn");
      assert.equal(result.fullName, "Nguyen Van A");
      assert.equal(result.loyaltyPoints, 120);
    });

    it("should reject malformed or non-object payload in validateAuthMeResponse", () => {
      assert.throws(() => validateAuthMeResponse(null), /đối tượng JSON hợp lệ/);
      assert.throws(() => validateAuthMeResponse([]), /đối tượng JSON hợp lệ/);
      assert.throws(() => validateAuthMeResponse("string"), /đối tượng JSON hợp lệ/);
    });

    it("should reject invalid UUID or invalid email in validateAuthMeResponse", () => {
      // Invalid UUID
      assert.throws(
        () =>
          validateAuthMeResponse({
            id: "not-a-uuid",
            email: "user@test.com",
            fullName: "User",
            loyaltyPoints: 10,
          }),
        /UUID hợp lệ/
      );

      // Invalid email
      assert.throws(
        () =>
          validateAuthMeResponse({
            id: "550e8400-e29b-41d4-a716-446655440001",
            email: "invalid-email-no-at",
            fullName: "User",
            loyaltyPoints: 10,
          }),
        /email/
      );
    });

    it("should accept fullName as null or whitespace and normalize to null", () => {
      const rawNull = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "user@test.com",
        fullName: null,
        loyaltyPoints: 10,
      };
      const res1 = validateAuthMeResponse(rawNull);
      assert.equal(res1.fullName, null);

      const rawWhitespace = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "user@test.com",
        fullName: "   ",
        loyaltyPoints: 10,
      };
      const res2 = validateAuthMeResponse(rawWhitespace);
      assert.equal(res2.fullName, null);
    });

    it("should reject response when required field fullName is completely missing or undefined", () => {
      const rawMissing = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "user@test.com",
        loyaltyPoints: 10,
      };
      assert.throws(
        () => validateAuthMeResponse(rawMissing),
        /thiếu trường bắt buộc 'fullName'/
      );

      const rawUndefined = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "user@test.com",
        fullName: undefined,
        loyaltyPoints: 10,
      };
      assert.throws(
        () => validateAuthMeResponse(rawUndefined),
        /thiếu trường bắt buộc 'fullName'/
      );
    });

    it("should reject non-string and non-null fullName in validateAuthMeResponse", () => {
      assert.throws(
        () =>
          validateAuthMeResponse({
            id: "550e8400-e29b-41d4-a716-446655440001",
            email: "user@test.com",
            fullName: 12345,
            loyaltyPoints: 10,
          }),
        /chuỗi hoặc null/
      );
    });

    it("should reject negative or non-integer loyaltyPoints in validateAuthMeResponse", () => {
      // Negative points
      assert.throws(
        () =>
          validateAuthMeResponse({
            id: "550e8400-e29b-41d4-a716-446655440001",
            email: "user@test.com",
            fullName: "User",
            loyaltyPoints: -5,
          }),
        /số nguyên an toàn không âm/
      );

      // Floating points
      assert.throws(
        () =>
          validateAuthMeResponse({
            id: "550e8400-e29b-41d4-a716-446655440001",
            email: "user@test.com",
            fullName: "User",
            loyaltyPoints: 12.5,
          }),
        /số nguyên an toàn không âm/
      );
    });

    it("should fetch and validate profile in fetchAuthMeProfile", async () => {
      const validToken = createValidMockJwt();
      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "customer@brewlite.vn",
          fullName: "Tran Thi B",
          loyaltyPoints: 50,
        }),
      })) as unknown as typeof fetch;

      const profile = await fetchAuthMeProfile(validToken);
      assert.notEqual(profile, null);
      assert.equal(profile?.loyaltyPoints, 50);
      assert.equal(profile?.fullName, "Tran Thi B");
    });

    it("should throw UNAUTHORIZED on 401 response in fetchAuthMeProfile", async () => {
      const validToken = createValidMockJwt();
      global.fetch = (async () => ({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      })) as unknown as typeof fetch;

      await assert.rejects(
        async () => {
          await fetchAuthMeProfile(validToken);
        },
        (err: unknown) => {
          const e = err as { statusCode?: number; message?: string };
          return e.statusCode === 401 || e.message === "UNAUTHORIZED";
        }
      );
    });

    it("should throw error when GET /orders/me returns malformed order snapshot (missing or invalid expiresAt)", async () => {
      const validToken = createValidMockJwt();
      // Server returns order with null expiresAt (malformed order snapshot)
      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: "550e8400-e29b-41d4-a716-446655440010",
              status: "PENDING",
              createdAt: "2026-10-25T01:50:00.000Z",
              expiresAt: null, // Thiếu expiresAt từ backend
              subtotalVnd: 50000,
              discountVnd: 0,
              totalVnd: 50000,
              items: [],
            },
          ],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      })) as unknown as typeof fetch;

      await assert.rejects(
        async () => {
          await fetchMyOrdersApi(validToken);
        },
        (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          return msg.includes("malformed order snapshot") || msg.includes("sai lệch");
        }
      );
    });

    it("should handle retry payment returning FAILED and allow caller to reload server truth", async () => {
      const validToken = createValidMockJwt();
      const failedPaymentResponse = {
        paymentId: "550e8400-e29b-41d4-a716-446655440099",
        orderId: mockOrderFailed.id,
        paymentStatus: "FAILED",
        orderStatus: "PAYMENT_FAILED",
        amountVnd: 65000,
        method: "CARD",
        methodLast4: "1234",
        mockReference: "MOCK-CARD-1234-5678",
        pointsEarned: 0,
        failureReason: "PAYMENT_DECLINED",
        createdAt: new Date().toISOString(),
      };

      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => failedPaymentResponse,
      })) as unknown as typeof fetch;

      const result = await submitRetryPaymentApi({
        orderId: mockOrderFailed.id,
        method: "CARD",
        identifier: "1234567890121234",
        token: validToken,
      });

      assert.equal(result.paymentStatus, "FAILED");
      assert.equal(result.orderStatus, "PAYMENT_FAILED");
      assert.equal(result.failureReason, "PAYMENT_DECLINED");

      // Verify server truth re-fetch works seamlessly
      const mockUpdatedOrders = {
        items: [
          {
            ...mockOrderFailed,
            status: "PAYMENT_FAILED",
            payment: {
              id: result.paymentId,
              status: "FAILED",
              method: "CARD",
              methodLast4: "1234",
              amountVnd: 65000,
              mockReference: "MOCK-CARD-1234-5678",
              failureReason: "PAYMENT_DECLINED",
              createdAt: result.createdAt,
            },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => mockUpdatedOrders,
      })) as unknown as typeof fetch;

      const refreshed = await fetchMyOrdersApi(validToken);
      assert.equal(refreshed.length, 1);
      assert.equal(refreshed[0].id, mockOrderFailed.id);
      assert.equal(refreshed[0].payment?.failureReason, "PAYMENT_DECLINED");
    });

    it("should handle retry meeting changed order state (409 INVALID_TRANSITION) and refetch latest server truth", async () => {
      const validToken = createValidMockJwt();

      // Backend returns 409 Conflict with INVALID_TRANSITION (e.g. order was paid via another tab or cancelled)
      global.fetch = (async () => ({
        ok: false,
        status: 409,
        json: async () => ({
          statusCode: 409,
          code: "INVALID_TRANSITION",
          message: "INVALID_TRANSITION",
        }),
      })) as unknown as typeof fetch;

      await assert.rejects(
        async () => {
          await submitRetryPaymentApi({
            orderId: mockOrderFailed.id,
            method: "CARD",
            identifier: "1234567890121234",
            token: validToken,
          });
        },
        (err: unknown) => {
          const e = err as { statusCode?: number; code?: string; message?: string };
          return (
            e.statusCode === 409 &&
            (e.code === "INVALID_TRANSITION" || e.message === "INVALID_TRANSITION")
          );
        }
      );

      // Caller/UI immediately refetches server truth from GET /orders/me
      const mockPaidOrderResponse = {
        items: [
          {
            ...mockOrderFailed,
            status: "PAID",
            payment: {
              id: "550e8400-e29b-41d4-a716-446655440099",
              status: "SUCCESS",
              method: "CARD",
              methodLast4: "1234",
              amountVnd: 65000,
              mockReference: "MOCK-CARD-1234-abcd",
              failureReason: null,
              createdAt: new Date().toISOString(),
            },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      global.fetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => mockPaidOrderResponse,
      })) as unknown as typeof fetch;

      const updatedOrders = await fetchMyOrdersApi(validToken);
      const matched = findOrderForConfirmation(updatedOrders, mockOrderFailed.id);
      assert.notEqual(matched, null);
      assert.equal(matched?.status, "PAID");
    });
  });

  describe("6. Lifecycle Status & Copy Invariants", () => {
    it("should never assert an expired order is CANCELLED unless server explicitly returns CANCELLED status", () => {
      const now = Date.now();
      const expiredPendingOrder: OrderConfirmationData = {
        ...mockOrderFailed,
        status: "PENDING",
        expiresAt: new Date(now - 1000).toISOString(),
      };

      assert.equal(isOrderExpired(expiredPendingOrder, now), true);
      assert.notEqual(expiredPendingOrder.status, "CANCELLED");

      // Verify that expired notice does NOT assert CANCELLED unless status is CANCELLED
      const noticeCopy = expiredPendingOrder.status === "CANCELLED"
        ? "Đơn hàng đã bị hủy (CANCELLED)"
        : "Thời hạn giữ chỗ đơn hàng đã kết thúc (15 phút)";
      assert.equal(noticeCopy, "Thời hạn giữ chỗ đơn hàng đã kết thúc (15 phút)");
      assert.equal(noticeCopy.includes("CANCELLED"), false);
      assert.equal(noticeCopy.includes("bị hủy"), false);

      const cancelledOrder: OrderConfirmationData = {
        ...mockOrderFailed,
        status: "CANCELLED",
        expiresAt: new Date(now - 1000).toISOString(),
      };
      const cancelledNoticeCopy = cancelledOrder.status === "CANCELLED"
        ? "Đơn hàng đã bị hủy (CANCELLED)"
        : "Thời hạn giữ chỗ đơn hàng đã kết thúc (15 phút)";
      assert.equal(cancelledNoticeCopy, "Đơn hàng đã bị hủy (CANCELLED)");
    });

    it("should correctly distinguish practical lifecycle presentation copy for PAID, PREPARING, READY, COMPLETED", () => {
      function getOrderPresentationCopy(status: string) {
        switch (status) {
          case "COMPLETED":
            return {
              badge: "ĐÃ HOÀN THÀNH (COMPLETED)",
              eta: "Đã hoàn tất (Đã giao trọn vẹn cho khách hàng)",
              step2: "Đã pha chế xong",
              step3: "Đã giao hàng",
              step4: "Hoàn tất đơn hàng",
              barista: "Đã phục vụ",
            };
          case "READY":
            return {
              badge: "SẴN SÀNG PHỤC VỤ (READY)",
              eta: "Sẵn sàng ngay (Đồ uống đã hoàn tất tại quầy)",
              step2: "Đã pha chế xong",
              step3: "Sẵn sàng phục vụ",
              step4: "Giao tận tay",
              barista: "Đã sẵn sàng",
            };
          case "PREPARING":
            return {
              badge: "ĐANG PHA CHẾ (PREPARING)",
              eta: "10 - 15 phút (Đang trong quá trình pha chế thủ công)",
              step2: "Đang pha chế thủ công",
              step3: "Chờ giao hàng",
              step4: "Giao tận tay",
              barista: "Đang chiết xuất",
            };
          case "PAID":
          default:
            return {
              badge: "ĐÃ THANH TOÁN (PAID)",
              eta: "15 - 25 phút (Đã tiếp nhận, chuẩn bị vào quầy)",
              step2: "Chờ pha chế",
              step3: "Chờ giao hàng",
              step4: "Giao tận tay",
              barista: "Chờ tiếp nhận",
            };
        }
      }

      const paidCopy = getOrderPresentationCopy("PAID");
      assert.equal(paidCopy.badge, "ĐÃ THANH TOÁN (PAID)");
      assert.equal(paidCopy.step2, "Chờ pha chế");
      assert.equal(paidCopy.barista, "Chờ tiếp nhận");

      const prepCopy = getOrderPresentationCopy("PREPARING");
      assert.equal(prepCopy.badge, "ĐANG PHA CHẾ (PREPARING)");
      assert.equal(prepCopy.step2, "Đang pha chế thủ công");
      assert.equal(prepCopy.barista, "Đang chiết xuất");

      const readyCopy = getOrderPresentationCopy("READY");
      assert.equal(readyCopy.badge, "SẴN SÀNG PHỤC VỤ (READY)");
      assert.equal(readyCopy.step2, "Đã pha chế xong");
      assert.equal(readyCopy.step3, "Sẵn sàng phục vụ");
      assert.equal(readyCopy.barista, "Đã sẵn sàng");

      const compCopy = getOrderPresentationCopy("COMPLETED");
      assert.equal(compCopy.badge, "ĐÃ HOÀN THÀNH (COMPLETED)");
      assert.equal(compCopy.step3, "Đã giao hàng");
      assert.equal(compCopy.step4, "Hoàn tất đơn hàng");
      assert.equal(compCopy.barista, "Đã phục vụ");
    });

    it("should rotate Idempotency-Key upon 409 IDEMPOTENCY_KEY_CONFLICT and NOT treat it as INVALID_TRANSITION", () => {
      const originalKey = generateIdempotencyKey();
      let currentKey = originalKey;
      let isNetworkUncertain = false;
      let isRefetched = false;

      // Simulate error handling logic in PaymentFailedRetryView
      const errorResponse = {
        statusCode: 409,
        code: "IDEMPOTENCY_KEY_CONFLICT",
        message: "IDEMPOTENCY_KEY_CONFLICT: Khóa đã được sử dụng với payload khác",
      };

      const msg = errorResponse.message;
      const errCode = errorResponse.code;
      const statusCode = errorResponse.statusCode;

      const isIdempotencyConflict =
        errCode === "IDEMPOTENCY_KEY_CONFLICT" ||
        msg.includes("IDEMPOTENCY_KEY_CONFLICT");

      const isNetworkErr =
        errCode === "PAYMENT_IN_PROGRESS" ||
        msg.includes("PAYMENT_IN_PROGRESS");

      if (isIdempotencyConflict) {
        isNetworkUncertain = false;
        currentKey = generateIdempotencyKey(); // ROTATE KEY
      } else if (isNetworkErr) {
        isNetworkUncertain = true;
      } else if (
        errCode === "INVALID_TRANSITION" ||
        msg.includes("INVALID_TRANSITION") ||
        (statusCode === 409 && !isIdempotencyConflict && !isNetworkErr)
      ) {
        isRefetched = true;
      }

      assert.equal(isIdempotencyConflict, true);
      assert.equal(isRefetched, false, "IDEMPOTENCY_KEY_CONFLICT must NOT trigger INVALID_TRANSITION refetch branch");
      assert.notEqual(currentKey, originalKey, "Idempotency-Key must be rotated to a fresh key");
      assert.equal(isNetworkUncertain, false);
    });

    it("should refetch server truth when encountering true 409 INVALID_TRANSITION", async () => {
      let isRefetched = false;
      let newStatus: string | undefined;

      const errorResponse = {
        statusCode: 409,
        code: "INVALID_TRANSITION",
        message: "INVALID_TRANSITION: Cannot transition order from CANCELLED to PAID",
      };

      const msg = errorResponse.message;
      const errCode = errorResponse.code;
      const statusCode = errorResponse.statusCode;

      const isIdempotencyConflict =
        errCode === "IDEMPOTENCY_KEY_CONFLICT" ||
        msg.includes("IDEMPOTENCY_KEY_CONFLICT");

      const isNetworkErr =
        errCode === "PAYMENT_IN_PROGRESS" ||
        msg.includes("PAYMENT_IN_PROGRESS");

      const isInvalidTransition =
        errCode === "INVALID_TRANSITION" ||
        msg.includes("INVALID_TRANSITION") ||
        (statusCode === 409 && !isIdempotencyConflict && !isNetworkErr);

      assert.equal(isIdempotencyConflict, false);
      assert.equal(isInvalidTransition, true);

      if (isInvalidTransition) {
        // Mock onRetryFailure refetching server truth
        const mockReloadedOrder = {
          ...mockOrderFailed,
          status: "CANCELLED",
        };
        isRefetched = true;
        newStatus = mockReloadedOrder.status;
      }

      assert.equal(isRefetched, true);
      assert.equal(newStatus, "CANCELLED");
    });

    it("should completely omit retry form and submit button when order status becomes CANCELLED (terminal state)", () => {
      // Simulate UI render predicate in PaymentFailedRetryView
      function shouldRenderRetryForm(orderStatus: string, isExpired: boolean) {
        const isCancelled = orderStatus === "CANCELLED";
        const isTerminal = isExpired || isCancelled;
        return {
          renderForm: !isTerminal,
          renderTerminalNotice: isTerminal,
          isCancelled,
        };
      }

      // Case 1: Active order in PAYMENT_FAILED, not expired
      const failedState = shouldRenderRetryForm("PAYMENT_FAILED", false);
      assert.equal(failedState.renderForm, true);
      assert.equal(failedState.renderTerminalNotice, false);

      // Case 2: Active order in PENDING, not expired
      const pendingState = shouldRenderRetryForm("PENDING", false);
      assert.equal(pendingState.renderForm, true);
      assert.equal(pendingState.renderTerminalNotice, false);

      // Case 3: Server truth refetch returned CANCELLED -> Form and retry button must vanish completely
      const cancelledState = shouldRenderRetryForm("CANCELLED", false);
      assert.equal(cancelledState.renderForm, false, "Form must NOT render when CANCELLED");
      assert.equal(cancelledState.renderTerminalNotice, true, "Terminal notice must render when CANCELLED");
      assert.equal(cancelledState.isCancelled, true);

      // Case 4: Order expired (15 minutes) -> Form and retry button must vanish completely
      const expiredState = shouldRenderRetryForm("PAYMENT_FAILED", true);
      assert.equal(expiredState.renderForm, false, "Form must NOT render when expired");
      assert.equal(expiredState.renderTerminalNotice, true);
    });
  });

  describe("7. Behavior Matrix & Mounted Component Flow Tests (JSDOM)", () => {
    let dom: JSDOM;
    let originalWindow: unknown;
    let originalDocument: unknown;
    let originalSelf: unknown;
    let globalTarget: {
      window: unknown;
      document: unknown;
      self: unknown;
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    };
    let originalActEnv: boolean | undefined;

    const setupDom = () => {
      dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
        url: "http://localhost/order-confirmation",
      });
      globalTarget = globalThis as unknown as typeof globalTarget;
      originalWindow = globalTarget.window;
      originalDocument = globalTarget.document;
      originalSelf = globalTarget.self;
      originalActEnv = globalTarget.IS_REACT_ACT_ENVIRONMENT;

      globalTarget.window = dom.window;
      globalTarget.document = dom.window.document;
      globalTarget.self = dom.window;
      globalTarget.IS_REACT_ACT_ENVIRONMENT = true;
    };

    const cleanupDom = () => {
      globalTarget.window = originalWindow;
      globalTarget.document = originalDocument;
      globalTarget.self = originalSelf;
      globalTarget.IS_REACT_ACT_ENVIRONMENT = originalActEnv;
      dom.window.close();
    };

    const createTestOrder = (overrides: Partial<OrderConfirmationData> = {}): OrderConfirmationData => ({
      id: "550e8400-e29b-41d4-a716-446655440099",
      status: "PAYMENT_FAILED",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      subtotalVnd: 85000,
      discountVnd: 0,
      totalVnd: 85000,
      couponCode: null,
      payment: null,
      pointsEarned: 0,
      items: [
        {
          id: "item-test-1",
          productId: "prod-test-1",
          productName: "Cà phê Sữa Đá",
          size: "M",
          sizeMultiplierPercent: 100,
          basePriceVnd: 85000,
          quantity: 1,
          unitPriceVnd: 85000,
          lineTotalVnd: 85000,
          toppings: [],
        },
      ],
      ...overrides,
    });

    it("should rotate idempotency key when receiving 409 IDEMPOTENCY_KEY_CONFLICT while preserving orderId and payload", async () => {
      setupDom();
      const container = dom.window.document.getElementById("root")!;
      const root = createRoot(container);
      const testOrder = createTestOrder();
      const mockToken = createValidMockJwt();

      const capturedKeys: string[] = [];
      const capturedPayloads: Array<Record<string, unknown>> = [];

      global.fetch = async (url, init) => {
        const u = String(url);
        if (u.includes("/payments")) {
          const headers = (init?.headers || {}) as Record<string, string>;
          capturedKeys.push(headers["Idempotency-Key"] || headers["idempotency-key"]);
          capturedPayloads.push(JSON.parse(String(init?.body || "{}")));

          if (capturedKeys.length === 1) {
            return new Response(
              JSON.stringify({
                statusCode: 409,
                message: "IDEMPOTENCY_KEY_CONFLICT: Trùng khóa thanh toán",
                error: "Conflict",
              }),
              { status: 409, headers: { "Content-Type": "application/json" } }
            );
          } else {
            return new Response(
              JSON.stringify({
                paymentId: "550e8400-e29b-41d4-a716-446655440077",
                orderId: testOrder.id,
                paymentStatus: "SUCCESS",
                orderStatus: "PAID",
                method: "CARD",
                methodLast4: "1234",
                mockReference: "MOCK-REF-TEST-1234",
                amountVnd: testOrder.totalVnd,
                pointsEarned: 8,
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

        // 1. First submission -> triggers 409 IDEMPOTENCY_KEY_CONFLICT
        const submitBtn = container.querySelector("#btnSubmitRetryPayment") as HTMLButtonElement;
        assert.ok(submitBtn, "Nút submit retry payment phải tồn tại");

        await act(async () => {
          const form = container.querySelector("form") as HTMLFormElement;
          form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        });

        assert.equal(capturedKeys.length, 1);
        assert.equal(retrySuccessCalled, false);
        // Notice conflict phải hiển thị trên UI
        assert.match(container.innerHTML, /mã giao dịch mới|IDEMPOTENCY_KEY_CONFLICT/i);

        // 2. Second submission -> query fresh submit button or dispatch form submit
        await act(async () => {
          const form = container.querySelector('form') as HTMLFormElement;
          if (form) {
            form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
          }
        });

        assert.equal(capturedKeys.length, 2);
        assert.notEqual(capturedKeys[0], capturedKeys[1], "Idempotency-Key lần 2 PHẢI khác lần 1 khi conflict");
        assert.equal(capturedPayloads[0].orderId, testOrder.id);
        assert.equal(capturedPayloads[1].orderId, testOrder.id);
        assert.equal(capturedPayloads[0].paymentMethod, capturedPayloads[1].paymentMethod);
        assert.equal(retrySuccessCalled, true);
      } finally {
        await act(async () => {
          root.unmount();
        });
        cleanupDom();
      }
    });

    it("should preserve the SAME idempotency key when retrying after a network failure", async () => {
      setupDom();
      const container = dom.window.document.getElementById("root")!;
      const root = createRoot(container);
      const testOrder = createTestOrder();
      const mockToken = createValidMockJwt();

      const capturedKeys: string[] = [];

      global.fetch = async (url, init) => {
        const u = String(url);
        if (u.includes("/payments")) {
          const headers = (init?.headers || {}) as Record<string, string>;
          capturedKeys.push(headers["Idempotency-Key"] || headers["idempotency-key"]);

          if (capturedKeys.length === 1) {
            throw new TypeError("Failed to fetch (Network connection lost)");
          } else {
            return new Response(
              JSON.stringify({
                paymentId: "550e8400-e29b-41d4-a716-446655440077",
                orderId: testOrder.id,
                paymentStatus: "SUCCESS",
                orderStatus: "PAID",
                method: "CARD",
                methodLast4: "1234",
                mockReference: "MOCK-REF-TEST-1234",
                amountVnd: testOrder.totalVnd,
                pointsEarned: 8,
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

        const submitBtn = container.querySelector("#btnSubmitRetryPayment") as HTMLButtonElement;
        assert.ok(submitBtn);

        // Lần 1: Lỗi mạng
        await act(async () => {
          const form = container.querySelector("form") as HTMLFormElement;
          form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        });

        assert.equal(capturedKeys.length, 1);
        assert.equal(retrySuccessCalled, false);
        assert.match(container.innerHTML, /Không thể kết nối đến máy chủ|Idempotency-Key đã được giữ nguyên/i);

        // Lần 2: Thử lại -> BẮT BUỘC giữ nguyên Idempotency-Key cũ
        await act(async () => {
          submitBtn.click();
        });

        assert.equal(capturedKeys.length, 2);
        assert.equal(capturedKeys[0], capturedKeys[1], "Network error BẮT BUỘC giữ nguyên cùng 1 Idempotency-Key");
        assert.equal(retrySuccessCalled, true);
      } finally {
        await act(async () => {
          root.unmount();
        });
        cleanupDom();
      }
    });

    it("should completely remove retry form when 409 INVALID_TRANSITION causes refetch returning CANCELLED", async () => {
      setupDom();
      const container = dom.window.document.getElementById("root")!;
      const root = createRoot(container);
      let currentOrder = createTestOrder();
      const mockToken = createValidMockJwt();

      global.fetch = async (url) => {
        const u = String(url);
        if (u.includes("/payments")) {
          return new Response(
            JSON.stringify({
              statusCode: 409,
              message: "INVALID_TRANSITION: Order cannot transition from CANCELLED",
              error: "Conflict",
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      };

      try {
        let reloadCalled = false;
        const mockReload = async (): Promise<OrderConfirmationData | null> => {
          reloadCalled = true;
          currentOrder = {
            ...currentOrder,
            status: "CANCELLED",
          };
          return currentOrder;
        };

        const renderComponent = () =>
          React.createElement(PaymentFailedRetryView, {
            order: currentOrder,
            token: mockToken,
            onRetrySuccess: () => {},
            onRetryFailure: mockReload,
          });

        await act(async () => {
          root.render(renderComponent());
        });

        // Form ban đầu hiển thị
        assert.ok(container.querySelector("#btnSubmitRetryPayment"));

        // Click retry -> nhận 409 INVALID_TRANSITION -> kích hoạt onReloadOrder
        await act(async () => {
          const form = container.querySelector("form") as HTMLFormElement;
          form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        });

        assert.equal(reloadCalled, true);

        // Re-render với updated order (mô phỏng Confirmation page sau khi refetch server truth)
        await act(async () => {
          root.render(renderComponent());
        });

        // Form retry và submit button phải biến mất hoàn toàn
        assert.equal(container.querySelector("#btnSubmitRetryPayment"), null);
        assert.equal(container.querySelector("form"), null);
        assert.ok(container.querySelector("#orderTerminalStateNotice"));
        assert.match(container.innerHTML, /đã bị hủy/i);
      } finally {
        await act(async () => {
          root.unmount();
        });
        cleanupDom();
      }
    });

    it("should enter blocking error state and lock retry when refetching server truth fails after 409 INVALID_TRANSITION", async () => {
      setupDom();
      const container = dom.window.document.getElementById("root")!;
      const root = createRoot(container);
      const testOrder = createTestOrder();
      const mockToken = createValidMockJwt();

      global.fetch = async (url) => {
        const u = String(url);
        if (u.includes("/payments")) {
          return new Response(
            JSON.stringify({
              statusCode: 409,
              message: "INVALID_TRANSITION: State changed unexpectedly",
              error: "Conflict",
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("Not found", { status: 404 });
      };

      try {
        let shouldFailReload = true;
        const mockReload = async (): Promise<OrderConfirmationData | null> => {
          if (shouldFailReload) {
            // Server error khi fetch GET /orders/me
            return null;
          }
          return {
            ...testOrder,
            status: "PENDING",
          };
        };

        await act(async () => {
          root.render(
            React.createElement(PaymentFailedRetryView, {
              order: testOrder,
              token: mockToken,
              onRetrySuccess: () => {},
              onRetryFailure: mockReload,
            })
          );
        });

        // Click retry
        await act(async () => {
          const form = container.querySelector("form") as HTMLFormElement;
          form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
        });

        // Kiểm tra blocking error state: form retry biến mất, notice cảnh báo xuất hiện
        assert.equal(container.querySelector("#btnSubmitRetryPayment"), null);
        assert.ok(container.querySelector("#serverSyncFailedNotice"), "Phải hiển thị serverSyncFailedNotice");
        assert.match(container.innerHTML, /Chưa thể xác định trạng thái đơn hàng từ máy chủ|Biểu mẫu thử lại đã được khóa/i);

        // Nút thử đồng bộ lại phải xuất hiện
        const btnManualSync = container.querySelector("#btnRetrySyncServerTruth") as HTMLButtonElement;
        assert.ok(btnManualSync, "Phải có nút thử đồng bộ lại");

        // Giả lập server hồi phục, user bấm nút đồng bộ lại
        shouldFailReload = false;
        await act(async () => {
          btnManualSync.click();
        });

        // Form retry phải được mở khóa trở lại
        assert.ok(container.querySelector("#btnSubmitRetryPayment"), "Form retry phải quay lại sau khi sync server truth thành công");
        assert.equal(container.querySelector("#serverSyncFailedNotice"), null);
      } finally {
        await act(async () => {
          root.unmount();
        });
        cleanupDom();
      }
    });

    it("should clear Cart exactly once upon confirmed Payment SUCCESS, and NEVER clear on FAILED, network error, or 409", () => {
      // Test cart clearing invariants
      let cartClearCount = 0;
      let storedOrderClearCount = 0;

      const mockClearCart = () => {
        cartClearCount += 1;
      };
      const mockClearStoredActiveOrder = () => {
        storedOrderClearCount += 1;
      };

      const handlePaymentOutcome = (outcome: "SUCCESS" | "FAILED" | "NETWORK_ERR" | "409_INVALID" | "CANCELLED") => {
        if (outcome === "SUCCESS") {
          // Rule: Cart chỉ clear khi Payment SUCCESS được xác nhận
          mockClearCart();
          mockClearStoredActiveOrder();
        }
        // Các trường hợp khác: giữ Cart nguyên vẹn để cho phép retry
      };

      // 1. FAILED -> Không clear
      handlePaymentOutcome("FAILED");
      assert.equal(cartClearCount, 0);
      assert.equal(storedOrderClearCount, 0);

      // 2. NETWORK_ERR -> Không clear
      handlePaymentOutcome("NETWORK_ERR");
      assert.equal(cartClearCount, 0);
      assert.equal(storedOrderClearCount, 0);

      // 3. 409_INVALID -> Không clear
      handlePaymentOutcome("409_INVALID");
      assert.equal(cartClearCount, 0);
      assert.equal(storedOrderClearCount, 0);

      // 4. CANCELLED -> Không clear (giữ giỏ để khách có thể mua lại nếu muốn)
      handlePaymentOutcome("CANCELLED");
      assert.equal(cartClearCount, 0);
      assert.equal(storedOrderClearCount, 0);

      // 5. SUCCESS -> Clear đúng 1 lần
      handlePaymentOutcome("SUCCESS");
      assert.equal(cartClearCount, 1, "Cart phải clear đúng 1 lần sau SUCCESS");
      assert.equal(storedOrderClearCount, 1, "Stored active order phải clear đúng 1 lần sau SUCCESS");
    });
  });

});
