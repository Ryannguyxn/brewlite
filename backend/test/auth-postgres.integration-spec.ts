import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../src/auth/jwt.strategy.js';

@Controller('integration-identity')
class IdentityController {
  @Post()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  identity(@Req() req: { user: AuthenticatedUser }) {
    return req.user;
  }
}

describe('Register → Login → Guard with a PostgreSQL datasource', () => {
  let app: INestApplication<App> | undefined;
  let prisma: PrismaService | undefined;
  let jwt: JwtService;
  const emails: string[] = [];
  const runId = randomUUID();

  function newEmail() {
    const email = `auth39-${runId}-${emails.length}@example.com`;
    emails.push(email);
    return email;
  }

  beforeAll(async () => {
    const url = process.env.AUTH_TEST_DATABASE_URL;
    if (!url)
      throw new Error(
        'Set AUTH_TEST_DATABASE_URL to a migrated test database before running integration tests.',
      );
    vi.stubEnv('DATABASE_URL', url);
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [IdentityController],
    }).compile();
    const prismaService = module.get<PrismaService>(PrismaService);
    prisma = prismaService;
    jwt = module.get(JwtService);
    app = module.createNestApplication({ logger: false });
    await app.init();
    // Fail during setup with the database error if the connection/migrations
    // are missing, rather than reporting misleading API assertions below.
    await prismaService.user.count();
  });

  afterAll(async () => {
    try {
      // Delete only the uniquely named users created by this test run.
      if (prisma && emails.length)
        await prisma.user.deleteMany({ where: { email: { in: emails } } });
    } finally {
      await app?.close();
      vi.unstubAllEnvs();
    }
  });

  function post(path: string, body: object) {
    return request(app!.getHttpServer()).post(path).send(body);
  }

  it('persists an Argon2id hash, signs the database UUID and exposes only the verified identity', async () => {
    const email = newEmail();
    const password = ' Pássword123 ';
    const registered = await post('/auth/register', {
      email: ` ${email.toUpperCase()} `,
      password,
      role: 'ADMIN',
      loyaltyPoints: 999,
    }).expect(201);
    const user = await prisma!.user.findUniqueOrThrow({ where: { email } });
    expect(registered.body).toEqual({ id: user.id, email, fullName: null });
    expect(user.loyaltyPoints).toBe(0);
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(user.passwordHash, password)).toBe(true);
    expect(await argon2.verify(user.passwordHash, password.trim())).toBe(false);
    const login = await post('/auth/login', {
      email: ` ${email.toUpperCase()} `,
      password,
    }).expect(200);
    expect(login.body).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    const payload = await jwt.verifyAsync(login.body.accessToken);
    expect(payload).toEqual({
      sub: user.id,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
    expect(payload.exp - payload.iat).toBe(3600);
    await request(app!.getHttpServer())
      .post('/integration-identity')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ userId: randomUUID() })
      .expect(200)
      .expect({ userId: user.id });
  });

  it('uses the actual unique-email constraint for HTTP 409', async () => {
    const email = newEmail();
    const body = { email, password: '12345678' };
    await post('/auth/register', body).expect(201);
    await post('/auth/register', { ...body, email: ` ${email.toUpperCase()} ` })
      .expect(409)
      .expect({
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    expect(await prisma!.user.count({ where: { email } })).toBe(1);
  });

  it('returns identical credential errors for unknown email and wrong password', async () => {
    const email = newEmail();
    await post('/auth/register', { email, password: 'Password123' }).expect(
      201,
    );
    const wrong = await post('/auth/login', {
      email,
      password: 'WrongPassword',
    }).expect(401);
    const unknown = await post('/auth/login', {
      email: newEmail(),
      password: 'Password123',
    }).expect(401);
    expect(wrong.body).toEqual({
      statusCode: 401,
      message: 'Invalid email or password',
      error: 'Unauthorized',
      code: 'INVALID_CREDENTIALS',
    });
    expect(unknown.body).toEqual(wrong.body);
  });

  it('enforces 7/8-character registration boundaries without a complexity rule', async () => {
    const rejectedEmail = newEmail();
    const invalid = await post('/auth/register', {
      email: rejectedEmail,
      password: '1234567',
    }).expect(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');
    expect(
      await prisma!.user.findUnique({ where: { email: rejectedEmail } }),
    ).toBeNull();
    const email = newEmail();
    await post('/auth/register', { email, password: 'abcdefgh' }).expect(201);
    await post('/auth/login', { email, password: 'abcdefgh' }).expect(200);
  });

  it.each(['a'.repeat(72), 'é'.repeat(36)])(
    'does not authenticate passwords that differ only after byte 72',
    async (prefix) => {
      const email = newEmail();
      const password = prefix + 'A';
      await post('/auth/register', { email, password }).expect(201);
      const user = await prisma!.user.findUniqueOrThrow({ where: { email } });
      expect(await argon2.verify(user.passwordHash, password)).toBe(true);
      expect(await argon2.verify(user.passwordHash, prefix + 'B')).toBe(false);
      await post('/auth/login', { email, password }).expect(200);
      await post('/auth/login', { email, password: prefix + 'B' }).expect(401);
    },
  );
});
