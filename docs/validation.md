# Kiểm tra bản mầm non

- 15 kiểm thử tự động đạt: dữ liệu cũ, lưu đồng thời, lưới 0/1/100 và lớn hơn, hoán vị lười, snap tolerance, giữ lời nhắn và ảnh chúc mừng.
- TypeScript + Vite build đạt với base path của GitHub Pages.
- Giao diện dùng Pointer Events (chuột / touch) và chọn mảnh → chọn ô; kiểm tra trên thiết bị cảm ứng thực tế vẫn nên thực hiện trước giờ dạy.
- Xem danh sách kiểm tra trình duyệt trong `docs/acceptance.md`.

## Kiểm tra website đã triển khai (27/09/2026)

- GitHub Actions build/deploy bản `a63171a` thành công; trang chính mở trực tiếp danh sách giáo viên.
- Đã tạo trò chơi thử, tải ảnh chính và ảnh chúc mừng, nhập lời nhắn; dữ liệu vẫn còn khi thoát game về editor.
- Nhập 0 hàng: lưu được, có hướng dẫn và không bắt đầu.
- Nhập 100×100: giữ nguyên 10.000 mảnh, có cảnh báo; Game Mode dùng 1 canvas và chỉ 12 nút mảnh tại một thời điểm.
- Lưới 2×2: đã thử ghép nhầm, kéo thả bằng chuột, chọn mảnh/chọn ô, hoàn thành vòng, lời nhắn + ảnh thưởng, Tiếp tục, hoàn thành toàn bộ, Chơi lại và xác nhận Thoát.
- Game Mode không có phần tử giao diện quản trị; không có thanh cuộn ở viewport kiểm tra 1363×936.
- Fullscreen hệ thống chưa xác nhận được trong trình duyệt kiểm tra; chế độ phủ viewport hoạt động. Chưa kiểm tra trên tablet/bảng tương tác thật hoặc nghe thử nhạc trên loa của giáo viên.
