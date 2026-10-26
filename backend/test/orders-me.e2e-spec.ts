import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { getJwtSecret } from '../src/auth/jwt.config.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const userId = '550e8400-e29b-41d4-a716-446655440000';
const otherUserId = '550e8400-e29b-41d4-a716-446655440001';
const orderId = '550e8400-e29b-41d4-a716-446655440010';
const itemId = '550e8400-e29b-41d4-a716-446655440011';
const toppingId = '550e8400-e29b-41d4-a716-446655440012';
const successPaymentId = '550e8400-e29b-41d4-a716-446655440020';
const failedPaymentId = '550e8400-e29b-41d4-a716-446655440021';
const createdAt = new Date('2026-10-25T01:50:00.000Z');
const paymentAt = new Date('2026-10-25T02:00:00.000Z');

const paymentSnapshot = (
  id: string,
  status: 'SUCCESS' | 'FAILED',
) => ({
  paymentId: id,
  orderId,
  paymentStatus: status,
  orderStatus: status === 'SUCCESS' ? 'PAID' : 'PAYMENT_FAILED',
  amountVnd: 98000,
  method: 'CARD',
  methodLast4: '1234',
  mockReference: `MOCK-${id}`,
  pointsEarned: status === 'SUCCESS' ? 9 : 0,
  failureReason: status === 'SUCCESS' ? null : 'PAYMENT_DECLINED',
  createdAt: paymentAt.toISOString(),
});

const order = {
  id: orderId,
  status: 'PAID' as const,
  createdAt,
  expiresAt: new Date('2026-10-25T02:05:00.000Z'),
  subtotalVnd: 118000n,
  discountVnd: 20000n,
  totalVnd: 98000n,
  couponCodeSnapshot: 'WELCOME20',
  pointsEarned: 9,
  items: [
    {
      id: itemId,
      productId: '550e8400-e29b-41d4-a716-446655440002',
      productNameSnapshot: 'Coffee',
      size: 'M' as const,
      sizePercentSnapshot: 120,
      basePriceSnapshotVnd: 45000n,
      quantity: 2,
      unitPriceVnd: 59000n,
      lineTotalVnd: 118000n,
      toppings: [
        {
          toppingId,
          toppingNameSnapshot: 'Pearl',
          toppingPriceSnapshotVnd: 5000n,
        },
      ],
    },
  ],
  payments: [
    {
      id: failedPaymentId,
      status: 'FAILED' as const,
      method: 'CARD' as const,
      methodLast4: '1234',
      amountVnd: 98000n,
      mockReference: `MOCK-${failedPaymentId}`,
      responseSnapshot: paymentSnapshot(failedPaymentId, 'FAILED'),
      createdAt: new Date('2026-10-25T02:01:00.000Z'),
    },
    {
      id: successPaymentId,
      status: 'SUCCESS' as const,
      method: 'CARD' as const,
      methodLast4: '1234',
      amountVnd: 98000n,
      mockReference: `MOCK-${successPaymentId}`,
      responseSnapshot: paymentSnapshot(successPaymentId, 'SUCCESS'),
      createdAt: paymentAt,
    },
  ],
};

describe('GET /orders/me', () => {
  let app: INestApplication<App>;
  let token: string;
  const prisma = {
    order: { count: vi.fn(), findMany: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.order.count.mockResolvedValue(0);
    prisma.order.findMany.mockResolvedValue([]);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
    token = new JwtService({ secret: getJwtSecret() }).sign(
      { sub: userId },
      { expiresIn: 3600 },
    );
  });

  afterEach(async () => {
    await app?.close();
  });

  const get = (query = '') =>
    request(app.getHttpServer())
      .get(`/orders/me${query}`)
      .auth(token, { type: 'bearer' });

  it('requires JWT before querying orders', async () => {
    await request(app.getHttpServer()).get('/orders/me').expect(401);
    expect(prisma.order.count).not.toHaveBeenCalled();
  });

  it('filters with the verified JWT owner and returns only public snapshots', async () => {
    prisma.order.count.mockResolvedValue(1);
    prisma.order.findMany.mockResolvedValue([order]);

    const { body } = await get().expect(200);

    expect(prisma.order.count).toHaveBeenCalledWith({ where: { userId } });
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(body).toEqual({
      items: [
        expect.objectContaining({
          id: orderId,
          status: 'PAID',
          createdAt: createdAt.toISOString(),
          expiresAt: '2026-10-25T02:05:00.000Z',
          totalVnd: 98000,
          items: [
            expect.objectContaining({
              productName: 'Coffee',
              basePriceVnd: 45000,
              toppings: [{ id: toppingId, name: 'Pearl', priceVnd: 5000 }],
            }),
          ],
          payment: expect.objectContaining({
            id: successPaymentId,
            status: 'SUCCESS',
            failureReason: null,
          }),
        }),
      ],
      meta: { page: null, limit: null, total: 1, totalPages: null },
    });
    expect(JSON.stringify(body)).not.toContain('responseSnapshot');
    expect(JSON.stringify(body)).not.toContain('idempotencyKey');
  });

  it('applies both pagination fields and returns empty items beyond the last page', async () => {
    prisma.order.count.mockResolvedValue(2);
    prisma.order.findMany.mockResolvedValue([order]);

    await get('?page=2&limit=1').expect(200);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 }),
    );

    prisma.order.count.mockResolvedValue(1);
    prisma.order.findMany.mockClear();
    const { body } = await get('?page=2&limit=1').expect(200);
    expect(body).toEqual({
      items: [],
      meta: { page: 2, limit: 1, total: 1, totalPages: 1 },
    });
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it.each(['?page=1', '?limit=10', '?page=1.5&limit=10', '?page=1&limit=101'])
  ('rejects invalid pagination query %s', async (query) => {
    const { body } = await get(query).expect(400);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(prisma.order.count).not.toHaveBeenCalled();
  });

  it('does not accept a userId query parameter as an ownership override', async () => {
    await get(`?userId=${otherUserId}`).expect(200);
    expect(prisma.order.count).toHaveBeenCalledWith({ where: { userId } });
  });
});
