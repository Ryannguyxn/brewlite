import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  const service = { register: vi.fn() };
  let controller: AuthController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();
    controller = module.get(AuthController);
  });

  it('delegates registration and returns the public response', async () => {
    const dto = { email: 'customer@example.com', password: 'Password123' };
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: dto.email,
      fullName: null,
    };
    service.register.mockResolvedValue(user);
    await expect(controller.register(dto)).resolves.toEqual(user);
    expect(service.register).toHaveBeenCalledExactlyOnceWith(dto);
  });
});
