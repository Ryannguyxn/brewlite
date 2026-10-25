# SCRUM-54 — phần độc lập theo API Contract v3.0

Đây là phần chuẩn bị, **SCRUM-54 chưa Done**. Baseline: dev 8f1e9d0.

Đã làm: DTO request/response, validation body và Idempotency-Key 8–64 ký tự,
loại bỏ field do client tự quyết định, mock CARD/WALLET deterministic,
Controller dùng JWT Guard, HTTP 200 cho cả hai kết quả, replay header và Swagger.
Không log hoặc lưu số thẻ/số điện thoại; kết quả mock chỉ giữ last4 và outcome.
Không tự trim/coerce credentials. DTO/pipe không phụ thuộc generated Payment model.

Module chưa được import vào AppModule; POST /payments chưa được bật trong ứng dụng.
Controller chỉ được đăng ký khi gọi PaymentsModule.withProcessor(implementation,
imports). Chưa có PaymentProcessor thật, không có lưu Payment giả trong bộ nhớ.
Các HTTP test dùng processor stub, kiểm tra HTTP/validation/JWT/Swagger;
không chứng minh DB transaction, idempotency hoặc Payment lifecycle hoạt động.

## Phần cần tích hợp khi nhóm sẵn sàng

- Thụy SCRUM-51/52: Payment model/relations, unique (userId,idempotencyKey),
  partial unique SUCCESS/Order, safe response_snapshot và constraints theo ERD.
- Chí Khang: Order PENDING và transaction/state/expiry integration, phối hợp
  khóa Order và Scheduler. Không sửa schema/migrations/Orders thay người khác.
- Implement PaymentProcessor thật: ownership (404 cho missing/other owner),
  lock và recheck, amount lấy từ Order, state/expiry validation, persist outcome
  và immutable response_snapshot trong cùng transaction.
- SCRUM-55: hash canonical accepted payload; key coordination với timeout hữu hạn,
  replay/conflict/in-progress, recheck sau lock và real PostgreSQL concurrency tests.
  Validation header và trả replay header trong Controller chưa phải idempotency.
- SCRUM-56: consume coupon HELD và cộng floor(totalVnd/10000) điểm một lần trong
  transaction SUCCESS; FAILED giữ stock/coupon/points; system error rollback toàn bộ.
- Mock reference/createdAt/paymentId sinh một lần khi lưu, dùng lại từ snapshot.
  Giá BigInt chuyển JSON number chỉ khi safe integer. 0 VND vẫn thanh toán.
- Lỗi processor phải trả envelope v3.0, bao gồm 500 INTERNAL_ERROR an toàn.
- Sau tích hợp mới import module đã cấu hình vào AppModule và nghiệm thu endpoint.

## Chạy kiểm tra

Trong backend: npm ci, npm run db:generate, npx tsc --noEmit,
npm run lint, npm run build, npm test, npm run test:e2e.
Các test mới không cần database đang chạy; không thay thế integration tests.
Không thay đổi package dependencies, Prisma layout, migrations hoặc API Contract.
