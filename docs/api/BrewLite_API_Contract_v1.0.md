# BrewLite – API Contract

**Version:** 1.0  
**Sprint:** Sprint 1 – Product Catalog  
**Status:** Approved
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

### 1.2. Scope

API Contract v1.0 chỉ bao gồm hai endpoint thuộc Sprint 1:

| Method | Endpoint        | Description                           |
| ------ | --------------- | ------------------------------------- |
| GET    | `/products`     | Lấy danh sách đồ uống                 |
| GET    | `/products/:id` | Lấy chi tiết đồ uống, Size và Topping |

Cả hai endpoint là public, không yêu cầu JWT.

Các chức năng Auth, Cart, Order, Payment và Loyalty không thuộc phạm vi tài liệu v1.0 này.

### 1.3. Source of Truth

Tài liệu được xây dựng dựa trên:

1. BrewLite Requirements Specification v3.0
2. BrewLite User Stories & Acceptance Criteria v2.2
3. BrewLite Use Case Specification v3.0
4. `database/schema.dbml`

Khi có mâu thuẫn về business rules, nhóm phải đối chiếu tài liệu yêu cầu đã chốt trước khi thay đổi API Contract.

### 1.4. Implementation Responsibilities

| Thành viên  | Trách nhiệm                                                 |
| ----------- | ----------------------------------------------------------- |
| Hoàng Khang | Thiết kế API Contract, review Swagger và điều phối tích hợp |
| Đăng Thụy   | Product Database, Prisma Migration và Seed                  |
| Khải Hoàng  | Implement `GET /products`                                   |
| Chí Khang   | Implement `GET /products/:id`                               |
| Quốc Khánh  | Tích hợp API danh sách vào Menu                             |
| Văn Lập     | Tích hợp API chi tiết vào Product Detail                    |

---

## 2. General API Conventions

### 2.1. Base URL

Backend chạy tại:

`http://localhost:3001`

Các endpoint thuộc Sprint 1:

- `GET /products`
- `GET /products/:id`

Swagger UI:

`http://localhost:3001/api-docs`

Frontend sử dụng API Base URL từ biến môi trường, không hardcode địa chỉ backend trong từng component.

### 2.2. HTTP & JSON

- API sử dụng REST qua HTTP.
- Response body sử dụng JSON.
- Tên trường JSON sử dụng camelCase.
- Các endpoint GET không yêu cầu request body.
- `GET /products` và `GET /products/:id` là public, không yêu cầu JWT.

### 2.3. Data Conventions

| Data Type       | Convention                                                        |
| --------------- | ----------------------------------------------------------------- |
| Product ID      | string (UUID), ánh xạ từ products.id trong PostgreSQL             |
| Topping ID      | string (UUID), ánh xạ từ toppings.id trong PostgreSQL             |
| Product name    | `string`                                                          |
| Image URL       | string (non-null), theo ràng buộc NOT NULL của products.image_url |
| Price           | JSON number, đơn vị VND                                           |
| Availability    | `boolean`, không công khai số lượng tồn kho chính xác             |
| Size            | S, M, L                                                           |
| Size multiplier | 100, 120, 140                                                     |
| Topping price   | JSON number, đơn vị VND                                           |

Giá tiền được truyền dưới dạng số, không kèm ký hiệu `đ` hoặc dấu phân cách hàng nghìn.

Ví dụ: `35000`, không phải `"35.000đ"`.

### Monetary Value Serialization

- Các trường `basePriceVnd` và `priceVnd` trong API Response sử dụng JSON number, biểu diễn số nguyên VND.
- Không trả trực tiếp JavaScript `bigint` từ Prisma ra JSON Response.
- Backend chuyển giá trị `bigint` sang `number` trước khi trả Response.
- Chỉ cho phép chuyển đổi khi giá trị nằm trong phạm vi số nguyên an toàn của JavaScript (`Number.isSafeInteger`).
- Nếu giá trị vượt phạm vi an toàn, Backend phải xử lý lỗi phía server, không trả số tiền đã mất độ chính xác.
- Frontend sử dụng các giá trị này để tính giá tạm tính và định dạng hiển thị VND.
- Backend vẫn chịu trách nhiệm tính lại giá cuối cùng khi tạo Order.

### Product Image URL Convention

- Trong Sprint 1, ảnh sản phẩm được lưu tại `frontend/public/images/`.
- Backend trả `imageUrl` dưới dạng đường dẫn tương đối bắt đầu bằng `/images/`.
- Ví dụ: `/images/ca-phe-sua.jpg`.
- Frontend sử dụng đường dẫn này trực tiếp trên cùng origin với ứng dụng Next.js.
- Mỗi đường dẫn ảnh được seed phải tương ứng với một file ảnh tồn tại trong `frontend/public/images/`.
- Không sử dụng URL ảnh của Backend hoặc dịch vụ lưu trữ bên ngoài trong Sprint 1.
- Nếu ảnh không tải được, Frontend hiển thị ảnh fallback.

### 2.4. HTTP Status Codes

