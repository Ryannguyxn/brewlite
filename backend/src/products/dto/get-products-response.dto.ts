import { ApiProperty } from '@nestjs/swagger';

export class ProductListItemDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Mã định danh Product (UUID)',
  })
  id!: string;

  @ApiProperty({
    example: 'Cà phê sữa',
    description: 'Tên sản phẩm',
  })
  name!: string;

  @ApiProperty({
    example: '/images/ca-phe-sua.jpg',
    description: 'Đường dẫn ảnh sản phẩm',
  })
  imageUrl!: string;

  @ApiProperty({
    example: 45000,
    description: 'Giá cơ bản (size S), đơn vị VND',
  })
  basePriceVnd!: number;

  @ApiProperty({
    example: true,
    description: 'Trạng thái còn/hết hàng (stock > 0)',
  })
  isAvailable!: boolean;
}

export class GetProductsResponseDto {
  @ApiProperty({ type: [ProductListItemDto] })
  items!: ProductListItemDto[];
}