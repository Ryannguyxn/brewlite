# BrewLite – API Contract

**Version:** 2.0  
**Sprint:** Sprint 2 – Cart, Authentication & Order (kế thừa Sprint 1)  
**Status:** Approved – API Design (Sprint 2)  
**Owner:** Hoàng Khang  
**Tech Stack:** NestJS, Next.js, PostgreSQL, Prisma  
**API Style:** REST / JSON

---

## 1. Introduction

### 1.1. Purpose

Tài liệu này định nghĩa API Contract giữa Backend và Frontend của hệ thống BrewLite.

Mục tiêu:

- Thống nhất cấu trúc request và response.
- Thống nhất tên trường, kiểu dữ liệu và HTTP status.
- Làm cơ sở triển khai Backend API và tích hợp Frontend.
- Đảm bảo API tuân thủ Requirements Specification, User Stories & Acceptance Criteria, Use Case Specification và ERD đã chốt.
- Giữ tương thích với API Contract v1.0 của Sprint 1.

### 1.2. Scope

API Contract v2.0 kế thừa nguyên văn contract của hai endpoint Sprint 1 và bổ sung ba endpoint Sprint 2:

| Method | Endpoint         | Description                                       |
| ------ | ---------------- | ------------------------------------------------- |
| GET    | `/products`      | Lấy danh sách đồ uống                             |
| GET    | `/products/:id`  | Lấy chi tiết đồ uống, Size và Topping             |
| POST   | `/auth/register` | Đăng ký Customer                                  |
| POST   | `/auth/login`    | Đăng nhập và cấp JWT                              |
| POST   | `/orders`        | Tạo Order PENDING từ Cart, hỗ trợ coupon tùy chọn |

Quy định phạm vi:

- `GET /products`, `GET /products/:id`, `POST /auth/register`, `POST /auth/login` là public.
- `POST /orders` yêu cầu JWT.
- Cart được quản lý phía Frontend bằng Zustand/Context; không có Cart API trong Sprint 2.
- `POST /payments`, `GET /orders/me`, Order History, Loyalty API, coupon preview và các API khác thuộc Sprint 3+.
- Sprint 2 chỉ triển khai mức nghiệp vụ cần thiết để hoàn thành flow Cart → Auth → Create Order.
- Advanced concurrency hardening, scheduled expiration, advanced coupon serialization và các race-condition test chuyên sâu được defer sang Task 10 / Sprint 3 trừ khi cần để sửa lỗi nghiêm trọng.

### 1.3. Source of Truth

Baseline Sprint 1 là `BrewLite_API_Contract_v1.0.md` (Approved, bảo lưu).

API Contract v2.0 được xây dựng dựa trên:

1. BrewLite Requirements Specification v3.0
2. BrewLite User Stories & Acceptance Criteria v2.2
3. BrewLite Use Case Specification v3.0
4. `database/schema.dbml`
5. API Contract v1.0

Khi có mâu thuẫn về business rule, nhóm phải đối chiếu tài liệu yêu cầu đã chốt trước khi thay đổi API Contract.

### 1.4. Sprint 2 Implementation Responsibilities

| Thành viên | Trách nhiệm Sprint 2                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| HKhang     | API Contract, review Swagger/PR, consistency review, integration coordination             |
| Thụy       | Prisma schema/migration cho User, Order, OrderItem và các relation cần thiết cho Sprint 2 |
| Hoàng      | Register, Login, JWT Strategy/Guard, Auth DTO và Swagger                                  |
| CKhang     | `POST /orders`, Order Controller/DTO/Service, tính giá, transaction tạo Order             |
| Khánh      | Cart State/UI, payload mapping từ Cart sang Checkout                                      |
| Lập        | Auth UI, Checkout Flow, gọi `POST /orders`, hiển thị response/errors                      |

Nếu coupon được triển khai trong Sprint 2, phần DB/model liên quan chỉ làm ở mức cần thiết cho `POST /orders`. Không mở rộng sang Promotion/Loyalty ngoài phạm vi Create Order.

---

## 2. General API Conventions

### 2.1. Base URL

Backend chạy tại:

`http://localhost:3001`

Các endpoint đang được đặc tả:

- `GET /products`
- `GET /products/:id`
- `POST /auth/register`
- `POST /auth/login`
- `POST /orders`

Swagger UI:

`http://localhost:3001/api-docs`

Frontend sử dụng API Base URL từ biến môi trường, không hardcode địa chỉ Backend trong từng component.

