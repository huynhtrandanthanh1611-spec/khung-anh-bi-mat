# Kiến trúc bản GitHub Pages

React + Vite, HashRouter và IndexedDB. Trình duyệt xử lý ảnh thành WebP và lưu Blob cục bộ. Không có máy chủ ứng dụng, tài khoản, Supabase hoặc khóa API.

Store `games` chứa cài đặt và vòng chơi; store `assets` chứa ảnh và nhạc. Tệp JSON xuất từ ứng dụng chứa nội dung và ảnh/nhạc để chuyển thiết bị. Khi nhập, ứng dụng tạo ID mới để tránh ghi đè trò chơi hiện có.

Link website mở ứng dụng chung. Mã trò chơi tìm dữ liệu đã lưu trên trình duyệt; không phải mã truy cập vào kho dữ liệu trực tuyến.
