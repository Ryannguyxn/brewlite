import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

type UserWrite = { email: string; passwordHash: string; fullName?: string };

describe('POST /auth/register (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = {
    user: {
      create: vi.fn<
        ({ data }: { data: UserWrite }) => Promise<{
          id: string;
          email: string;
          fullName: string | null;
        }>
      >(),
    },
    product: { findMany: vi.fn(), findUnique: vi.fn() },
    topping: { findMany: vi.fn() },
  };
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const valid = {
    email: 'customer@example.com',
    password: 'Password123',
    fullName: 'Nguyen Van A',
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id,
      email: data.email,
      fullName: data.fullName ?? null,
    }));
    prisma.product.findMany.mockResolvedValue([]);
    prisma.product.findUnique.mockResolvedValue(null);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('registers without a token, hashes the password, and returns only public data', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(valid)
      .expect(201)
      .expect({
        id,
        email: valid.email,
        fullName: valid.fullName,
      });
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.passwordHash).not.toBe(valid.password);
    expect(bcrypt.getRounds(data.passwordHash)).toBe(12);
    expect(await bcrypt.compare(valid.password, data.passwordHash)).toBe(true);
    expect(await bcrypt.compare('WrongPassword', data.passwordHash)).toBe(
      false,
    );
    expect(data).not.toHaveProperty('password');
  });

  it('normalizes email and ignores client-controlled internal fields', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...valid,
        email: ' Customer@Example.COM ',
        role: 'ADMIN',
        loyaltyPoints: 999,
        passwordHash: 'attacker-hash',
        id: 'attacker-id',
        accessToken: 'fake',
      })
      .expect(201)
      .expect({ id, email: valid.email, fullName: valid.fullName });
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(Object.keys(data).sort()).toEqual([
      'email',
      'fullName',
      'passwordHash',
    ]);
    expect(await bcrypt.compare(valid.password, data.passwordHash)).toBe(true);
  });

  it('accepts an omitted full name and never returns a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: valid.email, password: valid.password })
      .expect(201);
    expect(response.body).toEqual({ id, email: valid.email, fullName: null });
  });

  it('does not trim or lowercase the password', async () => {
    const password = ' Password123 ';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...valid, password })
      .expect(201);
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(await bcrypt.compare(password, data.passwordHash)).toBe(true);
    expect(await bcrypt.compare(password.trim(), data.passwordHash)).toBe(
      false,
    );
  });

  it.each([
    ['missing email', { password: valid.password }],
    ['invalid email', { ...valid, email: 'not-an-email' }],
    ['non-string email', { ...valid, email: 123 }],
    ['long email', { ...valid, email: 'a'.repeat(245) + '@example.com' }],
    ['missing password', { email: valid.email }],
    ['short password', { ...valid, password: '1234567' }],
    ['non-string password', { ...valid, password: 12345678 }],
    ['null password', { ...valid, password: null }],
    ['non-string full name', { ...valid, fullName: 123 }],
    ['null full name', { ...valid, fullName: null }],
    ['long full name', { ...valid, fullName: 'a'.repeat(256) }],
    ['empty object', {}],
    ['array body', []],
  ])('rejects %s with VALIDATION_ERROR before writing', async (_name, body) => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(body)
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      code: 'VALIDATION_ERROR',
    });
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain(valid.password);
  });

  it.each(['a'.repeat(73), 'é'.repeat(37)])(
    'accepts a long password without a maximum-length validation error',
    async (password) => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...valid, password })
        .expect(201);
      expect(
        await bcrypt.compare(
          password,
          prisma.user.create.mock.calls[0][0].data.passwordHash,
        ),
      ).toBe(true);
    },
  );

  it('accepts a full name at the 255-character boundary', async () => {
    const password = 'é'.repeat(36);
    const fullName = 'a'.repeat(255);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...valid, password, fullName })
      .expect(201);
    expect(
      await bcrypt.compare(
        password,
        prisma.user.create.mock.calls[0][0].data.passwordHash,
      ),
    ).toBe(true);
  });

  it('returns the same 409 when the database reports a duplicate normalized email', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('private SQL', {
        code: 'P2002',
        clientVersion: '7.10.1',
        meta: { target: ['email'] },
      }),
    );
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...valid, email: ' CUSTOMER@example.COM ' })
      .expect(409)
      .expect({
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
        code: 'EMAIL_ALREADY_EXISTS',
      });
  });

  it('sanitizes unexpected database failures', async () => {
    prisma.user.create.mockRejectedValue(
      new Error('private SQL password=secret'),
    );
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(valid)
      .expect(500)
      .expect({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
  });

  it('documents Auth DTOs and all response statuses without JWT security', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('BrewLite').setVersion('2.0').build(),
    );
    const operation = document.paths['/auth/register'].post;
    expect(operation?.tags).toEqual(['Auth']);
    expect(operation?.security ?? []).toEqual([]);
    for (const status of ['201', '400', '409', '500'])
      expect(operation?.responses[status]).toBeDefined();
    expect(document.components?.schemas?.RegisterDto).toMatchObject({
      required: ['email', 'password'],
    });
    expect(document.components?.schemas?.RegisterResponseDto).toMatchObject({
      properties: { fullName: { type: 'string', nullable: true } },
    });
  });

  it('preserves the public Product API and its Sprint 1 error contract', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect({ items: [] });
    await request(app.getHttpServer())
      .get('/products/' + id)
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Product not found',
        error: 'Not Found',
      });
  });
});
