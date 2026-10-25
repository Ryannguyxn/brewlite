import { BadRequestException, Injectable } from '@nestjs/common';
import type { PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { CreatePaymentDto } from './dto/create-payment.dto.js';

function invalid(message: string): never {
  throw new BadRequestException({
    statusCode: 400,
    message: [message],
    error: 'Bad Request',
    code: 'VALIDATION_ERROR',
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

@Injectable()
export class CreatePaymentPipe implements PipeTransform<
  unknown,
  CreatePaymentDto
> {
  transform(value: unknown): CreatePaymentDto {
    if (!isRecord(value)) invalid('body must be an object');
    if (typeof value.orderId !== 'string' || !isUUID(value.orderId)) {
      invalid('orderId must be a UUID');
    }
    if (value.method !== 'CARD' && value.method !== 'WALLET') {
      invalid('method must be CARD or WALLET');
    }
    const details = value.paymentDetails;
    if (!isRecord(details)) invalid('paymentDetails must be an object');
    const field = value.method === 'CARD' ? 'cardNumber' : 'phoneNumber';
    const other = value.method === 'CARD' ? 'phoneNumber' : 'cardNumber';
    const pattern = value.method === 'CARD' ? /^[0-9]{16}$/ : /^[0-9]{10}$/;
    const credential = details[field];
    if (
      other in details ||
      typeof credential !== 'string' ||
      !pattern.test(credential)
    ) {
      invalid('paymentDetails must match the selected payment method');
    }
    // Reconstruct only accepted fields; never mutate, trim, coerce or trust client state.
    return {
      orderId: value.orderId.toLowerCase(),
      method: value.method,
      paymentDetails:
        value.method === 'CARD'
          ? { cardNumber: credential }
          : { phoneNumber: credential },
    };
  }
}

@Injectable()
export class IdempotencyKeyPipe implements PipeTransform<unknown, string> {
  transform(value: unknown): string {
    if (typeof value !== 'string' || value.length < 8 || value.length > 64) {
      invalid('Idempotency-Key must contain 8 to 64 characters');
    }
    // Treat as an opaque, case-sensitive key. No silent trimming or normalization.
    return value;
  }
}
