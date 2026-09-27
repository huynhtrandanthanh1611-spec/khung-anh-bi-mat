# Khung ảnh bí mật

Trò chơi ghép ảnh cho lớp mầm non, dùng trực tiếp trên máy của giáo viên.

Website: https://huynhtrandanthanh1611-spec.github.io/khung-anh-bi-mat/

## Cách dùng

1. Chọn **Tạo trò chơi**, đặt tên và **Thêm ảnh**. Một ảnh là một vòng.
2. Chỉnh số hàng/cột. Có thể thêm lời nhắn, ảnh chúc mừng và nhạc MP3.
3. Bấm **BẮT ĐẦU TRÒ CHƠI**. Toàn bộ màn hình chuyển sang trò chơi.
4. Kéo mảnh hoặc chạm mảnh rồi chạm ô. Hoàn thành vòng thì bấm **Tiếp tục**.
5. Nút **Thoát** ở góc trên yêu cầu xác nhận trước khi quay lại chỉnh sửa.

Không có mã tham gia, chia sẻ, trang học sinh, điểm số hay quy trình xuất bản trò chơi. Website không dùng Supabase hay đăng nhập trực tuyến. Dữ liệu tự lưu trong IndexedDB trên trình duyệt đang dùng; xóa dữ liệu trình duyệt có thể xóa trò chơi.

## Hàng và cột

Input nhận số nguyên từ 0, không có mức tối đa cố định trong giao diện. 0 là chưa thiết lập và không cho bắt đầu. Số cần biểu diễn chính xác bằng kiểu số của JavaScript. Tổng mảnh dùng BigInt; lưới lớn chỉ hiện cảnh báo, không sửa giá trị đã nhập. Khay hiển thị tối đa 12 mảnh mỗi trang; lưới lớn dùng canvas để tránh hàng nghìn nút trên màn hình. Lưới cực lớn có các ô rất nhỏ nên không phù hợp để trẻ thao tác.

## Dữ liệu cũ

Giữ nguyên tên database `khung-anh-bi-mat`, version 1 và các store `games`, `assets`. `completionMessage` cũ được đọc thành `completionText` khi trường mới chưa tồn tại. Ảnh chúc mừng mặc định trống. Không xóa hay tạo lại database. Xem `docs/architecture.md`.

## Phát triển

Node.js 22 trở lên:

```sh
npm ci
npm run dev
npm test
npm run build
```

GitHub Actions build thư mục `dist/` rồi triển khai GitHub Pages khi push `main`. Đường dẫn dùng HashRouter. Không cần API key hay biến môi trường.

### Hàng bằng 0 và phần thưởng

0 hàng nghĩa là chỉ chia theo cột; ví dụ 0×5 tạo 5 mảnh dọc. Giá trị 0 được giữ nguyên khi lưu. Mỗi vòng có lời nhắn tự nhập, ảnh của cô (chọn tệp, kéo thả hoặc click vùng ảnh rồi Ctrl+V), và sticker tùy chọn. Sticker ngẫu nhiên tránh lặp hai vòng liền nhau; có thể chọn cố định. Ảnh clipboard phải là dữ liệu ảnh, không phải đường dẫn hoặc văn bản URL.

### Chia sẻ trò chơi

Bấm Chia sẻ → bật Cho phép chia sẻ → Sao chép link. Người nhận mở thẳng Game Mode ở #/play/:id, không cần tài khoản. Bản chia sẻ chứa ảnh, lời nhắn, sticker và nhạc bật tại lúc tạo; sửa game local không tự thay đổi bản đã chia sẻ. Tắt rồi bật để tạo bản mới. Mỗi bản tối đa 12 MB. Quyền thu hồi link được giữ trên trình duyệt tạo link; không đưa khóa quản lý vào link công khai. Xóa game local sẽ thu hồi link đang quản lý trước. Link đã tắt bị từ chối ở máy chủ; phiên đang chơi kiểm tra mỗi 5 giây khi có kết nối. Nội dung đã tải xuống trước đó không thể thu hồi khỏi thiết bị người nhận.

Frontend vẫn GitHub Pages. Dịch vụ chia sẻ riêng dùng Sites + R2, không Supabase: `appgprj_6ab8b303a3688191a7da3bec448b0a59`. Nguồn dịch vụ được lưu trong kho Sites riêng; API không cung cấp danh sách game hay thao tác sửa cho người chỉ có link.
