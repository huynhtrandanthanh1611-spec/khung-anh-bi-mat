# Khung ảnh bí mật

Website trò chơi ghép ảnh bằng tiếng Việt dành cho giáo viên và học sinh. **1 ảnh = 1 vòng**, mỗi ảnh có số hàng/cột riêng. Mã nguồn riêng tư trên GitHub không ngăn học sinh truy cập website sau khi website được triển khai công khai.

## Trạng thái

Đã triển khai mã nguồn MVP. **Chưa kết nối một dự án Supabase thật và chưa triển khai website trực tuyến.** Cần làm các bước cấu hình bên dưới để dùng đăng nhập, tải tệp và chia sẻ trò chơi giữa các thiết bị. Không có tài khoản giả, dữ liệu mẫu hoặc chế độ lưu trò chơi vào localStorage.

## Chức năng

- Giáo viên đăng ký/đăng nhập bằng email; danh sách, tạo, sửa, nhân bản và xóa trò chơi.
- Thêm nhiều JPG/PNG/WEBP; 1 ảnh tự tạo 1 vòng. Mỗi tệp tối đa 4 MiB, tối đa 50 vòng.
- Mỗi vòng có hàng/cột 2–10, bật/tắt, tên, gợi ý, lời nhắn; thay ảnh giữ cài đặt.
- Đổi thứ tự bằng tay nắm kéo (chuột/cảm ứng), hoặc nút lên/xuống.
- MP3, âm lượng, bật/tắt nhạc và hiệu ứng. Nhạc bắt đầu bằng tương tác, không khởi động lại giữa các vòng.
- Tự lưu sau 800 ms, lưu thủ công, cảnh báo rời trang, phát hiện xung đột khi sửa nhiều cửa sổ.
- Xem thử từng vòng hoặc toàn bộ bản nháp. Bản xem thử không ghi kết quả.
- Xuất bản snapshot riêng, tạm ẩn, mã 8 ký tự, link và QR tải xuống.
- Học sinh không cần tài khoản. Ghép bằng kéo thả Pointer Events hoặc chạm/chọn bằng bàn phím rồi chọn ô. Đúng thì khóa; sai giữ ở khay.
- Đồng hồ ẩn/đếm lên/giới hạn toàn phiên, điểm tùy chọn, hoàn thành vòng và kết quả.

## Cài đặt trên máy

Yêu cầu Node.js 22 trở lên và npm.

```bash
git clone https://github.com/huynhtrandanthanh1611-spec/khung-anh-bi-mat.git
cd khung-anh-bi-mat
npm ci
cp .env.example .env.local
```

Repo riêng tư yêu cầu tài khoản GitHub có quyền truy cập khi clone. Không đặt mật khẩu hoặc token trong URL.

### 1. Tạo Supabase

1. Tạo một dự án tại https://supabase.com/dashboard.
2. Mở SQL Editor, chạy toàn bộ [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) **một lần**. Migration tạo bảng, hàm lưu nguyên tử và bucket `game-assets` riêng tư.
3. Trong Authentication → Providers, bật Email. Có thể giữ xác nhận email. Với sử dụng thực tế, cấu hình SMTP để email xác nhận gửi ổn định; giới hạn gửi mặc định tùy dịch vụ.
4. Trong Authentication → URL Configuration, đặt Site URL là tên miền triển khai; thêm `http://localhost:3000/teacher` và `https://TEN-MIEN-CUA-BAN/teacher` vào Redirect URLs.
5. Lấy Project URL, publishable/anon key và service role key trong cài đặt API của dự án.

### 2. Biến môi trường

Điền `.env.local` theo `.env.example`:

| Biến                            | Ý nghĩa                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL dự án Supabase                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable hoặc legacy anon key cho đăng nhập ở trình duyệt |
| `SUPABASE_SERVICE_ROLE_KEY`     | Secret service role key chỉ dùng trên server                 |

**Không đưa service role key vào biến có tiền tố `NEXT_PUBLIC_`, GitHub, ảnh chụp hay chat.** Nhập trực tiếp trong file môi trường cục bộ hoặc kho secrets của nơi triển khai. `.env.local` đã được gitignore. Chỉ các giá trị public được nhúng vào bản build; build lại sau khi đổi chúng.

### 3. Chạy

```bash
npm run dev
```

Mở http://localhost:3000. Chọn “Dành cho giáo viên”, đăng ký, xác nhận email và đăng nhập.

## Kiểm tra và build production

```bash
npm run test
npm run typecheck
npm run build
npm start
```