### 2.2. HTTP & JSON

- API sử dụng REST qua HTTP.
- Request/response body sử dụng JSON.
- Tên trường JSON sử dụng camelCase.
- `Content-Type: application/json`.
- Date/time trả về theo ISO 8601 UTC.
- Hai endpoint Product là public.
- Hai endpoint Auth là public.
- `POST /orders` yêu cầu JWT Bearer Token.

### 2.3. Data Conventions

| Data Type       | Convention              |
| --------------- | ----------------------- |
| Product ID      | string (UUID)           |
| User ID         | string (UUID)           |
| Order ID        | string (UUID)           |
| Topping ID      | string (UUID)           |
| Product name    | string                  |
| Image URL       | string                  |
| Price           | JSON number, đơn vị VND |
| Availability    | boolean                 |
| Size            | `S`, `M`, `L`           |
| Size multiplier | `100`, `120`, `140`     |
| Topping price   | JSON number, đơn vị VND |
| Date/time       | ISO 8601 UTC            |

Giá tiền được truyền dưới dạng số, không kèm ký hiệu `đ` hoặc dấu phân cách hàng nghìn.

Ví dụ: `35000`, không phải `"35.000đ"`.

#### Monetary Value Serialization

- Các trường tiền như `basePriceVnd`, `priceVnd`, `unitPriceVnd`, `lineTotalVnd`, `subtotalVnd`, `discountVnd`, `totalVnd` dùng JSON number.
- Không trả trực tiếp JavaScript `bigint` từ Prisma ra JSON.
- Backend chỉ chuyển sang `number` khi nằm trong `Number.isSafeInteger`.
- Frontend chỉ dùng giá từ Product/Cart để hiển thị tạm tính.
- Backend là nguồn quyết định giá cuối cùng khi tạo Order.

#### Product Image URL Convention

- Ảnh Product được lưu tại `frontend/public/images/`.
- Backend trả `imageUrl` dạng `/images/...`.
- Frontend dùng đường dẫn này trực tiếp.
- Nếu ảnh lỗi, Frontend hiển thị fallback.

### 2.4. HTTP Status Codes

| HTTP Status               | Ý nghĩa                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| 200 OK                    | Request thành công                                                          |
| 201 Created               | Tạo resource thành công                                                     |
| 400 Bad Request           | Validation hoặc request không hợp lệ                                        |
| 401 Unauthorized          | Thiếu/sai/hết hạn JWT hoặc credential đăng nhập sai                         |
| 404 Not Found             | Resource hợp lệ về định dạng nhưng không tồn tại                            |
| 409 Conflict              | Xung đột nghiệp vụ như email trùng, stock không đủ, active order đã tồn tại |
| 500 Internal Server Error | Lỗi server ngoài dự kiến                                                    |

Không dùng HTTP 200 để biểu diễn lỗi.

### 2.5. Authentication / JWT

- `POST /auth/register` và `POST /auth/login` không yêu cầu JWT.
- `POST /orders` yêu cầu `Authorization: Bearer <accessToken>`.
- JWT chứa `sub` là User UUID.
- TTL mặc định: 60 phút (`3600` giây), phải khớp cấu hình thực tế.
- User ID trong Order phải lấy từ JWT đã xác minh, không lấy từ request body.
- Không trả `password`, `passwordHash`, JWT secret.
- Không commit `JWT_SECRET`.
- Token thiếu/sai/hết hạn: `401 UNAUTHORIZED`.
- Login thành công trả `accessToken`, `tokenType: "Bearer"`, `expiresIn: 3600`.

### 2.6. Error Response

Sprint 1 giữ nguyên error payload đã Approved.

Sprint 2 dùng additive extension tại mục 5.2, không phá compatibility Product API v1.0.

---

## 3. GET /products – Product Listing

### 3.1. Overview

| Attribute            | Value       |
| -------------------- | ----------- |
| Method               | GET         |
| Endpoint             | `/products` |
| Authentication       | Public      |
| Success Status       | 200 OK      |
| Related Requirements | FR-CAT-001  |
| Related User Stories | US-CAT-01   |
| Related Use Case     | UC-CAT-001  |
| Backend Owner        | Hoàng       |
| Frontend Consumer    | Khánh       |

### 3.2. Request

Không yêu cầu request body hoặc JWT.

Sprint 1 không triển khai pagination.

