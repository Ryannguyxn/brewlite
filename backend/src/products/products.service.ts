import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  findAll() {
    return { items: [], total: 0, page: 1, limit: 0, totalPages: 0 };
  }
}