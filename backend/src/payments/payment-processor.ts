import type { CreatePaymentDto } from './dto/create-payment.dto.js';
import type { PaymentResponseDto } from './dto/payment-response.dto.js';

// Integration boundary, not a persistence implementation. No in-memory payment fallback.
export abstract class PaymentProcessor {
  abstract execute(
    userId: string,
    idempotencyKey: string,
    payment: CreatePaymentDto,
  ): Promise<{ response: PaymentResponseDto; replayed: boolean }>;
}
