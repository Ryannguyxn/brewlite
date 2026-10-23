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
  const loggerError = vi.fn();

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
    description: 'Cà phê sữa pha phin truyền thống',
    rating: null,
    isNew: false,
    isBestseller: false,
    sizePolicy: 'STANDARD',
    productToppings: [],
    category: {
      code: 'traditional',
      name: 'Cà phê truyền thống',
      isActive: true,
    },
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(loggerError);

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

  it('returns STANDARD product detail with v2.1 public fields and no toppings', async () => {
    const detail = await service.findOne(product.id);

    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: product.id },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        basePriceVnd: true,
        stock: true,
        description: true,
        rating: true,
        isNew: true,
        isBestseller: true,
        sizePolicy: true,
        category: {
          select: {
            code: true,
            name: true,
            isActive: true,
          },
        },
        productToppings: {
          where: {
            topping: {
              isAvailable: true,
            },
          },
          select: {
            topping: {
              select: {
                id: true,
                name: true,
                priceVnd: true,
              },
            },
          },
          orderBy: {
            toppingId: 'asc',
          },
        },
      },
    });

    expect(detail).toEqual({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      basePriceVnd: 35000,
      isAvailable: true,
      category: {
        code: 'traditional',
        name: 'Cà phê truyền thống',
      },
      description: product.description,
      rating: null,
      isNew: false,
      isBestseller: false,
      sizePolicy: 'STANDARD',
      sizes: [
        { size: 'S', multiplierPercent: 100 },
        { size: 'M', multiplierPercent: 120 },
        { size: 'L', multiplierPercent: 140 },
      ],
      toppings: [],
    });

    expect(prisma.topping.findMany).not.toHaveBeenCalled();
  });

  it('returns only ONE_SIZE for a ONE_SIZE product', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...product,
      sizePolicy: 'ONE_SIZE',
    });

    const detail = await service.findOne(product.id);

    expect(detail.sizePolicy).toBe('ONE_SIZE');

    expect(detail.sizes).toEqual([
      {
        size: 'ONE_SIZE',
        multiplierPercent: 100,
      },
    ]);

    expect(detail.sizes).toHaveLength(1);
  });

  it('returns unavailable product detail when category is inactive', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...product,
      stock: 25,
      category: {
        ...product.category,
        isActive: false,
      },
    });

    const detail = await service.findOne(product.id);

    expect(detail.id).toBe(product.id);
    expect(detail.isAvailable).toBe(false);

    expect(detail.category).toEqual({
      code: 'traditional',
      name: 'Cà phê truyền thống',
    });

    expect(detail.sizePolicy).toBe('STANDARD');
    expect(detail.sizes).toHaveLength(3);
    expect(detail.toppings).toEqual([]);

    expect(detail.category).not.toHaveProperty('isActive');
  });

  it('returns only linked and available toppings', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...product,
      productToppings: [
        {
          topping: {
            id: 'b2000000-0000-4000-8000-000000000001',
            name: 'Trân châu',
            priceVnd: 5000n,
          },
        },
        {
          topping: {
            id: 'b2000000-0000-4000-8000-000000000002',
            name: 'Thạch cà phê',
            priceVnd: 7000n,
          },
        },
      ],
    });

    const detail = await service.findOne(product.id);

    expect(detail.toppings).toEqual([
      {
        id: 'b2000000-0000-4000-8000-000000000001',
        name: 'Trân châu',
        priceVnd: 5000,
      },
      {
        id: 'b2000000-0000-4000-8000-000000000002',
        name: 'Thạch cà phê',
        priceVnd: 7000,
      },
    ]);

    expect(prisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          productToppings: expect.objectContaining({
            where: {
              topping: {
                isAvailable: true,
              },
            },
          }),
        }),
      }),
    );

    expect(prisma.topping.findMany).not.toHaveBeenCalled();
  });

  it('returns product detail rating, description and badges correctly', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...product,
      description: 'Cà phê sữa đậm đà',
      rating: { toString: () => '4.5' },
      isNew: true,
      isBestseller: true,
    });

    const detail = await service.findOne(product.id);

    expect(detail).toEqual(
      expect.objectContaining({
        description: 'Cà phê sữa đậm đà',
        rating: 4.5,
        isNew: true,
        isBestseller: true,
      }),
    );
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
      productToppings: [
        {
          topping: {
            id: 'b2000000-0000-4000-8000-000000000001',
            name: 'Topping',
            priceVnd: BigInt(Number.MAX_SAFE_INTEGER),
          },
        },
      ],
    });

    const detail = await service.findOne(product.id);

    expect(detail.basePriceVnd).toBe(0);
    expect(detail.toppings).toHaveLength(1);
    expect(detail.toppings[0].priceVnd).toBe(
      Number.MAX_SAFE_INTEGER,
    );

    expect(prisma.topping.findMany).not.toHaveBeenCalled();
  });

  it('returns a server error if the product detail query fails', async () => {
    prisma.product.findUnique.mockRejectedValue(
      new Error('Database unavailable'),
    );

    await expect(service.findOne(product.id)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(loggerError).toHaveBeenCalledWith(
      'Failed to retrieve product detail (Error)',
    );

    expect(prisma.topping.findMany).not.toHaveBeenCalled();
  });

  describe('findAll', () => {
    it('returns an empty items array', async () => {
      await expect(service.findAll()).resolves.toEqual({
        items: [],
      });
    });

    it('queries products in stable order and returns v2.1 public fields', async () => {
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
          description: true,
          rating: true,
          isNew: true,
          isBestseller: true,
          category: {
            select: {
              code: true,
              name: true,
              isActive: true,
            },
          },
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
            category: {
              code: 'traditional',
              name: 'Cà phê truyền thống',
            },
            description: product.description,
            rating: null,
            isNew: false,
            isBestseller: false,
          },
          {
            id: 'a1000000-0000-4000-8000-000000000003',
            name: product.name,
            imageUrl: product.imageUrl,
            basePriceVnd: 35000,
            isAvailable: false,
            category: {
              code: 'traditional',
              name: 'Cà phê truyền thống',
            },
            description: product.description,
            rating: null,
            isNew: false,
            isBestseller: false,
          },
        ],
      });

      expect(prisma.topping.findMany).not.toHaveBeenCalled();
    });

    it('keeps products from inactive categories but marks them unavailable', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          ...product,
          stock: 25,
          category: {
            ...product.category,
            isActive: false,
          },
        },
      ]);

      const result = await service.findAll();

      expect(result.items).toHaveLength(1);

      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: product.id,
          isAvailable: false,
          category: {
            code: 'traditional',
            name: 'Cà phê truyền thống',
          },
        }),
      );
    });

    it('returns product description, rating and badges correctly', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          ...product,
          description: 'Cà phê sữa đậm đà, pha phin truyền thống',
          rating: { toString: () => '4.5' },
          isNew: true,
          isBestseller: true,
        },
      ]);

      const result = await service.findAll();

      expect(result.items).toHaveLength(1);

      expect(result.items[0]).toEqual(
        expect.objectContaining({
          description: 'Cà phê sữa đậm đà, pha phin truyền thống',
          rating: 4.5,
          isNew: true,
          isBestseller: true,
        }),
      );
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

      expect(loggerError).toHaveBeenCalledWith(
        'Failed to retrieve product list',
      );
    });
  });
});