| HTTP Status               | Ý nghĩa                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| 200 OK                    | Request thành công                                               |
| 400 Bad Request           | Tham số request không hợp lệ khi có quy tắc validation tương ứng |
| 404 Not Found             | Không tìm thấy Product theo ID                                   |
| 500 Internal Server Error | Lỗi không mong đợi phía server                                   |

Không trả HTTP 200 kèm dữ liệu Product giả để che giấu lỗi truy vấn database.

### 2.5. Error Response

Response lỗi tuân theo định dạng thống nhất tại mục 5 – Error Response Standard.

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

Endpoint không yêu cầu request body hoặc JWT.

Phiên bản MVP bắt buộc trả toàn bộ danh sách sản phẩm khi không có tham số phân trang.

Pagination thuộc mức SHOULD và không phải điều kiện bắt buộc để hoàn thành API cơ bản của Sprint 1.

### 3.3. Success Response

HTTP Status: `200 OK`

Response Example:

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

### 3.4. Product List Item Fields

| Field        | JSON Type     | Required | Description             |
| ------------ | ------------- | -------- | ----------------------- |
| id           | string (UUID) | Yes      | Mã định danh Product    |
| name         | string        | Yes      | Tên sản phẩm            |
| imageUrl     | string        | Yes      | Đường dẫn ảnh sản phẩm  |
| basePriceVnd | number        | Yes      | Giá cơ bản, đơn vị VND  |
| isAvailable  | boolean       | Yes      | Trạng thái còn/hết hàng |

### 3.5. Business Rules

- Danh sách được sắp xếp ổn định theo tên, sau đó theo ID.
- Không công khai số lượng tồn kho chính xác.
- `isAvailable = true` khi `stock > 0`.
- `isAvailable = false` khi `stock = 0`.
- Giá được trả dưới dạng số nguyên VND.
- Khi không có sản phẩm, trả HTTP 200 với `items: []`.
- Không yêu cầu đăng nhập để xem danh sách.

### 3.6. Notes

- Response shape chính thức của Sprint 1 là `{ "items": [...] }`.
- Sprint 1 không triển khai pagination theo quyết định tại mục 3.7.
- Không sử dụng placeholder response làm kết quả nghiệm thu API hoàn chỉnh.

### 3.7. Pagination Decision

**Decision:** Sprint 1 không triển khai pagination.

- `GET /products` trả toàn bộ danh sách sản phẩm.
- Response sử dụng cấu trúc `{ "items": [...] }`.
- Không yêu cầu query parameters `page` và `limit`.
- Pagination được giữ trong backlog ở mức SHOULD.
- Việc bổ sung pagination sau này cần cập nhật API Contract trước khi triển khai.

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

Endpoint nhận Product ID qua URL path.

Example:

`GET /products/550e8400-e29b-41d4-a716-446655440000`

Path Parameter:

| Parameter | Type          | Required | Description          |
| --------- | ------------- | -------- | -------------------- |
| id        | string (UUID) | Yes      | Mã định danh Product |

Không yêu cầu JWT hoặc request body.

### 4.3. Success Response

HTTP Status: `200 OK`

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

### 4.4. Product Detail Fields

| Field        | JSON Type     | Required | Description             |
| ------------ | ------------- | -------- | ----------------------- |
| id           | string (UUID) | Yes      | Product ID              |
| name         | string        | Yes      | Tên sản phẩm            |
| imageUrl     | string        | Yes      | Đường dẫn ảnh           |
| basePriceVnd | number        | Yes      | Giá cơ bản, VND         |
| isAvailable  | boolean       | Yes      | Trạng thái còn hàng     |
| sizes        | array         | Yes      | Các lựa chọn Size       |
| toppings     | array         | Yes      | Các Topping có thể chọn |

Size Object:

| Field             | JSON Type | Description       |
| ----------------- | --------- | ----------------- |
| size              | string    | S, M hoặc L       |
| multiplierPercent | number    | 100, 120 hoặc 140 |

Topping Object:

| Field    | JSON Type     | Description      |
| -------- | ------------- | ---------------- |
| id       | string (UUID) | Mã Topping       |
| name     | string        | Tên Topping      |
| priceVnd | number        | Giá Topping, VND |

### 4.5. Business Rules

- Size mặc định trên Frontend là S.
- Size S = 100%, M = 120%, L = 140%.
- Mỗi ly chọn tối đa 3 loại Topping khác nhau.
- Một loại Topping chỉ được chọn một lần.
- Topping có giá cố định, không nhân hệ số Size.
- Không trả số lượng tồn kho chính xác.
- Nếu `isAvailable = false`, Frontend không cho thêm sản phẩm vào giỏ.
- Backend phải kiểm tra lại giá và tồn kho khi tạo Order ở Sprint sau.

### 4.6. Price Calculation

Công thức đơn giá một ly:

`unitPriceVnd = round_half_up(basePriceVnd * multiplierPercent / 100) + sum(topping.priceVnd)`

Thành tiền theo số lượng:

