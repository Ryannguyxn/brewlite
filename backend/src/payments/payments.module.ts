import { Module } from '@nestjs/common';
import type { DynamicModule, ModuleMetadata, Type } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MockPaymentService } from './mock-payment.service.js';
import { PaymentProcessor } from './payment-processor.js';
import { PaymentsController } from './payments.controller.js';
import {
  CreatePaymentPipe,
  IdempotencyKeyPipe,
} from './payment-validation.pipe.js';

@Module({ providers: [MockPaymentService], exports: [MockPaymentService] })
export class PaymentsModule {
  // Only activate the route once a real transactional processor is implemented.
  static withProcessor(
    implementation: Type<PaymentProcessor>,
    imports: ModuleMetadata['imports'] = [],
  ): DynamicModule {
    return {
      module: PaymentsModule,
      imports: [AuthModule, ...imports],
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentProcessor, useClass: implementation },
        CreatePaymentPipe,
        IdempotencyKeyPipe,
      ],
    };
  }
}
