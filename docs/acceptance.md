# Kiểm tra trước khi dùng trong lớp

Các bước dưới đây cần hai tài khoản giáo viên A/B và một cửa sổ ẩn danh. Đây là checklist cần chạy với Supabase thật, không phải kết quả test đã đạt.

- [ ] Chạy migration; đăng ký và xác nhận email; đăng nhập, đăng xuất, hết phiên.
- [ ] A tạo game, tải 3 ảnh với tỷ lệ khác nhau, đặt lưới 2×3, 3×4, 5×5. Tổng mảnh lần lượt 6, 12, 25; ảnh không méo hoặc cắt nội dung.
- [ ] Thêm một tệp sai loại cùng các ảnh hợp lệ. Ảnh hợp lệ vẫn giữ; có thông báo tệp lỗi.
- [ ] Bật/tắt vòng, kéo và dùng nút lên/xuống đổi thứ tự; reload thấy đã lưu.
- [ ] Thay ảnh giữ tên, gợi ý, số hàng/cột, thứ tự và trạng thái.
- [ ] Tắt tất cả vòng: không xuất bản được. Nhập 0, 11, 2.5 hàng/cột: báo lỗi.
- [ ] Xem thử vòng và toàn bộ game chưa xuất bản; không cần ghi dữ liệu học sinh.
- [ ] Sửa hai cửa sổ cùng lúc: cửa sổ có version cũ bị từ chối, không ghi đè.
- [ ] Upload MP3; bắt đầu có nhạc, chuyển vòng nhạc tiếp tục; tắt/bật âm thanh hoạt động.
- [ ] Publish, mở link và QR bằng cửa sổ ẩn danh/điện thoại; chỉ vòng bật xuất hiện, không có công cụ giáo viên.
- [ ] Chỉnh bản nháp sau publish: học sinh vẫn thấy bản cũ đến khi cập nhật bản xuất bản.
- [ ] Tạm ẩn: lượt mở mới không xem được game. Phiên đã tải có thể tiếp tục.
- [ ] Dùng token B gọi GET/PUT/DELETE/upload/publish/clone cho game A: đều bị từ chối. Gọi không token: 401.
- [ ] Dùng anon key gọi trực tiếp bảng games/puzzle_rounds và bucket: không đọc được bản nháp hoặc danh sách tệp.
- [ ] Sao chép path tệp từ game A vào game B qua API: bị từ chối; đường dẫn lạ không xuất bản được.
- [ ] Ghép chuột, cảm ứng, bàn phím; sai không khóa, đúng khóa; hoàn thành và chuyển vòng không đếm trùng.
- [ ] Giới hạn thời gian hết trong khi chơi hoặc nghỉ giữa vòng: kết thúc hợp lý. Tắt thời gian/điểm: không hiện các chỉ số đó.
- [ ] Thử đặt sai 7 lần và hoàn thành 5 vòng: 465 điểm.
- [ ] Kiểm tra 1920×1080, laptop, tablet ngang/dọc, điện thoại và zoom 200%; nút/ảnh không tràn ngang.
- [ ] Nhân bản rồi xóa game gốc: bản sao vẫn dùng ảnh/nhạc độc lập.
- [ ] Mở link của game bị xóa: thông báo không sẵn sàng; kiểm tra thư mục Storage đã dọn.
