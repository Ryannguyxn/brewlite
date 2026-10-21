import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ProductsService', () => {
  let service: ProductsService;

  const prisma = {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    topping: {
      findMany: vi.fn(),
    },
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
    prisma.product.findMany.mockResolvedValue([]);
    prisma.topping.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
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
      expect.objectContaining({
        where: { id: product.id },
      }),
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

  describe('findAll', () => {
    it('returns an empty items array', async () => {
      await expect(service.findAll()).resolves.toEqual({
        items: [],
      });
    });

    it('queries all products in stable order and returns only public fields', async () => {
      prisma.product.findMany.mockResolvedValue([
        product,
        {
          ...product,
          id: 'a1000000-0000-4000-8000-000000000003',
          stock: 0,
        },
      ]);

      const result = await service.findAll();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          imageUrl: true,
          basePriceVnd: true,
          stock: true,
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });

      expect(result).toEqual({
        items: [
          {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            basePriceVnd: 35000,
            isAvailable: true,
          },
          {
            id: 'a1000000-0000-4000-8000-000000000003',
            name: product.name,
            imageUrl: product.imageUrl,
            basePriceVnd: 35000,
            isAvailable: false,
          },
        ],
      });

      expect(prisma.topping.findMany).not.toHaveBeenCalled();
    });

    it.each([0n, BigInt(Number.MAX_SAFE_INTEGER)])(
      'preserves valid price %s',
      async (price) => {
        prisma.product.findMany.mockResolvedValue([
          {
            ...product,
            basePriceVnd: price,
          },
        ]);

        const result = await service.findAll();

        expect(result.items[0].basePriceVnd).toBe(Number(price));
      },
    );

    it.each([-1n, BigInt(Number.MAX_SAFE_INTEGER) + 1n])(
      'rejects invalid price %s',
      async (price) => {
        prisma.product.findMany.mockResolvedValue([
          {
            ...product,
            basePriceVnd: price,
          },
        ]);

        await expect(service.findAll()).rejects.toThrow(
          InternalServerErrorException,
        );
      },
    );

    it('does not disguise a database error as an empty list', async () => {
      prisma.product.findMany.mockRejectedValue(
        new Error('private database details'),
      );

      await expect(service.findAll()).rejects.toThrow(
        'Internal server error',
      );

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Failed to retrieve product list',
      );
    });
  });
});