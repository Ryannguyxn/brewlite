import { ApiProperty } from '@nestjs/swagger';

export class ProductSizeDto {
  @ApiProperty({ type: String, enum: ['S', 'M', 'L'], example: 'S' })
  size!: 'S' | 'M' | 'L';

  @ApiProperty({ type: Number, enum: [100, 120, 140], example: 100 })
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

  @ApiProperty({ type: Number, example: 35000 })
  basePriceVnd!: number;

  @ApiProperty({ type: Boolean, example: true })
  isAvailable!: boolean;

  @ApiProperty({ type: [ProductSizeDto] })
  sizes!: ProductSizeDto[];

  @ApiProperty({ type: [ProductToppingDto] })
  toppings!: ProductToppingDto[];
}
