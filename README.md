# Khung ảnh bí mật

Website ghép ảnh dành cho lớp học, chạy tĩnh bằng React + Vite trên GitHub Pages.

## Sử dụng

- Vào **Dành cho giáo viên** để tạo trò chơi, thêm ảnh, chia lưới và đặt thời gian.
- Dữ liệu và ảnh được lưu trong IndexedDB của trình duyệt hiện tại. Không cần tài khoản hoặc dịch vụ cơ sở dữ liệu.
- Chọn **Gửi trò chơi → Tải tệp trò chơi** để sao lưu và gửi cho học sinh.
- Học sinh mở website, chọn **Mở tệp trò chơi**, rồi chọn tệp JSON đã nhận.
- Mã trò chơi chỉ mở dữ liệu đã có trong trình duyệt này. Địa chỉ website không tự đồng bộ trò chơi sang thiết bị khác.
- Xóa dữ liệu trình duyệt có thể xóa bản lưu cục bộ; giữ tệp trò chơi đã tải xuống để khôi phục.

## Phát triển

Yêu cầu Node.js 22 trở lên.

```sh
npm ci
npm run dev
npm test
npm run build
```

Bản build nằm trong `dist/`. Không cần biến môi trường hay khóa API.

## GitHub Pages

Workflow `.github/workflows/pages.yml` kiểm tra và build nhánh `main`. Deploy hiện chỉ chạy khi kho công khai; kho riêng tư cần gói GitHub hỗ trợ Pages.

1. Trong Settings → Pages, chọn Source: **GitHub Actions**.
2. Vào Actions → Build and deploy GitHub Pages → Run workflow.
3. Địa chỉ website xuất hiện khi job deploy thành công.

Router sử dụng phần `#` trong URL nên tải lại trang con hoạt động trên hosting tĩnh. Base path được đặt theo tên kho `khung-anh-bi-mat` trong `vite.config.ts`.

## Trạng thái

Bản tĩnh không dùng Supabase, API máy chủ hoặc đăng nhập trực tuyến. Xem `docs/validation.md` để biết phần đã kiểm tra. Tệp `docs/original-requirements.txt` lưu yêu cầu ban đầu; các chức năng tài khoản và đồng bộ trực tuyến trong yêu cầu đó không có trong bản tĩnh này.
