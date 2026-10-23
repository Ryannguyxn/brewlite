# SCRUM-39 — Hướng dẫn chạy bản hoàn chỉnh

Bản này tích hợp SCRUM-37 từ dev (a074954), Register dùng Argon2id theo review
PR #58 và Login/JWT của SCRUM-39. Khi review/merge PR 39, cần tính phần phụ
thuộc SCRUM-38; nên merge PR #58 trước để phần diff của PR 39 chỉ còn Login/JWT.

## Nhận source từ Git bundle

Đặt SCRUM39-complete.bundle vào thư mục gốc repo brewlite. Bundle chứa commit
và source hoàn chỉnh; không cần áp dụng các patch SCRUM-39 cũ.
Trong PowerShell:

```powershell
cd D:\CNPM_PJ\brewlite
git status
git fetch origin
git fetch .\SCRUM39-complete.bundle SCRUM-39-complete:SCRUM-39-complete
git switch SCRUM-39-complete
cd backend
npm ci
npm run db:generate
```

Hãy commit các thay đổi đang sửa trên nhánh cũ trước khi chuyển nhánh nếu có.
Các file patch untracked không cần thêm vào commit. Bundle tạo nhánh mới,
không yêu cầu sửa hoặc xóa nhánh SCRUM-38/39 cũ trên máy bạn.

## Cấu hình và kiểm tra

Giữ DATABASE_URL trong backend/.env. Nếu chưa có JWT_SECRET, tạo một giá trị:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Thêm JWT_SECRET=<giá trị vừa tạo> vào backend/.env. Không commit file .env.
Sau đó chạy lần lượt, dừng nếu có lệnh báo lỗi:

```powershell
npm run db:validate
npm run db:migrate
npm run lint
npm run build
npm test
npm run test:e2e
$env:PORT = "3002"
npm run start:dev
```

Mở http://localhost:3002/api-docs. Đăng ký tài khoản mới để có hash Argon2id,
rồi gọi POST /auth/login với cùng email/password. Tài khoản thử dùng bcrypt
cũ cần đăng ký tài khoản mới hoặc reset mật khẩu qua một quy trình riêng.

- Thành công: 200, accessToken, tokenType="Bearer", expiresIn=3600.
- Email không tồn tại/mật khẩu sai: cùng 401 INVALID_CREDENTIALS.
- Dữ liệu không hợp lệ: 400 VALIDATION_ERROR.
- Guard: token thiếu/sai/hết hạn trả 401 UNAUTHORIZED.

Hướng dẫn chạy 6 integration tests trên PostgreSQL riêng và cách dùng Guard
trong Orders nằm ở backend/src/auth/README-login.md.

## Kiểm thử đã thực hiện

- Prisma validate/generate, lint, build: pass.
- Unit tests: 45 pass. E2E/HTTP tests: 70 pass.
- 4 migrations, seed và script kiểm tra quan hệ/rollback SCRUM-37: pass trên
  PostgreSQL nhúng PGlite qua TCP.
- 6 integration tests: pass với PrismaService thực, không mock database,
  trên PostgreSQL nhúng đó. Cần chạy lại trên PostgreSQL cài đặt của nhóm
  trước khi nghiệm thu môi trường đó.

Source không thay đổi schema, migrations, seed hay cấu hình Prisma dùng chung.
Guard được cung cấp để OrdersModule dùng lại; SCRUM-39 không triển khai Orders.

## Push và PR

Sau khi kiểm tra thành công trên máy bạn:

```powershell
git push -u origin SCRUM-39-complete
```

Tạo PR vào dev, ghi rõ phụ thuộc PR #58. Chỉ chuyển task sang Done theo quy
trình review/merge của nhóm.
