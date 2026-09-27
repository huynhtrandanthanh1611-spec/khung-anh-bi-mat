# Kết quả kiểm tra trong môi trường phát triển

- 8 kiểm thử tự động đã đạt: hoán vị mảnh ghép trên các kích thước lưới 2–10, tránh thứ tự gốc, kiểm tra đầu vào, cấu hình vòng độc lập, ID trùng, tính điểm và vị trí ảnh.
- TypeScript strict: đạt.
- Build production Next.js: đạt.
- Kiểm tra HTTP từ server production cục bộ: `/` và `/login` trả 200, tiêu đề đúng; `/api/games` không token trả 401; mã không đúng định dạng trả 404; truy cập mã hợp lệ khi chưa cấu hình Supabase trả 503 có thông báo.

**Chưa kiểm tra được** đăng nhập/upload/publish end-to-end với Supabase thật do chưa có dự án và biến môi trường. Trình duyệt của môi trường không mở được địa chỉ localhost (`ERR_BLOCKED_BY_CLIENT`), nên không tuyên bố đã kiểm tra trực quan responsive, kéo thả hay cảm ứng trên thiết bị thật. Xem `acceptance.md` để thực hiện các bước còn lại sau triển khai.
