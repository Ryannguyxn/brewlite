import 'reflect-metadata';
import { Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ApiBearerAuth, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { hashPassword } from '../src/auth/password-hash.js';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../src/auth/jwt.strategy.js';
import { getJwtSecret } from '../src/auth/jwt.config.js';

// The production Orders module will import AuthModule and apply the same guard.
// This route exists only inside the test application.
@Controller('test-private')
class ProtectedController {
  @Post()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  readIdentity(@Req() req: { user: AuthenticatedUser }) {
    return req.user;
  }
}

describe('Login and JWT guard (HTTP)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let passwordHash: string;
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const email = 'customer@example.com';
  const password = ' Password123 ';
  const prisma = {
    user: { findUnique: vi.fn(), create: vi.fn() },
    product: { findMany: vi.fn(), findUnique: vi.fn() },
    topping: { findMany: vi.fn() },
  };
  const unauthorized = {
    statusCode: 401,
    message: 'Unauthorized',
    error: 'Unauthorized',
    code: 'UNAUTHORIZED',
  };
  const credentialsError = {
    statusCode: 401,
    message: 'Invalid email or password',
    error: 'Unauthorized',
    code: 'INVALID_CREDENTIALS',
  };

  beforeAll(async () => {
    passwordHash = await hashPassword(password);
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: userId, passwordHash });
    prisma.product.findMany.mockResolvedValue([]);
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProtectedController],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    jwt = module.get(JwtService);
    app = module.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  async function login(body: unknown = { email, password }) {
    return request(app.getHttpServer()).post('/auth/login').send(body);
  }

  it('issues only the contract response with a signed 1-hour JWT and the database UUID', async () => {
    const response = await login({
      email: ' Customer@Example.COM ',
      password,
      userId: 'attacker',
      role: 'ADMIN',
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    const payload = await jwt.verifyAsync(response.body.accessToken);
    expect(payload).toEqual({
      sub: userId,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
    expect(payload.exp - payload.iat).toBe(3600);
    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { email },
      select: { id: true, passwordHash: true },
    });
    await request(app.getHttpServer())
      .post('/test-private')
      .set('Authorization', `Bearer ${response.body.accessToken}`)
      .send({ userId: 'attacker' })
      .expect(200)
      .expect({ userId });
  });

  it('returns the exact same 401 for an unknown email and wrong password', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const unknown = await login();
    const wrong = await login({ email, password: 'WrongPassword' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(credentialsError);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('preserves password whitespace and case', async () => {
    expect((await login({ email, password: password.trim() })).status).toBe(
      401,
    );
    expect(
      (await login({ email, password: password.toLowerCase() })).status,
    ).toBe(401);
    expect((await login()).status).toBe(200);
  });

  it('treats a nonempty short password as credentials, not a registration validation error', async () => {
    const response = await login({ email, password: 'x' });
    expect(response.status).toBe(401);
    expect(response.body).toEqual(credentialsError);
  });

  it('uses the Argon2id behavior for long registered passwords', async () => {
    const longPassword = 'é'.repeat(40);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: userId,
      passwordHash: await hashPassword(longPassword),
    });
    expect((await login({ email, password: longPassword })).status).toBe(200);
  });

  it.each(['a'.repeat(72), 'é'.repeat(36)])(
    'rejects a password that differs only after byte 72',
    async (prefix) => {
      const original = prefix + 'A';
      const different = prefix + 'B';
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        passwordHash: await hashPassword(original),
      });
      expect((await login({ email, password: original })).status).toBe(200);
      const response = await login({ email, password: different });
      expect(response.status).toBe(401);
      expect(response.body).toEqual(credentialsError);
    },
  );

  it.each([
    ['missing email', { password }],
    ['invalid email', { email: 'invalid', password }],
    ['long email', { email: 'a'.repeat(245) + '@example.com', password }],
    ['numeric email', { email: 123, password }],
    ['missing password', { email }],
    ['empty password', { email, password: '' }],
    ['null password', { email, password: null }],
    ['numeric password', { email, password: 123 }],
    ['empty object', {}],
    ['array', []],
  ])('rejects %s with a safe 400 before querying', async (_label, body) => {
    const response = await login(body);
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      message: expect.any(Array),
      error: 'Bad Request',
      code: 'VALIDATION_ERROR',
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain(password);
  });

  it('sanitizes database failures', async () => {
    prisma.user.findUnique.mockRejectedValueOnce(
      new Error('private SQL password=secret'),
    );
    const response = await login();
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  });

  it('supports registering and logging in with the same stored hash', async () => {
    prisma.user.create.mockImplementationOnce(async ({ data }) => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        passwordHash: data.passwordHash,
      });
      return { id: userId, email: data.email, fullName: null };
    });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const response = await login();
    expect(response.status).toBe(200);
    expect((await jwt.verifyAsync(response.body.accessToken)).sub).toBe(userId);
  });

  it.each([
    'missing',
    'malformed',
    'expired',
    'wrong signature',
    'wrong algorithm',
    'missing expiry',
    'missing sub',
    'invalid sub',
    'query token',
  ])('rejects %s tokens with UNAUTHORIZED', async (scenario) => {
    const signer = new JwtService({ secret: getJwtSecret() });
    let token: string | undefined;
    switch (scenario) {
      case 'malformed':
        token = 'not.a.jwt';
        break;
      case 'expired':
        token = await signer.signAsync({ sub: userId }, { expiresIn: -1 });
        break;
      case 'wrong signature':
        token = await signer.signAsync(
          { sub: userId },
          { secret: 'another-secret-at-least-32-bytes-long', expiresIn: 3600 },
        );
        break;
      case 'wrong algorithm':
        token = await signer.signAsync(
          { sub: userId },
          { algorithm: 'HS384', expiresIn: 3600 },
        );
        break;
      case 'missing expiry':
        token = await signer.signAsync({ sub: userId });
        break;
      case 'missing sub':
        token = await signer.signAsync({}, { expiresIn: 3600 });
        break;
      case 'invalid sub':
        token = await signer.signAsync(
          { sub: 'attacker-id' },
          { expiresIn: 3600 },
        );
        break;
      case 'query token':
        token = await signer.signAsync({ sub: userId }, { expiresIn: 3600 });
        break;
    }
    const call = request(app.getHttpServer()).post('/test-private');
    if (scenario === 'query token') call.query({ access_token: token });
    else if (token) call.set('Authorization', `Bearer ${token}`);
    await call.send({ userId }).expect(401).expect(unauthorized);
  });

  it('keeps Products public and documents Login plus Bearer security', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect({ items: [] });
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Test')
        .setVersion('2.0')
        .addBearerAuth()
        .build(),
    );
    const loginOperation = document.paths['/auth/login'].post;
    expect(loginOperation?.security ?? []).toEqual([]);
    for (const status of ['200', '400', '401', '500'])
      expect(loginOperation?.responses[status]).toBeDefined();
    expect(document.components?.securitySchemes?.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(document.paths['/test-private'].post?.security).toEqual([
      { bearer: [] },
    ]);
  });
});
