Hướng dẫn setup PostgreSQL + Prisma – BrewLite
Bước 1. Cài đặt công cụ
- Node.js: phiên bản 24 LTS.
- PostgreSQL: phiên bản 18 (nhóm đang sử dụng 18.6).
- Git và VS Code.
Khi cài PostgreSQL, ghi nhớ username và password đã thiết lập.
Bước 2. Pull code mới nhất từ dev
Mở Git Bash tại thư mục BrewLite:
git switch dev
git pull origin dev
cd backend


Nếu chưa có branch dev trên máy, tạo branch theo origin/dev trước. Chỉ chuyển branch khi đã lưu hoặc xử lý các thay đổi local.
Bước 3. Cài đặt dependencies
Trong thư mục backend:
npm ci


Lệnh này cài NestJS, Prisma 7.10.1, PostgreSQL Adapter và các dependencies đã được khai báo trong repository.
Bước 4. Tạo database PostgreSQL
Mở Git Bash:
psql -h localhost -p 5432 -U postgres -d postgres


Trong PostgreSQL, chạy:
CREATE DATABASE brewlite_db;


Nếu database đã tồn tại thì bỏ qua lệnh tạo.
Thoát PostgreSQL:
\q


Bước 5. Cấu hình DATABASE_URL
Tạo file:
backend/.env


Tham khảo file .env.example tại thư mục gốc repository và thêm:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/brewlite_db?schema=public"


Thay YOUR_PASSWORD bằng mật khẩu PostgreSQL trên máy.
Lưu ý: Không commit file .env lên Git.
Bước 6. Generate và validate Prisma
Tại thư mục backend, chạy:
npm run db:validate
npm run db:generate


Kết quả mong đợi:
- db:validate: Schema hợp lệ.
- db:generate: Sinh Prisma Client tại src/generated/prisma/.
Kiểm tra kết nối PostgreSQL bằng Prisma:
npx prisma migrate status


Nếu chưa có migration, thông báo No migration found là bình thường. Khi migration của nhóm đã được merge, thành viên sẽ cần áp dụng migration theo hướng dẫn riêng.
Bước 7. Kiểm tra backend
npm run build
npm run start:dev


Nếu backend khởi động bình thường và không báo lỗi cấu hình, môi trường đã sẵn sàng để phát triển.