Kiểm thử tự động bao phủ hoán vị mảnh ghép, giới hạn lưới, hàng/cột độc lập, ID vòng trùng, điểm phạt và tính vị trí ảnh. Kiểm tra end-to-end với Auth, Postgres và Storage thật cần dự án Supabase đã cấu hình. Danh sách kiểm tra thực tế ở [`docs/acceptance.md`](docs/acceptance.md).

## Triển khai

Có thể chạy trên một máy chủ Node.js hoặc nền tảng hỗ trợ Next.js server (ví dụ Vercel). Đây **không phải** ứng dụng xuất tĩnh, nên không triển khai bằng GitHub Pages.

1. Kết nối kho này với nền tảng triển khai Next.js, hoặc clone lên máy chủ Node 22+.
2. Cấu hình ba biến môi trường ở trên. Chạy migration trước lần sử dụng đầu tiên.
3. Lệnh cài đặt `npm ci`, build `npm run build`, start `npm start` (máy chủ Node).
4. Bật HTTPS cho tên miền. Nếu tự quản lý reverse proxy, cho phép multipart request khoảng 4.2 MiB và đặt giới hạn/rate limit phù hợp.
5. Thêm URL callback `/teacher` của tên miền vào Supabase Auth.
6. Để website cho học sinh truy cập, tắt lớp bảo vệ đăng nhập của **nền tảng hosting** cho tên miền chơi. Xác thực giáo viên trong ứng dụng vẫn được giữ nguyên. Repo GitHub có thể giữ **Private**.
7. Chạy thử từ một cửa sổ ẩn danh/thiết bị khác trước khi đưa vào lớp. Thử QR bằng điện thoại.

Các endpoint xử lý upload và nhân bản chạy Node.js, không phải Edge. Upload giới hạn 4 MiB để phù hợp nhiều nền tảng; xác nhận giới hạn/tài nguyên/gói dịch vụ của nơi triển khai. Chi phí hosting, lưu trữ và email do tài khoản dịch vụ quyết định; mã nguồn không tự đăng ký dịch vụ trả phí.

## Dữ liệu và bảo mật

Xem [`docs/architecture.md`](docs/architecture.md).

- Server xác minh JWT bằng `auth.getUser(token)` trên mọi API giáo viên và luôn kiểm tra `teacher_id`.
- `games` và `puzzle_rounds` bật RLS, thu hồi quyền `anon`/`authenticated`; không có policy công khai bản nháp. Chỉ service role trên server truy cập dữ liệu.
- Bucket riêng tư; không lưu Base64 trong database. Ảnh được xác minh chữ ký, giải mã lại và chuyển WebP giữ tỷ lệ, tối đa 2560 px/cạnh. Ảnh nguồn không quá 40 triệu pixel.
- Student API chỉ lấy snapshot đã xuất bản, trả DTO tối thiểu và URL tệp có thời hạn 1 giờ. Không trả thông tin giáo viên, bản nháp hay vòng tắt.
- Sau khi tạm ẩn, lượt truy cập mới bị chặn. Phiên chơi đã tải có thể tiếp tục; URL tệp đã cấp có thể dùng đến khi hết hạn. Không xem mã trò chơi là mật khẩu cho nội dung nhạy cảm.
- Thay/xóa ảnh của bản nháp giữ tệp cũ để bản xuất bản đang dùng không bị hỏng. Khi xóa cả trò chơi, server dọn toàn bộ thư mục tệp. Quản trị viên nên theo dõi dung lượng; nếu xóa người dùng trực tiếp trong Auth hoặc thao tác Storage lỗi, cần dọn tệp mồ côi thủ công. Không tự xóa tệp đang tham chiếu bởi snapshot.
- Không lưu điểm/tên học sinh ở MVP. Điểm tính tại trình duyệt, không dùng làm kết quả thi có giám sát.

## Cấu trúc chính

```text
app/                         Trang và API Next.js
  login/page.tsx             Đăng ký / đăng nhập giáo viên
  teacher/page.tsx           Danh sách trò chơi
  teacher/games/[id]/edit/   Chỉnh sửa trò chơi
  play/[code]/page.tsx       Giao diện học sinh
components/teacher/          Dashboard, Editor, RoundCard, ShareDialog
components/student/          Luồng bắt đầu → vòng chơi → kết quả
components/puzzle/           PuzzleBoard và điều khiển Pointer Events
lib/client.ts                Client Auth và API bearer token
lib/server.ts                Auth, quyền sở hữu, Storage, DTO học sinh
lib/useDraft.ts              Autosave tuần tự + kiểm tra version
lib/rules.ts                 Validation và quy tắc puzzle
supabase/migrations/         Database + quyền truy cập
```

Thay giới hạn hàng/cột trong `lib/rules.ts` **và** constraint SQL tương ứng. Không có `numberOfRounds`: tổng số vòng và số vòng đang bật được suy ra từ danh sách ảnh.
