import { ApiProperty } from '@nestjs/swagger';
import { ProductCategoryDto } from './product-category.dto.js';

export class ProductSizeDto {
  @ApiProperty({
    type: String,
    enum: ['S', 'M', 'L', 'ONE_SIZE'],
    example: 'S',
  })
  size!: 'S' | 'M' | 'L' | 'ONE_SIZE';

  @ApiProperty({
    type: Number,
    enum: [100, 120, 140],
    example: 100,
  })
  multiplierPercent!: number;
}

export class ProductToppingDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, example: 'Trân châu' })
  name!: string;

  @ApiProperty({ type: Number, example: 5000 })
  priceVnd!: number;
}

export class ProductDetailDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, example: 'Cà phê sữa' })
  name!: string;

  @ApiProperty({ type: String, example: '/images/product-placeholder.svg' })
  imageUrl!: string;

  @ApiProperty({
    type: Number,
    example: 35000,
    description: 'Giá cơ bản, đơn vị VND',
  })
  basePriceVnd!: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Khả dụng khi stock > 0 và Category active',
  })
  isAvailable!: boolean;

  @ApiProperty({ type: () => ProductCategoryDto })
  category!: ProductCategoryDto;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    maximum: 5,
  })
  rating!: number | null;

  @ApiProperty({ type: Boolean, example: false })
  isNew!: boolean;

  @ApiProperty({ type: Boolean, example: false })
  isBestseller!: boolean;

  @ApiProperty({
    enum: ['STANDARD', 'ONE_SIZE'],
    example: 'STANDARD',
  })
  sizePolicy!: 'STANDARD' | 'ONE_SIZE';

  @ApiProperty({ type: [ProductSizeDto] })
  sizes!: ProductSizeDto[];

  @ApiProperty({ type: [ProductToppingDto] })
  toppings!: ProductToppingDto[];
}
