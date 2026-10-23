import { ApiProperty } from '@nestjs/swagger';
import { ProductCategoryDto } from './product-category.dto.js';

export class ProductListItemDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({ example: 'Cà phê sữa' })
  name!: string;

  @ApiProperty({ example: '/images/ca-phe-sua.jpg' })
  imageUrl!: string;

  @ApiProperty({
    example: 35000,
    description: 'Giá cơ bản của sản phẩm, đơn vị VND',
  })
  basePriceVnd!: number;

  @ApiProperty({
    example: true,
    description:
      'Sản phẩm khả dụng khi stock > 0 và Category đang active',
  })
  isAvailable!: boolean;

  @ApiProperty({ type: () => ProductCategoryDto })
  category!: ProductCategoryDto;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Cà phê pha phin truyền thống',
  })
  description!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    maximum: 5,
    example: 4.5,
  })
  rating!: number | null;

  @ApiProperty({ example: false })
  isNew!: boolean;

  @ApiProperty({ example: false })
  isBestseller!: boolean;
}

export class GetProductsResponseDto {
  @ApiProperty({ type: [ProductListItemDto] })
  items!: ProductListItemDto[];
}