import { createHash, randomUUID } from 'node:crypto';
import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { calculateLoyaltyPoints } from '../promotions/promotion-policy.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { CreatePaymentDto } from './dto/create-payment.dto.js';
import type { PaymentResponseDto } from './dto/payment-response.dto.js';
import { PaymentProcessor } from './payment-processor.js';
import { MockPaymentService } from './mock-payment.service.js';
import {
  CreatePaymentPipe,
  IdempotencyKeyPipe,
} from './payment-validation.pipe.js';
import { readPaymentSnapshot } from './payment-snapshot.js';

type Result = { response: PaymentResponseDto; replayed: boolean };
type Tx = Prisma.TransactionClient;
const conflict = (code: string, message: string) =>
  new ConflictException({ statusCode: 409, message, error: 'Conflict', code });
const notFound = () =>
  new NotFoundException({
    statusCode: 404,
    message: 'Order not found',
    error: 'Not Found',
    code: 'NOT_FOUND',
  });
const transition = () =>
  conflict('INVALID_TRANSITION', 'Order cannot accept a new payment');
const inProgress = () =>
  conflict(
    'PAYMENT_IN_PROGRESS',
    'Payment is being processed; retry with the same key',
  );

function sqlState(error: unknown, depth = 0): string | undefined {
  if (!error || typeof error !== 'object' || depth > 5) return undefined;
  const value = error as Record<string, unknown>;
  // Prisma 7 driver adapters can nest PostgreSQL codes inside driverAdapterError.cause.
  for (const code of [value.code, value.originalCode]) {
    if (code === '55P03' || code === '40P01' || code === '40001') return code;
  }
  for (const child of [value.meta, value.driverAdapterError, value.cause]) {
    const state = sqlState(child, depth + 1);
    if (state) return state;
  }
  return undefined;
}

