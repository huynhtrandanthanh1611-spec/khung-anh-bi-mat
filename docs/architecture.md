# Kiến trúc và tương thích dữ liệu

React + Vite + HashRouter. Website có màn hình giáo viên (danh sách / editor) và Game Mode thay thế toàn bộ giao diện khi đang chơi. Không có student route hoặc Join flow.

## Dữ liệu

- IndexedDB `khung-anh-bi-mat`, version 1, store `games` và `assets` được giữ nguyên.
- Không cần nâng version hoặc chạy migration phá hủy. Khi đọc game, bổ sung `completionText = completionText ?? completionMessage ?? ""`, `completionImagePath = null` nếu thiếu; trường cũ vẫn được giữ.
- Ảnh chúc mừng lưu Blob giống ảnh chính, tham chiếu qua `completionImagePath`; URL Blob tạo khi đọc.
- Lưu game kiểm tra version trong cùng transaction readwrite để tránh mất dữ liệu giữa hai tab.
- Các trường cũ như code/status/subject/grade/timer/score vẫn có thể nằm trong dữ liệu; không còn xuất hiện trong giao diện hoặc điều khiển game. Tất cả ảnh trong editor tương ứng một vòng.

## Lưới lớn

Số hàng/cột là số nguyên không âm biểu diễn chính xác bằng Number. Tổng và chỉ số mảnh dùng BigInt. Hoán vị affine tạo mảnh theo chỉ số mà không cấp phát danh sách toàn bộ mảnh. Khay chỉ render 12 mảnh/trang; board tới 144 ô dùng nút DOM, lớn hơn dùng canvas. Số đường kẻ canvas phụ thuộc kích thước hiển thị. Cảnh báo trên 400 mảnh không thay đổi dữ liệu hay chặn chơi.

## Fullscreen / âm thanh

Bắt đầu lưu dữ liệu và kiểm tra vòng trước khi vào game. Fullscreen API được gọi nếu khả dụng; nếu bị trình duyệt từ chối, Game Mode vẫn phủ viewport và có nút toàn màn hình để thử bằng thao tác người dùng. Nhạc được giữ trong một Audio instance xuyên suốt các vòng, tắt khi thoát. Không có hệ thống điểm hoặc đếm giờ trong Game Mode.
