import { ApiProperty } from '@nestjs/swagger';

export class ProductCategoryDto {
  @ApiProperty({
    example: 'traditional',
    description: 'Mã danh mục sản phẩm',
  })
  code!: string;

  @ApiProperty({
    example: 'Cà phê truyền thống',
    description: 'Tên danh mục sản phẩm',
  })
  name!: string;
}
