import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentResponseDto } from './dto/payment-response.dto.js';
import { PaymentProcessor } from './payment-processor.js';
import {
  CreatePaymentPipe,
  IdempotencyKeyPipe,
} from './payment-validation.pipe.js';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(PaymentProcessor) private readonly processor: PaymentProcessor,
    @Inject(IdempotencyKeyPipe) private readonly keyPipe: IdempotencyKeyPipe,
  ) {}
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Mock payment for an owned Order',
    description:
      'CARD ending 0002 or WALLET ending 0000 declines; other valid test details succeed. Both return HTTP 200. Retry a timed-out request with the same key.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: { type: 'string', minLength: 8, maxLength: 64 },
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 200,
    type: PaymentResponseDto,
    description: 'SUCCESS or FAILED; immutable stored response on replay',
    headers: {
      'Idempotency-Replayed': {
        description: 'false on first attempt; true for replay',
        schema: { type: 'string', enum: ['false', 'true'] },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED' })
  @ApiResponse({
    status: 404,
    description: 'NOT_FOUND: missing Order or another owner',
  })
  @ApiResponse({
    status: 409,
    description:
      'INVALID_TRANSITION | IDEMPOTENCY_KEY_CONFLICT | PAYMENT_IN_PROGRESS',
  })
  @ApiResponse({ status: 500, description: 'INTERNAL_ERROR' })
  async create(
    @Req() req: Request & { user: AuthenticatedUser },
    @Headers('idempotency-key') key: unknown,
    @Body(CreatePaymentPipe) dto: CreatePaymentDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PaymentResponseDto> {
    const result = await this.processor.execute(
      req.user.userId,
      this.keyPipe.transform(key),
      dto,
    );
    res.setHeader('Idempotency-Replayed', String(result.replayed));
    return result.response;
  }
}
