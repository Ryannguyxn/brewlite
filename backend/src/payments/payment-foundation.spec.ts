import { BadRequestException } from '@nestjs/common';
import { MockPaymentService } from './mock-payment.service.js';
import {
  CreatePaymentPipe,
  IdempotencyKeyPipe,
} from './payment-validation.pipe.js';

const orderId = '550e8400-e29b-41d4-a716-446655440010';
const body = {
  orderId,
  method: 'CARD',
  paymentDetails: { cardNumber: '1234567890121234' },
};

describe('Payment validation and mock outcome (v3.0)', () => {
  const pipe = new CreatePaymentPipe();
  const keyPipe = new IdempotencyKeyPipe();
  const mock = new MockPaymentService();

  it.each([
    ['CARD', '1234567890121234', 'SUCCESS'],
    ['CARD', '1234567890120002', 'FAILED'],
    ['CARD', '0000000000000000', 'SUCCESS'],
    ['WALLET', '0912345678', 'SUCCESS'],
    ['WALLET', '0912340000', 'FAILED'],
    ['WALLET', '0912340002', 'SUCCESS'],
  ] as const)(
    'evaluates %s test details deterministically',
    (method, credential, expected) => {
      const request = pipe.transform({
        orderId,
        method,
        paymentDetails:
          method === 'CARD'
            ? { cardNumber: credential }
            : { phoneNumber: credential },
      });
      const result = mock.evaluate(request);
      expect(result).toEqual({
        paymentStatus: expected,
        methodLast4: credential.slice(-4),
        failureReason: expected === 'FAILED' ? 'PAYMENT_DECLINED' : null,
      });
      expect(mock.evaluate(request)).toEqual(result);
      expect(JSON.stringify(result)).not.toContain(credential);
    },
  );

  it.each([
    null,
    [],
    'CARD',
    {},
    { ...body, orderId: 'bad' },
    { ...body, method: 'card' },
    { ...body, method: 'CASH' },
    { ...body, paymentDetails: null },
    { ...body, paymentDetails: [] },
    { ...body, paymentDetails: { cardNumber: 1234567890121234 } },
    { ...body, paymentDetails: { cardNumber: '123456789012123' } },
    { ...body, paymentDetails: { cardNumber: '12345678901212345' } },
    { ...body, paymentDetails: { cardNumber: ' 1234567890121234' } },
    { ...body, paymentDetails: { cardNumber: '123456789012123a' } },
    {
      ...body,
      paymentDetails: { cardNumber: '１２３４５６７８９０１２３４５６' },
    },
    {
      ...body,
      paymentDetails: {
        cardNumber: '1234567890121234',
        phoneNumber: '0912345678',
      },
    },
    { ...body, method: 'WALLET' },
    { ...body, method: 'WALLET', paymentDetails: { phoneNumber: '912345678' } },
    {
      ...body,
      method: 'WALLET',
      paymentDetails: { phoneNumber: '09123456789' },
    },
  ])('rejects malformed bodies without exposing values', (value) => {
    try {
      pipe.transform(value);
      expect.fail('Expected validation failure');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse();
      expect(response).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
      expect(JSON.stringify(response)).not.toContain('1234567890121234');
    }
  });

  it('removes untrusted fields without mutating or coercing the input', () => {
    const input = {
      ...body,
      orderId: orderId.toUpperCase(),
      amount: 1,
      userId: 'attacker',
      status: 'SUCCESS',
      paymentDetails: {
        ...body.paymentDetails,
        amount: 1,
        mockResult: 'SUCCESS',
      },
    };
    expect(pipe.transform(input)).toEqual(body);
    expect(input.paymentDetails).toHaveProperty('amount', 1);
  });

  it.each([undefined, null, [], 12345678, '', 'x'.repeat(7), 'x'.repeat(65)])(
    'rejects a missing, non-string or invalid-length idempotency key',
    (key) => {
      expect(() => keyPipe.transform(key)).toThrow(BadRequestException);
    },
  );
  it.each(['x'.repeat(8), 'x'.repeat(64), 'CaseSensitive-key'])(
    'preserves a valid opaque key',
    (key) => {
      expect(keyPipe.transform(key)).toBe(key);
    },
  );
});
