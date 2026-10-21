import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  const productsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('returns the requested product detail', async () => {
    const id = 'a1000000-0000-4000-8000-000000000002';
    const detail = { id, name: 'Cà phê sữa' };
    productsService.findOne.mockResolvedValue(detail);

    await expect(controller.findOne(id)).resolves.toEqual(detail);
    expect(productsService.findOne).toHaveBeenCalledWith(id);
  });
});