### 3.3. Success Response

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Cà phê sữa",
      "imageUrl": "/images/ca-phe-sua.jpg",
      "basePriceVnd": 45000,
      "isAvailable": true
    }
  ]
}
```

### 3.4. Business Rules

- Danh sách được sắp xếp ổn định theo tên, sau đó theo ID.
- Không công khai stock chính xác.
- `isAvailable = true` khi `stock > 0`.
- Khi không có sản phẩm, trả `200` với `items: []`.
- Không yêu cầu đăng nhập.

---

## 4. GET /products/:id – Product Detail

### 4.1. Overview

| Attribute            | Value                              |
| -------------------- | ---------------------------------- |
| Method               | GET                                |
| Endpoint             | `/products/:id`                    |
| Authentication       | Public                             |
| Success Status       | 200 OK                             |
| Not Found Status     | 404 Not Found                      |
| Related Requirements | FR-CAT-002, FR-CAT-003, FR-CAT-004 |
| Related User Stories | US-CAT-02, US-CAT-03, US-CAT-04    |
| Related Use Case     | UC-CAT-002                         |
| Backend Owner        | CKhang                             |
| Frontend Consumer    | Lập                                |

### 4.2. Request

`GET /products/{productId}`

Path parameter:

| Field | Type        | Required |
| ----- | ----------- | -------- |
| id    | UUID string | Yes      |

### 4.3. Success Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cà phê sữa",
  "imageUrl": "/images/ca-phe-sua.jpg",
  "basePriceVnd": 45000,
  "isAvailable": true,
  "sizes": [
    { "size": "S", "multiplierPercent": 100 },
    { "size": "M", "multiplierPercent": 120 },
    { "size": "L", "multiplierPercent": 140 }
  ],
  "toppings": [
    {
      "id": "7d44a44c-8d1a-4af3-98cb-90e5d4c8a001",
      "name": "Trân châu",
      "priceVnd": 5000
    }
  ]
}
```

### 4.4. Business Rules

- Size mặc định phía Frontend là S.
- Size S = 100%, M = 120%, L = 140%.
- Tối đa 3 loại Topping khác nhau.
- Một Topping chỉ được chọn một lần.
- Topping không nhân hệ số Size.
- Không trả stock chính xác.
- Product unavailable không được thêm vào Cart.
- Backend kiểm tra lại giá và stock khi tạo Order.

### 4.5. Price Calculation

```text
unitPriceVnd =
round_half_up(basePriceVnd * multiplierPercent / 100)
+ sum(topping.priceVnd)

lineTotalVnd = unitPriceVnd * quantity
```

Frontend chỉ tính giá tạm tính. Backend quyết định giá cuối cùng.

---

## 5. Error Response Standard

### 5.1. Legacy Sprint 1 Format

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

Sprint 1 Product errors giữ nguyên.

### 5.2. Sprint 2 Error Extension

Sprint 2 cho phép thêm `code` để Frontend xử lý machine-readable error.

Ví dụ:

```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

Quy định:

- `statusCode`: number, required.
- `message`: string hoặc string[], required.
- `error`: string, required.
- `code`: string, required cho các lỗi nghiệp vụ Sprint 2 đã định nghĩa.
- Không bắt buộc `code` cho Product v1.0 hoặc lỗi 500.
- Không trả raw SQL, stack trace, password/hash/secret.

### 5.3. Sprint 2 Error Codes

| Code                 | HTTP | Meaning                                              |
| -------------------- | ---: | ---------------------------------------------------- |
| VALIDATION_ERROR     |  400 | DTO/shape/range/enum/UUID sai                        |
| EMAIL_ALREADY_EXISTS |  409 | Email đã tồn tại                                     |
| INVALID_CREDENTIALS  |  401 | Email/password không hợp lệ                          |
| UNAUTHORIZED         |  401 | Thiếu/sai/hết hạn JWT                                |
| INVALID_CART         |  400 | Cart semantic/business rule không hợp lệ             |
| INVALID_COUPON       |  400 | Coupon không hợp lệ                                  |
| INSUFFICIENT_STOCK   |  409 | Không đủ stock                                       |
| PENDING_ORDER_EXISTS |  409 | User đã có active unpaid order nếu rule này được bật |

---

## 6. POST /auth/register – Create Customer

### 6.1. Overview

| Attribute         | Value            |
| ----------------- | ---------------- |
| Method            | POST             |
| Endpoint          | `/auth/register` |
| Authentication    | Public           |
| Success           | 201 Created      |
| Backend Owner     | Hoàng            |
| Frontend Consumer | Lập              |

Không tự động login hoặc phát JWT sau khi Register.

### 6.2. Request

```json
{
  "email": "customer@example.com",
  "password": "Password123",
  "fullName": "Nguyen Van A"
}
```

| Field    | Type   | Required | Validation                            |
| -------- | ------ | -------- | ------------------------------------- |
| email    | string | Yes      | Email hợp lệ, trim/lowercase, max 255 |
| password | string | Yes      | Tối thiểu 8 ký tự                     |
| fullName | string | No       | max 255                               |

Rules:

- Password được bcrypt hash trước khi lưu.
- Không log password.
- `role`, `loyaltyPoints`, `passwordHash` từ client không được dùng.
- DB enforce unique email.
- `loyaltyPoints` mặc định 0 nếu schema có trường này.

### 6.3. Success Response – 201

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "fullName": "Nguyen Van A"
}
```