`lineTotalVnd = unitPriceVnd * quantity`

Ví dụ:

- Giá cơ bản: 45.000 VND
- Size M: 120%
- Topping 1: 5.000 VND
- Topping 2: 7.000 VND
- Quantity: 2

Kết quả:

- Giá theo Size: 54.000 VND
- Đơn giá một ly: 66.000 VND
- Thành tiền: 132.000 VND

Frontend tính giá tạm tính để hiển thị.
Backend là nguồn quyết định giá cuối cùng khi tạo Order.

### 4.7. Error Handling

Nếu Product ID không tồn tại:

- HTTP Status: `404 Not Found`
- Frontend hiển thị thông báo không tìm thấy sản phẩm.
- Không trả Product giả hoặc HTTP 200 với dữ liệu rỗng.

Cấu trúc JSON lỗi tuân theo mục 5 – Error Response Standard.

### 4.8. Implementation Notes

- Size sử dụng các giá trị S/M/L đã được chốt.
- Topping được truy vấn từ dữ liệu dùng chung trong database.
- Response chỉ chứa dữ liệu cần thiết cho giao diện.
- Không triển khai Cart API, Order API hoặc Payment API trong Sprint 1.
- Response shape tại mục 4.3 là API Contract chính thức để Backend và Frontend triển khai thống nhất.
- Mọi thay đổi cấu trúc response phải được Leader xem xét và cập nhật API Contract trước khi triển khai.

---

## 5. Error Response Standard

### 5.1. Overview

Tất cả API thuộc Sprint 1 sử dụng cấu trúc lỗi thống nhất, tương thích với cơ chế HTTP Exception mặc định của NestJS.

Backend trả HTTP status tương ứng với loại lỗi. Frontend xử lý dựa trên HTTP status và hiển thị thông báo phù hợp.

### 5.2. Error Response Format

Cấu trúc lỗi chuẩn:

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

| Field      | JSON Type | Description        |
| ---------- | --------- | ------------------ |
| statusCode | number    | HTTP status code   |
| message    | string    | Nội dung mô tả lỗi |
| error      | string    | Tên nhóm lỗi HTTP  |

Trong Sprint 1, các lỗi nghiệp vụ và validation được định nghĩa dưới đây sử dụng `message` dạng string.

Không bổ sung custom error code hoặc Exception Filter riêng nếu chưa phát sinh nhu cầu thực tế.

### 5.3. HTTP Status Codes

| Status | Error                 | Trường hợp                            |
| ------ | --------------------- | ------------------------------------- |
| 200    | OK                    | API trả dữ liệu thành công            |
| 400    | Bad Request           | Product ID sai định dạng UUID         |
| 404    | Not Found             | Product ID hợp lệ nhưng không tồn tại |
| 500    | Internal Server Error | Lỗi server không mong đợi             |

HTTP 200 không phải error response.

### 5.4. Product Not Found (404)

Endpoint:

`GET /products/:id`

Điều kiện: Product ID đúng định dạng UUID nhưng không tìm thấy sản phẩm.

Response:

```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

Backend sử dụng `NotFoundException` của NestJS.

Frontend hiển thị trạng thái không tìm thấy sản phẩm.

### 5.5. Invalid Product ID (400)

Endpoint:

`GET /products/:id`

Điều kiện: Product ID không đúng định dạng UUID.

Backend sử dụng `ParseUUIDPipe` của NestJS để validation path parameter.

Response theo cấu hình mặc định của `ParseUUIDPipe`:

```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

Frontend hiển thị thông báo sản phẩm không hợp lệ hoặc không thể truy cập.

### 5.6. Internal Server Error (500)

Áp dụng cho cả:

- `GET /products`
- `GET /products/:id`

Điều kiện: Lỗi không mong đợi phía Backend.

Response:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

Không trả stack trace hoặc chi tiết kết nối database cho Client.

Backend ghi log lỗi để phục vụ debug.

### 5.7. Frontend Error Handling

| Tình huống           | Frontend Behavior                        |
| -------------------- | ---------------------------------------- |
| HTTP 200, items rỗng | Hiển thị Empty State                     |
| HTTP 400             | Hiển thị thông báo ID không hợp lệ       |
| HTTP 404             | Hiển thị Product Not Found               |
| HTTP 500             | Hiển thị thông báo lỗi hệ thống          |
| Network error        | Hiển thị lỗi kết nối và cho phép thử lại |

Frontend không được coi response 400, 404 hoặc 500 là thành công.

Không tạo dữ liệu Product giả để thay thế response lỗi từ Backend.

### 5.8. Implementation Rules

- Sử dụng NestJS built-in HTTP Exceptions.
- Không dùng HTTP 200 để biểu diễn lỗi.
- Không trả raw database error cho Frontend.
- Swagger phải mô tả các HTTP status tương ứng.
- Không tự ý thay đổi Error Response Contract trong quá trình implement.
- Mọi thay đổi Contract phải được Leader cập nhật và thông báo cho các thành viên liên quan.
