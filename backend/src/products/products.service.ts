import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProductDetailDto } from './dto/product-detail.dto.js';
import type { GetProductsResponseDto } from './dto/get-products-response.dto.js';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findAll(): Promise<GetProductsResponseDto> {
    try {
      const products = await this.prisma.product.findMany({
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

      return {
        items: products.map((product) => {
          if (product.basePriceVnd < 0n) {
            throw new RangeError('Product price must be non-negative');
          }

          return {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            basePriceVnd: this.toPriceNumber(product.basePriceVnd),
            isAvailable:
              product.stock > 0 && product.category.isActive,
            category: {
              code: product.category.code,
              name: product.category.name,
            },
            description: product.description,
            rating:
              product.rating === null
                ? null
                : Number(product.rating),
            isNew: product.isNew,
            isBestseller: product.isBestseller,
          };
        }),
      };
    } catch {
      this.logger.error('Failed to retrieve product list');
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async findOne(id: string): Promise<ProductDetailDto> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
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

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const sizes: ProductDetailDto['sizes'] =
        product.sizePolicy === 'ONE_SIZE'
          ? [{ size: 'ONE_SIZE', multiplierPercent: 100 }]
          : [
              { size: 'S', multiplierPercent: 100 },
              { size: 'M', multiplierPercent: 120 },
              { size: 'L', multiplierPercent: 140 },
            ];

      return {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        basePriceVnd: this.toPriceNumber(product.basePriceVnd),
        isAvailable: product.stock > 0 && product.category.isActive,
        category: {
          code: product.category.code,
          name: product.category.name,
        },
        description: product.description,
        rating: product.rating === null ? null : Number(product.rating),
        isNew: product.isNew,
        isBestseller: product.isBestseller,
        sizePolicy: product.sizePolicy,
        sizes,
        toppings: product.productToppings.map(({ topping }) => ({
          id: topping.id,
          name: topping.name,
          priceVnd: this.toPriceNumber(topping.priceVnd),
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Không ghi raw database error vì có thể chứa thông tin kết nối.
      this.logger.error(
        `Failed to retrieve product detail (${error instanceof Error ? error.name : 'UnknownError'})`,
      );

      throw new InternalServerErrorException('Internal server error');
    }
  }

  private toPriceNumber(value: bigint): number {
    const price = Number(value);

    if (!Number.isSafeInteger(price)) {
      throw new RangeError('Price exceeds the safe integer range');
    }

    return price;
  }
}
