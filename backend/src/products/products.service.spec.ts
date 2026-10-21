import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  const prisma = {
    product: { findUnique: vi.fn() },
    topping: { findMany: vi.fn() },
  };
  const product = {
    id: 'a1000000-0000-4000-8000-000000000002',
    name: 'Cà phê sữa',
    imageUrl: '/images/product-placeholder.svg',
    basePriceVnd: 35000n,
    stock: 25,
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.topping.findMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries the requested ID and returns an empty toppings array when none exist', async () => {
    const detail = await service.findOne(product.id);

    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: product.id } }),
    );
    expect(detail).toEqual({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      basePriceVnd: 35000,
      isAvailable: true,
      sizes: [
        { size: 'S', multiplierPercent: 100 },
        { size: 'M', multiplierPercent: 120 },
        { size: 'L', multiplierPercent: 140 },
      ],
      toppings: [],
    });
  });

  it('does not query toppings for a missing product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne(product.id)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.topping.findMany).not.toHaveBeenCalled();
  });

  it('preserves zero and the largest safe integer prices', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...product,
      basePriceVnd: 0n,
    });
    prisma.topping.findMany.mockResolvedValue([
      {
        id: 'b2000000-0000-4000-8000-000000000001',
        name: 'Topping',
        priceVnd: BigInt(Number.MAX_SAFE_INTEGER),
      },
    ]);

    const detail = await service.findOne(product.id);

    expect(detail.basePriceVnd).toBe(0);
    expect(detail.toppings[0].priceVnd).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('returns a server error if the shared topping query fails', async () => {
    prisma.topping.findMany.mockRejectedValue(
      new Error('Database unavailable'),
    );

    await expect(service.findOne(product.id)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
