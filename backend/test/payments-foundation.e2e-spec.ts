import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PaymentProcessor } from '../src/payments/payment-processor.js';
const userId = '550e8400-e29b-41d4-a716-446655440000';
const orderId = '550e8400-e29b-41d4-a716-446655440010';
const body = {
  orderId,
  method: 'CARD',
  paymentDetails: { cardNumber: '1234567890121234' },
};
const snapshot = {
  paymentId: '550e8400-e29b-41d4-a716-446655440020',
  orderId,
  paymentStatus: 'SUCCESS',
  orderStatus: 'PAID',
  amountVnd: 98000,
  method: 'CARD',
  methodLast4: '1234',
  mockReference: 'MOCK-test',
  pointsEarned: 9,
  failureReason: null,
  createdAt: '2026-10-25T02:00:00.000Z',
};
describe('Payments HTTP/JWT/Swagger with processor double', () => {
  let app: INestApplication<App>;
  let token: string;
  const execute = vi.fn();
  beforeEach(async () => {
    execute
      .mockReset()
      .mockResolvedValue({ response: snapshot, replayed: false });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(PaymentProcessor)
      .useValue({ execute })
      .compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
    token = await module.get(JwtService).signAsync({ sub: userId });
  });
  afterEach(async () => {
    await app?.close();
  });
  function post(value: object = body, key = 'payment-key-001') {
    return request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send(value);
  }
  it('registers the route in AppModule and uses verified identity and whitelisted request', async () => {
    await post({ ...body, userId: 'attacker', amount: 1, status: 'SUCCESS' })
      .expect(200)
      .expect('Idempotency-Replayed', 'false')
      .expect(snapshot);
    expect(execute).toHaveBeenCalledExactlyOnceWith(
      userId,
      'payment-key-001',
      body,
    );
  });
  it('sets replay header from processor', async () => {
    execute.mockResolvedValue({ response: snapshot, replayed: true });
    await post()
      .expect(200)
      .expect('Idempotency-Replayed', 'true')
      .expect(snapshot);
  });
  it('returns mock decline as HTTP 200', async () => {
    const failed = {
      ...snapshot,
      paymentStatus: 'FAILED',
      orderStatus: 'PAYMENT_FAILED',
      pointsEarned: 0,
      failureReason: 'PAYMENT_DECLINED',
    };
    execute.mockResolvedValue({ response: failed, replayed: false });
    await post().expect(200).expect(failed);
  });
  it.each([undefined, 'Bearer invalid'])(
    'rejects invalid authentication',
    async (auth) => {
      const call = request(app.getHttpServer()).post('/payments').send(body);
      if (auth) call.set('Authorization', auth);
      const r = await call.expect(401);
      expect(r.body.code).toBe('UNAUTHORIZED');
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each([
    [],
    {},
    { ...body, paymentDetails: { cardNumber: 'bad' } },
    { ...body, method: 'WALLET' },
  ])('rejects bad HTTP bodies', async (value) => {
    const r = await post(value).expect(400);
    expect(r.body.code).toBe('VALIDATION_ERROR');
    expect(execute).not.toHaveBeenCalled();
  });
  it('requires the key header', async () => {
    const r = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(400);
    expect(r.body.code).toBe('VALIDATION_ERROR');
    expect(execute).not.toHaveBeenCalled();
  });
  it.each(['1234567', 'x'.repeat(65)])(
    'rejects invalid key lengths',
    async (key) => {
      await post(body, key).expect(400);
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it('documents authentication, key, DTOs, replay header and all statuses', () => {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const op = doc.paths['/payments'].post!;
    expect(op.security).toEqual([{ bearer: [] }]);
    expect(op.parameters).toContainEqual(
      expect.objectContaining({
        in: 'header',
        name: 'Idempotency-Key',
        required: true,
      }),
    );
    expect(Object.keys(op.responses).sort()).toEqual([
      '200',
      '400',
      '401',
      '404',
      '409',
      '500',
    ]);
    expect(op.responses['200']).toHaveProperty('headers.Idempotency-Replayed');
    for (const schema of [
      'PaymentResponseDto',
      'CardPaymentDetailsDto',
      'WalletPaymentDetailsDto',
    ])
      expect(doc.components?.schemas?.[schema]).toBeDefined();
  });
});
