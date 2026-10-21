import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProductDetailDto } from './dto/product-detail.dto.js';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // TODO: triển khai truy vấn danh sách trong task GET /products.
  findAll() {
    return { items: [], total: 0, page: 1, limit: 0, totalPages: 0 };
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
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Sprint 1 dùng chung danh sách topping cho mọi sản phẩm.
      const toppings = await this.prisma.topping.findMany({
        select: { id: true, name: true, priceVnd: true },
        orderBy: { id: 'asc' },
      });

      return {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        basePriceVnd: this.toPriceNumber(product.basePriceVnd),
        isAvailable: product.stock > 0,
        sizes: [
          { size: 'S', multiplierPercent: 100 },
          { size: 'M', multiplierPercent: 120 },
          { size: 'L', multiplierPercent: 140 },
        ],
        toppings: toppings.map((topping) => ({
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
