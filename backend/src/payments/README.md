# SCRUM-54/55 — POST /payments, API Contract v3.0

## Luồng đã triển khai

AppModule import PaymentsModule; endpoint `/payments` đã bật. JWT Guard xác minh
identity, DTO/pipe validate request và Idempotency-Key 8–64 ký tự. Không tin cậy
amount, userId, status, points hoặc kết quả mock từ client. CARD đúng 16 chữ số,
WALLET đúng 10 chữ số; không trim/coerce credential. Mock CARD đuôi 0002 và
WALLET đuôi 0000 FAILED, còn lại SUCCESS. Cả hai trả HTTP 200.

PaymentsService triển khai PaymentProcessor của phần foundation. Nó dùng
Prisma schema Payment từ dev bad180d, không sửa schema/migration/seed chung.
Không thêm Order API hay Scheduler; OrdersService hiện có được giữ nguyên.

Transaction: ownership trước mọi thông tin key → replay kết quả đã commit → advisory
transaction lock theo hash cặp user/key → replay check → Order FOR UPDATE → replay
recheck → đọc lại state và expiry theo clock DB → xử lý outcome, lưu Payment +
response_snapshot và cập nhật Order cùng transaction. Nếu key đang bận, đọc lại
snapshot để xử lý race với writer vừa commit; chỉ trả 409 PAYMENT_IN_PROGRESS
khi chưa có kết quả đã commit;
Order lock chờ tối đa 1500ms; transaction timeout 8s. Deadlock/serialization retry
tối đa 3 lần, rồi safe 500. SQL được parameterize; không dùng raw SQL từ request.

Amount lấy từ Order.totalVnd, chỉ chuyển number khi safe integer; 0 VND hợp lệ.
PENDING/PAYMENT_FAILED chưa hết hạn mới được tạo attempt. Retry FAILED đi qua
PENDING trong cùng transaction, không commit riêng, không giữ thêm stock/coupon.
SUCCESS → PAID + paidAt + consume HELD coupon + floor(totalVnd/10000) điểm,
FAILED → PAYMENT_FAILED, giữ stock/coupon, không cộng điểm. Points/coupon phải
nguyên tử để response v3.0 đúng; đây là phần giao với SCRUM-56, chưa tuyên bố
hoàn tất toàn bộ Promotion/quota logic SCRUM-56. Không trừ stock lần nữa.

Idempotency được thực hiện ngay vì contract /payments yêu cầu: cùng key + cùng
canonical payload replay snapshot với Idempotency-Replayed:true, kể cả khi Order
đã chuyển trạng thái/hết hạn. Payload khác 409 IDEMPOTENCY_KEY_CONFLICT. Các field
bị ignore không vào hash. Chỉ hash full accepted payload; không lưu/log plaintext
card/phone. methodLast4 là dữ liệu hiển thị, mockReference = MOCK-<payment UUID>
sinh một lần và lưu snapshot. Đọc replay chỉ whitelist public fields; không trả
raw model/snapshot/hash. Không ghi FAILED giả khi có lỗi kỹ thuật.

## Phối hợp Chí Khang / Thụy

- Payment dùng đúng model, FK, unique key và partial unique SUCCESS của Thụy.
- Thứ tự khóa: key advisory → Order → CouponRedemption → User. Scheduler/lifecycle
  phải khóa Order trước thay đổi, đọc lại state/expiry sau lock. Không tự sửa
  Payment SUCCESS hoặc cộng điểm lần nữa trong SCRUM-59.
- Payment chỉ chuyển PENDING/PAYMENT_FAILED → PAID/PAYMENT_FAILED.
  PREPARING/READY/COMPLETED và auto-expiration do Chí Khang triển khai.
- Scheduler cần hoàn stock/coupon khi CANCELLED; FAILED giữ nguyên tài nguyên.
  Payment trả 409 INVALID_TRANSITION khi hết hạn, không tự hủy/release Order.
- SCRUM-55 bổ sung kiểm thử idempotency trong tài liệu SCRUM55_Payment_Idempotency.md.
  SCRUM-56 và kiểm thử toàn lifecycle với Scheduler vẫn cần review riêng.

## Kiểm tra trên máy nhóm

Trong backend: db:generate → npx tsc --noEmit → npm run lint → npm run build →
npm test → npm run test:e2e. Không cần dependency mới.

Test HTTP mới (`test/payments-foundation.e2e-spec.ts`) dùng processor double, chỉ xác minh
route/Auth/validation/Swagger. File HTTP foundation cũ được thay bằng bản này để tránh chạy test trùng.
PaymentsModule.withProcessor vẫn được hỗ trợ để tương thích.

Integration dùng AppModule/Prisma thật, không mock DB:
`test/payments-postgres.integration-spec.ts`. Dùng database test đã migrate,
không dùng DB nhóm đang demo. Trong PowerShell đặt AUTH_TEST_DATABASE_URL bằng
URL database test của bạn (không commit URL/mật khẩu), rồi:

```powershell
$env:DATABASE_URL = $env:AUTH_TEST_DATABASE_URL
npm.cmd run db:migrate
$env:PAYMENT_CONCURRENCY_TESTS = "1"
npx.cmd vitest run --config ./vitest.config.integration.ts test/payments-postgres.integration-spec.ts
```

Nếu chạy `npm run test:integration` toàn bộ thì Orders test của nhóm còn yêu cầu
ORDERS_TEST_DATABASE_URL. Script tự tạo UUID/email riêng mỗi lần và chỉ cleanup
fixtures của mình. Không reset/drop dữ liệu hoặc sửa schema trong test.

Concurrency suite cần PostgreSQL với nhiều connection thật: same-key parallel,
different keys/same Order, key busy/rollback/retry, Payment chờ Order cancellation.
Kiểm tra cùng Scheduler thực và toàn luồng FE vẫn cần phối hợp sau SCRUM-57/59.

## Bổ sung SCRUM-55

User UUID từ JWT được canonicalize lowercase trước khi tạo lock identity, đúng với
phép so sánh UUID của PostgreSQL. Idempotency-Key vẫn giữ nguyên và phân biệt hoa/thường.
Receipt đã commit được trả trước khi lấy lock, nên replay không bị một request đang
giữ advisory lock chặn lại. Ownership và validation luôn chạy trước replay.

Test bổ sung: cùng key sau FAILED rồi SUCCESS, payload đổi thứ tự/UUID casing/extra
fields, key 8/64 ký tự, key khác casing, đổi Order/method, malformed replay, race khi
writer commit giữa lookup và try-lock. PostgreSQL suite còn kiểm tra receipt đã có
trong lúc key bị khóa, timeout Order lock rồi retry và payload khác nhau chạy song song.
