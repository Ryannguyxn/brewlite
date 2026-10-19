import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
    // TODO: thay bằng truy vấn Prisma khi Thủy xong schema và seed
  findAll() {
    return { items: [], total: 0, page: 1, limit: 0, totalPages: 0 };
  }
}