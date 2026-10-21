import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { ProductDetailDto } from './dto/product-detail.dto.js';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly productsService: ProductsService,
  ) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đồ uống, size và topping' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiBadRequestResponse({ description: 'Product ID sai định dạng UUID' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi phía server' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductDetailDto> {
    return this.productsService.findOne(id);
  }
}
