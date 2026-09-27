# Kiểm tra bản tĩnh

- `npm test`: 10 kiểm thử đạt, bao gồm quy tắc ghép ảnh, tính điểm, lưu cục bộ, xung đột phiên bản, nhân bản, xóa và từ chối gói nhập không hợp lệ.
- `GITHUB_ACTIONS=true npm run build`: TypeScript và Vite production build đạt; đường dẫn asset dùng `/khung-anh-bi-mat/`.
- Không còn thư viện Supabase, Next.js hoặc endpoint máy chủ trong bản triển khai.
- Chưa kiểm tra luồng ảnh/âm thanh trên website đã triển khai: GitHub Pages hiện bị chặn do kho riêng tư trên gói tài khoản hiện tại.
- Cần xác nhận công khai kho hoặc gói GitHub hỗ trợ Pages trước khi xuất bản.
