import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PaymentsModule } from '../src/payments/payments.module.js';
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
const execute = vi.fn();

// Test double only. No Payment persistence or replay implementation is claimed here.
@Injectable()
class TestProcessor extends PaymentProcessor {
  execute = execute;
}

describe('Payments HTTP foundation, processor stub (not database integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    execute
      .mockReset()
      .mockResolvedValue({ response: snapshot, replayed: false });
    const module = await Test.createTestingModule({
      imports: [PaymentsModule.withProcessor(TestProcessor)],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
    token = await module.get(JwtService).signAsync({ sub: userId });
  });
  afterEach(async () => {
    await app?.close();
  });

  function post(value: object = body, key: string = 'payment-key-001') {
    return request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send(value);
  }

  it('uses verified identity, sanitized request and safe processor response', async () => {
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
  it('sets the replay header from the processor result', async () => {
    execute.mockResolvedValue({ response: snapshot, replayed: true });
    await post()
      .expect(200)
      .expect('Idempotency-Replayed', 'true')
      .expect(snapshot);
  });
  it('keeps mock declines as HTTP 200', async () => {
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
  it.each([undefined, 'Bearer invalid-token'])(
    'rejects invalid authentication before processor execution',
    async (auth) => {
      const call = request(app.getHttpServer()).post('/payments').send(body);
      if (auth) call.set('Authorization', auth);
      const response = await call.expect(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each([
    [],
    {},
    { ...body, paymentDetails: { cardNumber: 'bad' } },
    { ...body, method: 'WALLET' },
  ])(
    'rejects malformed HTTP bodies before processor execution',
    async (value) => {
      const response = await post(value).expect(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it('requires the idempotency header', async () => {
    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(execute).not.toHaveBeenCalled();
  });
  it.each(['1234567', 'x'.repeat(65)])(
    'rejects invalid key lengths',
    async (key) => {
      await post(body, key).expect(400);
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it('documents v3.0 security, required header, response and statuses', () => {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const operation = doc.paths['/payments'].post!;
    expect(operation.security).toEqual([{ bearer: [] }]);
    expect(operation.parameters).toContainEqual(
      expect.objectContaining({
        in: 'header',
        name: 'Idempotency-Key',
        required: true,
      }),
    );
    expect(Object.keys(operation.responses).sort()).toEqual([
      '200',
      '400',
      '401',
      '404',
      '409',
      '500',
    ]);
    expect(doc.components?.schemas?.PaymentResponseDto).toBeDefined();
    expect(doc.components?.schemas?.CardPaymentDetailsDto).toBeDefined();
    expect(doc.components?.schemas?.WalletPaymentDetailsDto).toBeDefined();
  });
});
