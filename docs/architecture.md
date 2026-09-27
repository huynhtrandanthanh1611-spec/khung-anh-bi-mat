# Kiến trúc dự án

## Thành phần

Next.js App Router + React + TypeScript. CSS responsive dùng chung với hai cách trình bày: phòng giáo viên dạng workspace, màn chơi học sinh ưu tiên lưới ảnh và nút lớn. `sharp` xác minh/tối ưu ảnh, `file-type` nhận dạng nội dung tệp, `qrcode` tạo QR trong trình duyệt.

Supabase Auth quản lý tài khoản giáo viên. Supabase Postgres lưu dữ liệu. Supabase Storage lưu ảnh/nhạc ở bucket riêng tư. Trình duyệt chỉ tương tác Auth trực tiếp; các thao tác trò chơi đi qua Next.js Route Handlers, dùng bearer token và service role được bảo vệ bằng `server-only`.

## Database

- `auth.users`: tài khoản giáo viên do Supabase Auth quản lý.
- `games`: ID, teacher_id, code duy nhất, status, version, thời gian, `data` (metadata và cấu hình), `published_data` (snapshot khi xuất bản).
- `puzzle_rounds`: một hàng cho mỗi ảnh/vòng, FK game_id, position, đường dẫn ảnh, kích thước, rows, columns, enabled, title, hint, completion_message.
- Không lưu số vòng; suy ra từ vòng hiện có.

Cấu hình trò chơi dùng JSONB để nhóm các tùy chọn mở rộng; các vòng được chuẩn hóa thành bảng riêng để ràng buộc số hàng/cột, thứ tự và quan hệ. API dùng Zod để kiểm tra nội dung JSONB trước khi ghi. `save_game` là một transaction: cập nhật metadata và toàn bộ danh sách vòng, kiểm tra version, rollback mọi thay đổi nếu một phần thất bại.

## Routing

| Route                        | Truy cập / mục đích                              |
| ---------------------------- | ------------------------------------------------ |
| `/`                          | Nhập mã học sinh và lối vào dành cho giáo viên   |
| `/login`                     | Đăng ký, đăng nhập                               |
| `/teacher`, `/teacher/games` | Dashboard sau đăng nhập                          |
| `/teacher/games/new`         | Tạo trò chơi mới                                 |
| `/teacher/games/[id]/edit`   | Editor có kiểm tra sở hữu tại API                |
| `/play/[code]`               | Chỉ màn chơi, không có công cụ giáo viên         |
| `/api/games`                 | GET danh sách / POST tạo, yêu cầu JWT            |
| `/api/games/[id]`            | GET / PUT / DELETE, JWT + sở hữu                 |
| `/api/games/[id]/upload`     | POST multipart, JWT + sở hữu + xác minh nội dung |
| `/api/games/[id]/clone`      | POST sao chép metadata và tệp riêng              |
| `/api/games/[id]/publish`    | POST xuất bản hoặc ẩn, kiểm tra version và tệp   |
| `/api/play/[code]`           | GET snapshot đã xuất bản; không cần tài khoản    |

## Cây giao diện

- `TeacherGate` → `Dashboard` → thẻ trò chơi / `ShareDialog` / preview.
- `TeacherGate` → `GameEditor` → thông tin / danh sách `RoundCard` / nhạc / cài đặt / preview lưới.
- `StudentGame` → màn bắt đầu / `PuzzleBoard` / hoàn thành vòng / kết quả.
- `PuzzleBoard` → khung ô đích và khay mảnh xáo trộn; dùng background-image đúng tỷ lệ.

## State và luồng dữ liệu

1. Giáo viên đăng nhập. JWT được Supabase client quản lý; server xác minh với Auth trước mỗi thao tác.
2. Editor tải game đã xác thực. Upload trả path + kích thước + signed URL; mỗi ảnh thêm một Round vào state.
3. State thay đổi → debounce 800 ms → PUT. Autosave tuần tự và optimistic version ngăn ghi đè khi nhiều tab cùng sửa. Nếu xung đột, cần tải lại; không tự ghi đè.
4. Xem thử lấy state hiện tại, chỉ lọc vòng bật, không gọi xuất bản và không lưu kết quả học sinh.
5. Xuất bản chờ lưu xong, kiểm tra số vòng bật, cấu hình và tệp; lưu snapshot với compare-and-swap version. Chỉnh bản nháp tiếp theo không đổi snapshot.
6. Học sinh mở code → API tìm Published → DTO tối thiểu với signed URL → bắt đầu bằng click → nhạc và đồng hồ khởi động.
7. Các mảnh xáo trộn bằng Fisher–Yates, không giữ nguyên toàn bộ thứ tự gốc. Đúng vị trí thì khóa; sai tăng số lần sai và giữ mảnh ở khay. Hoàn thành mới chuyển vòng theo nút.
8. Đồng hồ dùng thời gian thực kể từ bắt đầu để không sai do tab nền. Điểm = max(0, 100 × vòng hoàn thành − 5 × số lần sai).

## Giới hạn có chủ ý của MVP

Chưa có lớp học, leaderboard, thi đấu thời gian thực hoặc lưu thành tích. Chưa có tài nguyên cloud được tạo sẵn. URL ảnh có thời hạn 1 giờ; phiên editor để lâu cần tải lại. Kiểm tra cảm ứng và các dịch vụ thật phải được thực hiện sau cấu hình theo acceptance checklist. Deployment là bước riêng với repo: tạo repo không tự tạo URL chơi game.