Không trả password, hash, role, loyaltyPoints hoặc accessToken.

### 6.4. Errors

- `400 VALIDATION_ERROR`
- `409 EMAIL_ALREADY_EXISTS`
- `500 Internal Server Error`

### 6.5. Swagger

- Auth tag
- RegisterDto
- Response DTO riêng
- `@ApiCreatedResponse`
- `@ApiBadRequestResponse`
- `@ApiConflictResponse`
- `@ApiInternalServerErrorResponse`

---

## 7. POST /auth/login – Issue JWT

### 7.1. Overview

| Attribute         | Value         |
| ----------------- | ------------- |
| Method            | POST          |
| Endpoint          | `/auth/login` |
| Authentication    | Public        |
| Success           | 200 OK        |
| Backend Owner     | Hoàng         |
| Frontend Consumer | Lập           |

### 7.2. Request

```json
{
  "email": "customer@example.com",
  "password": "Password123"
}
```

Rules:

- Email được chuẩn hóa để lookup.
- Password required, non-empty.
- Dùng bcrypt compare với passwordHash trong DB.
- Không tiết lộ email có tồn tại hay không.

### 7.3. Success Response – 200

```json
{
  "accessToken": "<JWT_ACCESS_TOKEN>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

JWT chứa `sub = User UUID`.

Không trả password/hash/refreshToken/JWT secret.

### 7.4. Errors

- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS`
- `500 Internal Server Error`

Email không tồn tại và password sai phải trả cùng status/code/message.

### 7.5. Frontend Behavior

- Login thành công: lưu token theo strategy Frontend đã chốt.
- Login thất bại: giữ nguyên Cart.
- Token hết hạn khi Checkout: chuyển Login nhưng không làm mất Cart.

---

## 8. POST /orders – Create PENDING Order

### 8.1. Overview

| Attribute         | Value        |
| ----------------- | ------------ |
| Method            | POST         |
| Endpoint          | `/orders`    |
| Authentication    | JWT required |
| Success           | 201 Created  |
| Backend Owner     | CKhang       |
| Frontend Consumer | Lập, Khánh   |
| DB Owner          | Thụy         |

Header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

Order mới có status `PENDING`.

Payment API không thuộc v2.0.

### 8.2. Request Body

```json
{
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "size": "M",
      "toppingIds": ["7d44a44c-8d1a-4af3-98cb-90e5d4c8a001"],
      "quantity": 2
    }
  ],
  "couponCode": "WELCOME20"
}
```

| Field              | Type          | Required | Validation                   |
| ------------------ | ------------- | -------- | ---------------------------- |
| items              | array         | Yes      | 1–20 dòng                    |
| items[].productId  | UUID string   | Yes      | Product tồn tại              |
| items[].size       | enum string   | Yes      | S/M/L                        |
| items[].toppingIds | UUID string[] | Yes      | 0–3 ID khác nhau             |
| items[].quantity   | integer       | Yes      | 1–10                         |
| couponCode         | string        | No       | Tối đa 1 mã, trim, normalize |

Client không được quyết định:

- `userId`
- `status`
- `price`
- `unitPriceVnd`
- `lineTotalVnd`
- `subtotalVnd`
- `discountVnd`
- `totalVnd`

Backend không dùng các field này nếu client tự thêm.

### 8.3. Server-side Validation & Calculation

Backend phải:

1. Lấy User ID từ JWT.
2. Validate DTO.
3. Kiểm tra Product tồn tại và available.
4. Kiểm tra Size hợp lệ.
5. Kiểm tra Topping hợp lệ.
6. Kiểm tra quantity.
7. Kiểm tra stock ở thời điểm tạo Order.
8. Đọc toàn bộ giá từ database.
9. Tự tính lại giá.
10. Nếu có coupon, validate coupon và tính discount.
11. Tạo Order + OrderItems trong transaction.
12. Nếu bất kỳ bước nào lỗi, rollback toàn bộ Create Order.

Pricing:

```text
unitPriceVnd =
round_half_up(basePriceVnd * multiplierPercent / 100)
+ sum(toppingPriceVnd)

lineTotalVnd = unitPriceVnd * quantity
subtotalVnd = sum(lineTotalVnd)
totalVnd = subtotalVnd - discountVnd
```

Nếu không có coupon:

```text
discountVnd = 0
```

### 8.4. Coupon Scope in Sprint 2

Coupon là optional.

Sprint 2 MUST:

- Nhận `couponCode` optional.
- Lookup coupon.
- Kiểm tra coupon tồn tại và đang sử dụng được theo các rule hiện có trong tài liệu nghiệp vụ.
- Kiểm tra min subtotal nếu có.
- Tính discount.
- Lưu coupon/order snapshot cần thiết để Order response không thay đổi hồi tố.

Sprint 2 KHÔNG bắt buộc:

- coupon preview API
- advanced concurrent coupon quota serialization
- full HELD → CONSUMED → RELEASED lifecycle
- scheduled coupon release
- row-lock strategy chuyên sâu

Các phần trên defer sang Task 10 / Sprint 3 nếu không phải điều kiện bắt buộc của implementation hiện tại.

### 8.5. Transaction Scope

Sprint 2 MUST:

- Tạo Order và OrderItems nguyên tử.
- Không được tạo Order dở dang.
- Không tin giá/owner/status từ client.
- Stock không được âm do logic request thông thường.
- Nếu Order creation thất bại thì rollback.

Advanced concurrency hardening như:

- partial unique index cho active Order
- bounded retry cho transaction race
- row lock coupon
- concurrent coupon quota tests
- concurrent expiration cleanup
- scheduled expiration cron

được defer sang Task 10 / Sprint 3.

