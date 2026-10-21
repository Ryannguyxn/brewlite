# Hướng dẫn GET /products/:id

API này phục vụ màn hình chi tiết đồ uống. Khi người dùng bấm vào một món,
frontend gửi ID của món đó đến backend và nhận dữ liệu JSON.

## 1. Đọc code theo luồng xử lý

```text
GET /products/<id>
    → ProductsController.findOne(): nhận và kiểm tra ID
    → ProductsService.findOne(): tìm món, lấy topping, chuẩn bị response
    → PrismaService: truy vấn PostgreSQL
    → JSON trả về frontend
```

Các file tính từ thư mục gốc dự án:

| File | Vai trò |
| --- | --- |
| `backend/src/products/products.controller.ts` | `@Controller('products')` kết hợp với `@Get(':id')` tạo đường dẫn `/products/:id`. `ParseUUIDPipe` từ chối ID sai định dạng bằng HTTP 400. |
| `backend/src/products/products.service.ts` | `findUnique({ where: { id } })` tìm một sản phẩm. Không có thì trả 404. Có thì lấy topping chung và trả dữ liệu đúng API Contract. |
| `backend/src/products/dto/product-detail.dto.ts` | Mô tả cấu trúc dữ liệu trả về cho TypeScript và Swagger. DTO không phải bảng database. |
| `backend/src/prisma/prisma.service.ts` | Tạo Prisma Client với PostgreSQL adapter, kết nối khi backend khởi động và ngắt khi đóng ứng dụng. |
| `backend/src/prisma/prisma.module.ts` | Cho phép module khác dùng chung `PrismaService`. |
| `backend/src/products/products.module.ts` | Đăng ký controller, service và import module Prisma để NestJS nối các thành phần. |

`async` / `await` giúp đợi database trả kết quả. `@Inject(...)` cho NestJS biết
service nào cần được truyền vào constructor; controller không phải tự tạo kết nối database.

Quy tắc đã triển khai:

- `isAvailable = stock > 0`; hết hàng vẫn trả 200 với `isAvailable: false`.
- Không công khai `stock`, `createdAt` hay mã nội bộ `code` của topping.
- Size cố định: S = 100%, M = 120%, L = 140%.
- Lấy toàn bộ topping dùng chung từ database; nếu chưa có topping thì trả `[]`.
- Chuyển giá từ `bigint` sang JSON number. Nếu vượt giới hạn số nguyên an toàn,
  trả 500 để tránh gửi giá sai.
- Lỗi truy vấn trả 500 với thông báo chung, không lộ thông tin kết nối database.
- API public, không cần đăng nhập hay request body.

Phần lấy danh sách `GET /products` hiện vẫn là placeholder, thuộc task khác.

## 2. Chuẩn bị database trên máy bạn

Phần này dùng PostgreSQL cục bộ cho phát triển. Nếu chưa có PostgreSQL, cài theo
phiên bản nhóm sử dụng trong `backend/prisma/README.md` và ghi nhớ mật khẩu tài khoản
`postgres`. Nếu đã có thì dùng bản cài hiện tại.

Trong pgAdmin, kết nối server PostgreSQL, mở Query Tool trên database `postgres`
và chạy lệnh sau **chỉ khi chưa có database `brewlite_db`**:

```sql
CREATE DATABASE brewlite_db;
```

Tạo file `backend/.env` theo `.env.example` ở thư mục gốc:

```dotenv
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/brewlite_db?schema=public"
```

Thay `YOUR_PASSWORD` bằng mật khẩu trên máy bạn; đổi username/port nếu bạn cài khác.
Các ký tự đặc biệt trong username/password phải được mã hóa URL, ví dụ `@` thành
`%40`, `#` thành `%23`. Không commit `.env` hoặc đưa mật khẩu vào ảnh chụp.

Mở terminal tại thư mục gốc dự án, chạy lần lượt và kiểm tra mỗi lệnh thành công:

```powershell
cd backend
npm ci
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev
```

Ý nghĩa các lệnh database:

- `db:validate`: kiểm tra định nghĩa bảng trong Prisma schema.
- `db:generate`: sinh Prisma Client để code TypeScript truy vấn được database.
- `db:migrate`: áp dụng migration đã có của nhóm để tạo bảng; không tạo migration mới.
- `db:seed`: nạp 8 đồ uống và 5 topping mẫu. Lệnh này cập nhật lại các bản ghi mẫu
  nếu chúng đã tồn tại, nên dùng với database phát triển của bạn.

Các script truyền `--config prisma7.config.ts` vì dự án dùng tên file cấu hình này.

## 3. Thử API thật

Giữ terminal backend đang chạy. Với cổng mặc định `3001`, mở trong trình duyệt:

```text
http://localhost:3001/products/a1000000-0000-4000-8000-000000000002
```

Đây là ID của **Cà phê sữa** trong seed, giá cơ bản **35.000 VND**. Kết quả có
`isAvailable: true`, ba size và năm topping.

Swagger tại `http://localhost:3001/api-docs`: mở nhóm Products, chọn
`GET /products/{id}`, bấm **Try it out**, nhập ID rồi bấm **Execute** để xem cả
HTTP status và JSON.

| ID thử | Kết quả mong đợi sau khi seed |
| --- | --- |
| `a1000000-0000-4000-8000-000000000002` | 200, Cà phê sữa, `basePriceVnd: 35000` |
| `a1000000-0000-4000-8000-000000000008` | 200, Trà sữa truyền thống, `isAvailable: false` |
| `a1000000-0000-4000-8000-000000000999` | 404, `Product not found` |
| `abc` | 400, `Validation failed (uuid is expected)` |

Nếu báo `DATABASE_URL is not configured`, kiểm tra file `backend/.env` và chạy
lệnh từ thư mục `backend`. Nếu không kết nối được database, kiểm tra PostgreSQL
đang chạy, username, mật khẩu, cổng và database đã tạo.

## 4. Chạy kiểm thử tự động

Các test dùng Prisma giả lập, không cần PostgreSQL đang chạy. Sau `npm ci` và
`npm run db:generate`, chạy từ thư mục `backend`:

```powershell
npm test
npm run test:e2e
npm run build
npm run lint
```

Unit test kiểm tra xử lý trong service/controller. HTTP integration test khởi
động ứng dụng NestJS để gửi request thật, kiểm tra validation, response và mã lỗi,
nhưng thay truy vấn Prisma bằng dữ liệu giả lập. Vì vậy vẫn cần bước thử với
database thật ở mục 3 để xác nhận cấu hình PostgreSQL trên máy bạn.

API Contract chính thức: [BrewLite_API_Contract_v1.0.md](./BrewLite_API_Contract_v1.0.md),
mục 2.3, 4 và 5.