@Injectable()
export class PaymentsService extends PaymentProcessor {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MockPaymentService) private readonly mock: MockPaymentService,
    @Inject(CreatePaymentPipe) private readonly bodyPipe: CreatePaymentPipe,
    @Inject(IdempotencyKeyPipe) private readonly keyPipe: IdempotencyKeyPipe,
  ) {
    super();
  }

  async execute(
    authenticatedUserId: string,
    key: string,
    input: CreatePaymentDto,
  ): Promise<Result> {
    // PostgreSQL UUID equality is case-insensitive; the key lock must use the same identity.
    const userId = authenticatedUserId.toLowerCase();
    const dto = this.bodyPipe.transform(input);
    const idempotencyKey = this.keyPipe.transform(key);
    // Only accepted fields enter the hash; no raw credential is persisted or logged.
    const requestHash = createHash('sha256')
      .update(JSON.stringify(dto))
      .digest('hex');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Ownership precedes all key information, including replay/conflict/busy.
            if (
              !(await tx.order.findFirst({
                where: { id: dto.orderId, userId },
                select: { id: true },
              }))
            )
              throw notFound();
            // Completed snapshots are immutable: replay does not need a processing lock.
            // Ownership and validation still run first, including for expired/paid Orders.
            const completed = await this.replay(
              tx,
              userId,
              idempotencyKey,
              requestHash,
            );
            if (completed) return completed;
            const [lock] = await tx.$queryRaw<{ acquired: boolean }[]>`
            SELECT pg_try_advisory_xact_lock(hashtextextended(${JSON.stringify([userId, idempotencyKey])}, 0)) AS acquired`;
            // Zero wait on a busy key is bounded; callers retry the exact same key.
            if (!lock?.acquired) {
              // A competing writer may have committed between the first read and try-lock.
              const committed = await this.replay(
                tx,
                userId,
                idempotencyKey,
                requestHash,
              );
              if (committed) return committed;
              throw inProgress();
            }
            const replay = await this.replay(
              tx,
              userId,
              idempotencyKey,
              requestHash,
            );
            if (replay) return replay;
            // Bound contention with Scheduler and other keys on the same Order.
            await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
            const locked = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM orders WHERE id = ${dto.orderId}::uuid AND user_id = ${userId}::uuid FOR UPDATE`;
            if (!locked.length) throw notFound();
            // Required recheck after acquiring the Order lock, before state or expiry rejection.
            const afterLock = await this.replay(
              tx,
              userId,
              idempotencyKey,
              requestHash,
            );
            if (afterLock) return afterLock;
            const order = await tx.order.findUniqueOrThrow({
              where: { id: dto.orderId },
              select: {
                id: true,
                userId: true,
                status: true,
                totalVnd: true,
                couponId: true,
                pointsEarned: true,
              },
            });
            const [clock] = await tx.$queryRaw<
              { now: Date; expired: boolean }[]
            >`
            SELECT clock_timestamp() AS now, expires_at <= clock_timestamp() AS expired FROM orders WHERE id = ${dto.orderId}::uuid`;
            if (
              !clock ||
              clock.expired ||
              !['PENDING', 'PAYMENT_FAILED'].includes(order.status)
            )
              throw transition();
            if (
              await tx.payment.findFirst({
                where: { orderId: order.id, status: 'SUCCESS' },
                select: { id: true },
              })
            )
              throw transition();
            if (order.pointsEarned !== 0)
              throw new Error('Unexpected pre-payment points');
            const amountVnd = Number(order.totalVnd);
            if (order.totalVnd < 0n || !Number.isSafeInteger(amountVnd))
              throw new Error('Unsafe payment amount');
            const outcome = this.mock.evaluate(dto);
            const success = outcome.paymentStatus === 'SUCCESS';
            const pointsEarned = success
              ? calculateLoyaltyPoints(order.totalVnd)
              : 0;
            const paymentId = randomUUID();
            const response = {
              paymentId,
              orderId: order.id,
              ...outcome,
              orderStatus: success ? 'PAID' : 'PAYMENT_FAILED',
              amountVnd,
              method: dto.method,
              mockReference: `MOCK-${paymentId}`,
              pointsEarned,
              createdAt: clock.now.toISOString(),
            } satisfies PaymentResponseDto;
            // Retry's PENDING state never commits separately; it does not reserve inventory again.
            if (order.status === 'PAYMENT_FAILED')
              await tx.order.update({
                where: { id: order.id },
                data: { status: 'PENDING' },
              });
            if (success)
              await this.applySuccess(
                tx,
                userId,
                order.id,
                order.couponId,
                pointsEarned,
                clock.now,
              );
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: response.orderStatus,
                pointsEarned,
                ...(success ? { paidAt: clock.now } : {}),
              },
            });
            await tx.payment.create({
              data: {
                id: paymentId,
                orderId: order.id,
                userId,
                idempotencyKey,
                requestHash,
                amountVnd: order.totalVnd,
                method: dto.method,
                status: outcome.paymentStatus,
                methodLast4: outcome.methodLast4,
                mockReference: response.mockReference,
                responseSnapshot: { ...response },
                createdAt: clock.now,
              },
            });
            return { response, replayed: false };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
            maxWait: 5000,
            timeout: 8000,
          },
        );
      } catch (error) {
        if (error instanceof HttpException) throw error;
        const state = sqlState(error);
        if (state === '55P03') throw inProgress();
        if (
          (state === '40P01' ||
            state === '40001' ||
            (error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2034')) &&
          attempt < 2
        )
          continue;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          // The transaction has rolled back. Reconcile expected uniqueness races, never a fake FAILED attempt.
          try {
            if (
              !(await this.prisma.order.findFirst({
                where: { id: dto.orderId, userId },
                select: { id: true },
              }))
            )
              throw notFound();
            const existing = await this.replay(
              this.prisma,
              userId,
              idempotencyKey,
              requestHash,
            );
            if (existing) return existing;
            if (
              await this.prisma.payment.findFirst({
                where: { orderId: dto.orderId, status: 'SUCCESS' },
                select: { id: true },
              })
            )
              throw transition();
          } catch (recoveryError) {
            if (recoveryError instanceof HttpException) throw recoveryError;
          }
        }
        // Never log raw request, SQL errors, credentials, hashes or snapshots.
        this.logger.error('Failed to process payment');
        throw new InternalServerErrorException({
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
          code: 'INTERNAL_ERROR',
        });
      }
    }
    throw new Error('Unreachable payment retry state');
  }

  private async replay(
    tx: Tx,
    userId: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<Result | null> {
    const existing = await tx.payment.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      select: {
        id: true,
        orderId: true,
        requestHash: true,
        responseSnapshot: true,
      },
    });
    if (!existing) return null;
    if (existing.requestHash !== requestHash)
      throw conflict(
        'IDEMPOTENCY_KEY_CONFLICT',
        'Idempotency key was used with a different payment request',
      );
    return {
      response: readPaymentSnapshot(
        existing.responseSnapshot,
        existing.id,
        existing.orderId,
      ),
      replayed: true,
    };
  }

  private async applySuccess(
    tx: Tx,
    userId: string,
    orderId: string,
    couponId: string | null,
    points: number,
    now: Date,
  ) {
    // HELD already counts against quota; consuming must not increment activeUsageCount again.
    if (couponId) {
      const consumed = await tx.couponRedemption.updateMany({
        where: { orderId, userId, couponId, status: 'HELD' },
        data: { status: 'CONSUMED', consumedAt: now },
      });
      if (consumed.count !== 1)
        throw new Error('Held coupon reservation is missing');
    }
    if (points > 0) {
      const updated = await tx.user.updateMany({
        where: { id: userId, loyaltyPoints: { lte: 2147483647 - points } },
        data: { loyaltyPoints: { increment: points } },
      });
      if (updated.count !== 1) throw new Error('Unable to award points');
    }
  }
}
