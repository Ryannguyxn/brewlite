import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const productId = 'a1000000-0000-4000-8000-000000000002';
const missingProductId = 'a1000000-0000-4000-8000-000000000999';

const product = {
  id: productId,
  name: 'Cà phê sữa',
  imageUrl: '/images/product-placeholder.svg',
  basePriceVnd: 35000n,
  stock: 25,
  createdAt: new Date('2026-10-20T00:00:00.000Z'),
};

const topping = {
  id: 'b2000000-0000-4000-8000-000000000001',
  code: 'PEARL',
  name: 'Trân châu',
  priceVnd: 5000n,
};

const expectedProduct = {
  id: productId,
  name: 'Cà phê sữa',
  imageUrl: '/images/product-placeholder.svg',
  basePriceVnd: 35000,
  isAvailable: true,
  sizes: [
    { size: 'S', multiplierPercent: 100 },
    { size: 'M', multiplierPercent: 120 },
    { size: 'L', multiplierPercent: 140 },
  ],
  toppings: [
    {
      id: 'b2000000-0000-4000-8000-000000000001',
      name: 'Trân châu',
      priceVnd: 5000,
    },
  ],
};

const internalServerError = {
  statusCode: 500,
  message: 'Internal server error',
  error: 'Internal Server Error',
};

describe('GET /products/:id (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = {
    product: { findUnique: vi.fn() },
    topping: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    prisma.product.findUnique.mockReset().mockResolvedValue({ ...product });
    prisma.topping.findMany.mockReset().mockResolvedValue([{ ...topping }]);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('returns public product details with numeric prices and no private fields', async () => {
    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200)
      .expect(expectedProduct);
  });

  it('returns out-of-stock products with isAvailable false', async () => {
    prisma.product.findUnique.mockResolvedValue({ ...product, stock: 0 });

    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200)
      .expect({ ...expectedProduct, isAvailable: false });
  });

  it('returns an empty topping array when no toppings exist', async () => {
    prisma.topping.findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200)
      .expect({ ...expectedProduct, toppings: [] });
  });

  it('rejects an invalid UUID before calling the database', async () => {
    await request(app.getHttpServer())
      .get('/products/not-a-uuid')
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      });

    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(prisma.topping.findMany).not.toHaveBeenCalled();
  });

  it('returns the contract 404 when a valid UUID does not exist', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get(`/products/${missingProductId}`)
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Product not found',
        error: 'Not Found',
      });
  });

  it('accepts a valid UUID version other than v4', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/products/0192a7c1-0000-7000-8000-000000000001')
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'Product not found',
        error: 'Not Found',
      });

    expect(prisma.product.findUnique).toHaveBeenCalledOnce();
  });

  it.each(['product', 'topping'] as const)(
    'returns a safe 500 body when the %s query fails',
    async (query) => {
      const error = new Error('Private database connection details');
      if (query === 'product') {
        prisma.product.findUnique.mockRejectedValue(error);
      } else {
        prisma.topping.findMany.mockRejectedValue(error);
      }

      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(500)
        .expect(internalServerError);
    },
  );

  it.each(['product', 'topping'] as const)(
    'returns 500 instead of an imprecise %s price',
    async (source) => {
      const unsafePrice = 9007199254740993n;
      if (source === 'product') {
        prisma.product.findUnique.mockResolvedValue({
          ...product,
          basePriceVnd: unsafePrice,
        });
      } else {
        prisma.topping.findMany.mockResolvedValue([
          { ...topping, priceVnd: unsafePrice },
        ]);
      }

      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(500)
        .expect(internalServerError);
    },
  );

  it('preserves prices at the maximum safe integer boundary', async () => {
    const maximumSafePrice = BigInt(Number.MAX_SAFE_INTEGER);
    prisma.product.findUnique.mockResolvedValue({
      ...product,
      basePriceVnd: maximumSafePrice,
    });
    prisma.topping.findMany.mockResolvedValue([
      { ...topping, priceVnd: maximumSafePrice },
    ]);

    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200)
      .expect({
        ...expectedProduct,
        basePriceVnd: Number.MAX_SAFE_INTEGER,
        toppings: [
          {
            ...expectedProduct.toppings[0],
            priceVnd: Number.MAX_SAFE_INTEGER,
          },
        ],
      });
  });
});
