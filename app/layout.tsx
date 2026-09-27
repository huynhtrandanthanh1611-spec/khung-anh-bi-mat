import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Khung ảnh bí mật",
  description:
    "Tự tạo trò chơi ghép ảnh cho lớp học. Mỗi bức ảnh mở ra một khám phá mới.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