### 8.6. Success Response – 201

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "status": "PENDING",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "productName": "Cà phê sữa",
      "size": "M",
      "sizeMultiplierPercent": 120,
      "basePriceVnd": 45000,
      "quantity": 2,
      "unitPriceVnd": 59000,
      "lineTotalVnd": 118000,
      "toppings": [
        {
          "id": "7d44a44c-8d1a-4af3-98cb-90e5d4c8a001",
          "name": "Trân châu",
          "priceVnd": 5000
        }
      ]
    }
  ],
  "couponCode": "WELCOME20",
  "subtotalVnd": 118000,
  "discountVnd": 20000,
  "totalVnd": 98000,
  "createdAt": "2026-10-21T13:00:00.000Z"
}
```

Rules:

- `couponCode`: string hoặc null.
- `status = PENDING`.
- `createdAt`: ISO 8601 UTC.
- Backend trả snapshot giá đã dùng để tạo Order.
- Response total phải là giá server-side.
- Không tạo Payment khi tạo Order.

### 8.7. Error Responses

| HTTP | code                 | Trigger                                                         |
| ---- | -------------------- | --------------------------------------------------------------- |
| 400  | VALIDATION_ERROR     | DTO/shape/UUID/enum/range sai                                   |
| 400  | INVALID_CART         | Cart semantic không hợp lệ                                      |
| 400  | INVALID_COUPON       | Coupon không tồn tại/không hợp lệ                               |
| 401  | UNAUTHORIZED         | Thiếu/sai/hết hạn JWT                                           |
| 409  | INSUFFICIENT_STOCK   | Không đủ stock                                                  |
| 409  | PENDING_ORDER_EXISTS | Chỉ dùng nếu active-order rule đã được implement trong Sprint 2 |
| 500  | none required        | Lỗi hệ thống                                                    |

Ví dụ `INSUFFICIENT_STOCK`:

```json
{
  "statusCode": 409,
  "message": "Insufficient product stock",
  "error": "Conflict",
  "code": "INSUFFICIENT_STOCK",
  "details": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "requestedQuantity": 6,
      "availableQuantity": 5
    }
  ]
}
```

Ví dụ `INVALID_CART`:

```json
{
  "statusCode": 400,
  "message": ["Invalid cart item at index 1"],
  "error": "Bad Request",
  "code": "INVALID_CART",
  "details": [
    {
      "itemIndex": 1,
      "reason": "DUPLICATE_TOPPING"
    }
  ]
}
```

Suggested `reason` values:

- `DUPLICATE_CONFIGURATION`
- `DUPLICATE_TOPPING`
- `PRODUCT_NOT_FOUND`
- `TOPPING_NOT_FOUND`
- `PRODUCT_UNAVAILABLE`
- `INVALID_SIZE`

Frontend không parse text `message` để suy luận loại lỗi; dùng `code` và `details`.

### 8.8. Swagger Expectations

NestJS Swagger cần mô tả:

- Bearer scheme
- `@ApiBearerAuth`
- CreateOrderDto
- OrderResponseDto
- `@ApiCreatedResponse`
- `@ApiBadRequestResponse`
- `@ApiUnauthorizedResponse`
- `@ApiConflictResponse`
- `@ApiInternalServerErrorResponse`

Nested DTO phải validate đúng:

- items 1–20
- quantity 1–10
- toppingIds 0–3
- UUID
- enum Size

---

## 9. Frontend Integration Expectations

### 9.1. Cart

Cart được quản lý phía Frontend.

Frontend chịu trách nhiệm:

- Add item
- Remove item
- Update quantity
- Cart badge
- Tạm tính giá
- Giữ Cart qua login flow theo UX đã chốt

Frontend không được coi local Cart là nguồn giá cuối cùng.

### 9.2. Auth

Frontend:

- Gọi Register/Login theo contract.
- Không gửi role/loyaltyPoints.
- Lưu và gửi Bearer Token cho endpoint bảo vệ.
- Khi JWT hết hạn ở Checkout, chuyển Login nhưng giữ Cart.

### 9.3. Checkout

Frontend gửi:

- productId
- size
- toppingIds
- quantity
- couponCode nếu có

Frontend không gửi:

- userId
- status
- total
- price
- discount quyết định bởi client

Sau Create Order thành công, hiển thị response từ server.

---

## 10. Future Scope – Not in v2.0

Không đặc tả trong v2.0:

- `POST /payments`
- `GET /orders/me`
- Order History
- Cancel Order API
- Loyalty API
- Coupon preview API
- Payment idempotency
- Advanced concurrency protection
- Scheduled expiration cron
- Advanced coupon quota locking
- Release/consume coupon lifecycle
- Race-condition acceptance tests chuyên sâu
- Catalog pagination

Các nội dung này được xử lý ở Sprint 3 / Task 10 hoặc version contract tiếp theo.

---

## 11. Version / Change History

| Version | Status                | Scope                                                        | Compatibility               |
| ------- | --------------------- | ------------------------------------------------------------ | --------------------------- |
| 1.0     | Approved              | GET `/products`, GET `/products/:id`                         | Sprint 1 baseline           |
| 2.0     | Approved – API Design | Adds Auth/JWT and POST `/orders`; preserves Product contract | No breaking change intended |

---

## 12. Sprint 2 Approval Gate

API Contract v2.0 được coi là Approved khi:

- Product v1.0 không bị thay đổi breaking.
- Register/Login fields và status được team thống nhất.
- JWT rules được thống nhất.
- `POST /orders` request/response được Backend + Frontend thống nhất.
- Server-side pricing được thống nhất.
- Coupon scope được giới hạn đúng Sprint 2.
- Advanced concurrency/expiration không bị ngầm đưa vào Sprint 2 nếu Jira chưa có task.
- Swagger phải phản ánh đúng contract.
- Jira assignment phải khớp với trách nhiệm implementation.
- Mọi thay đổi sau Approval phải cập nhật API Contract trước khi merge code liên quan.

**Design State:** Approved – API Design (Sprint 2)

---

## 13. Sprint 2 Definition of Done for API Contract

Contract task được xem là Done khi:

1. Markdown v2.0 được commit vào repository.
2. Team đã được thông báo endpoint mới.
3. Backend owners xác nhận request/response.
4. Frontend owners xác nhận payload/error handling.
5. Swagger implementation bám contract.
6. Không còn field hoặc business rule Sprint 2 chưa có owner.
7. Không còn scope Task 10 bị ngầm nhét vào `POST /orders`.
