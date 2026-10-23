import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import request from 'supertest';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../app.module.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('GET /products HTTP', () => {
  let app: INestApplication;

  const prisma = {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    topping: {
      findMany: vi.fn(),
    },
  };

  const row = {
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
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    prisma.product.findMany.mockResolvedValue([]);
    prisma.product.findUnique.mockResolvedValue(row);
    prisma.topping.findMany.mockResolvedValue([]);

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }

    vi.restoreAllMocks();
  });

  it('returns 200 without authentication for an empty database', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect({ items: [] });
  });

  it('returns the exact public contract and serializes bigint prices', async () => {
    prisma.product.findMany.mockResolvedValue([
      row,
      {
        ...row,
        id: 'a1000000-0000-4000-8000-000000000003',
        stock: 0,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(response.body).toEqual({
      items: [
        {
          id: row.id,
          name: row.name,
          imageUrl: row.imageUrl,
          basePriceVnd: 35000,
          isAvailable: true,
          category: {
            code: 'traditional',
            name: 'Cà phê truyền thống',
          },
          description: row.description,
          rating: null,
          isNew: false,
          isBestseller: false,
        },
        {
          id: 'a1000000-0000-4000-8000-000000000003',
          name: row.name,
          imageUrl: row.imageUrl,
          basePriceVnd: 35000,
          isAvailable: false,
          category: {
            code: 'traditional',
            name: 'Cà phê truyền thống',
          },
          description: row.description,
          rating: null,
          isNew: false,
          isBestseller: false,
        },
      ],
    });
  });

  it('returns a sanitized 500 for query failure', async () => {
    prisma.product.findMany.mockRejectedValue(
      new Error('secret database connection'),
    );

    await request(app.getHttpServer())
      .get('/products')
      .expect(500)
      .expect({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
  });

  it('returns 500 for an unsafe monetary value', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        ...row,
        basePriceVnd: BigInt(Number.MAX_SAFE_INTEGER) + 1n,
      },
    ]);

    await request(app.getHttpServer())
      .get('/products')
      .expect(500);
  });

  it('documents listing responses and the items schema in Swagger', () => {
    const config = new DocumentBuilder()
      .setTitle('BrewLite')
      .setVersion('1.0')
      .build();

    const doc = SwaggerModule.createDocument(app, config);

    expect(
      doc.paths['/products'].get?.responses['200'],
    ).toBeDefined();

    expect(
      doc.paths['/products'].get?.responses['500'],
    ).toBeDefined();

    expect(
      doc.components?.schemas?.GetProductsResponseDto,
    ).toMatchObject({
      properties: {
        items: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ProductListItemDto',
          },
        },
      },
    });
  });

  it('keeps the existing product detail route available', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/' + row.id)
      .expect(200);

    expect(response.body.id).toBe(row.id);
    expect(response.body.sizes).toHaveLength(3);
  });
});