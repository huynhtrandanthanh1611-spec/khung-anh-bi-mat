import { Link, useNavigate } from "react-router-dom";
import { Puzzle, ArrowLeft } from "lucide-react";

export default function TeacherGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <>
      <header className="site-header">
        <Link to="/teacher" className="brand">
          <span className="brand-icon">
            <Puzzle />
          </span>
          Khung ảnh bí mật
        </Link>
        <div className="header-actions">
          <span className="muted">Lưu trên thiết bị này</span>
          <button className="button ghost" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
            Trang chủ
          </button>
        </div>
      </header>
      {children}
    </>
  );
}
