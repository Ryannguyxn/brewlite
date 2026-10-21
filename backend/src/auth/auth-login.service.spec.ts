import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const compare = vi.hoisted(() => vi.fn());
vi.mock('bcrypt', () => ({ compare, hash: vi.fn() }));

describe('AuthService.login', () => {
  let service: AuthService;
  const prisma = { user: { findUnique: vi.fn() } };
  const jwt = { signAsync: vi.fn() };
  const dto = { email: ' Customer@Example.COM ', password: ' Password123 ' };
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const log = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(log);
    prisma.user.findUnique.mockResolvedValue({
      id,
      passwordHash: 'stored-hash',
    });
    compare.mockResolvedValue(true);
    jwt.signAsync.mockResolvedValue('signed-token');
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });
  afterEach(() => vi.restoreAllMocks());

  it('normalizes only email and signs the database user ID', async () => {
    await expect(service.login(dto)).resolves.toEqual({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { email: 'customer@example.com' },
      select: { id: true, passwordHash: true },
    });
    expect(compare).toHaveBeenCalledExactlyOnceWith(
      dto.password,
      'stored-hash',
    );
    expect(jwt.signAsync).toHaveBeenCalledExactlyOnceWith({ sub: id });
  });

  it('compares a dummy hash and refuses an unknown user even if comparison returns true', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(compare).toHaveBeenCalledExactlyOnceWith(
      dto.password,
      expect.stringMatching(/^\$2b\$12\$/),
    );
    expect(jwt.signAsync).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('never signs a token for an incorrect password', async () => {
    compare.mockResolvedValue(false);
    await expect(service.login(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it.each(['lookup', 'compare', 'sign'])(
    'sanitizes a %s failure without logging credentials or raw errors',
    async (stage) => {
      const error = new Error('private SQL / password / JWT secret');
      if (stage === 'lookup') prisma.user.findUnique.mockRejectedValue(error);
      if (stage === 'compare') compare.mockRejectedValue(error);
      if (stage === 'sign') jwt.signAsync.mockRejectedValue(error);
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      expect(log).toHaveBeenCalledExactlyOnceWith('Failed to log in customer');
    },
  );
});
