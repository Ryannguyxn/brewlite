import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const hash = vi.hoisted(() => vi.fn<(password: string) => Promise<string>>());
vi.mock('./password-hash.js', () => ({ hashPassword: hash }));

describe('AuthService.register', () => {
  let service: AuthService;
  const prisma = { user: { create: vi.fn() } };
  const logError = vi.fn();
  const dto = {
    email: 'customer@example.com',
    password: 'Password123',
    fullName: 'Nguyen Van A',
  };
  const user = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: dto.email,
    fullName: dto.fullName,
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(logError);
    hash.mockResolvedValue('argon2id-hash');
    prisma.user.create.mockResolvedValue(user);
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: vi.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  afterEach(() => vi.restoreAllMocks());

  it('hashes the original password and only writes allowed fields', async () => {
    await expect(service.register(dto)).resolves.toEqual(user);
    expect(hash).toHaveBeenCalledWith('Password123');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: dto.email,
        passwordHash: 'argon2id-hash',
        fullName: dto.fullName,
      },
      select: { id: true, email: true, fullName: true },
    });
  });

  it('normalizes the email before writing to the unique column', async () => {
    await service.register({ ...dto, email: ' Customer@Example.COM ' });
    expect(prisma.user.create.mock.calls[0][0].data.email).toBe(dto.email);
  });

  it('does not expose internal fields even if the database mock returns them', async () => {
    prisma.user.create.mockResolvedValue({
      ...user,
      passwordHash: 'private',
      role: 'ADMIN',
      loyaltyPoints: 50,
    });
    await expect(service.register(dto)).resolves.toEqual(user);
  });

  it('supports registration without a full name', async () => {
    prisma.user.create.mockResolvedValue({ ...user, fullName: null });
    await expect(
      service.register({ email: dto.email, password: dto.password }),
    ).resolves.toEqual({ ...user, fullName: null });
  });

  it('maps database uniqueness conflicts to the contract 409', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('private SQL', {
        code: 'P2002',
        clientVersion: '7.10.1',
        meta: { target: ['email'] },
      }),
    );
    const error = await service.register(dto).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({
      statusCode: 409,
      message: 'Email already exists',
      error: 'Conflict',
      code: 'EMAIL_ALREADY_EXISTS',
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it('sanitizes unexpected database failures and logs no private details', async () => {
    prisma.user.create.mockRejectedValue(
      new Error('private SQL password=secret'),
    );
    await expect(service.register(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(logError).toHaveBeenCalledExactlyOnceWith(
      'Failed to register customer',
    );
  });

  it('does not write a user if hashing fails', async () => {
    hash.mockRejectedValue(new Error('Hash failed'));
    await expect(service.register(dto)).rejects.toThrow(
      'Internal server error',
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
