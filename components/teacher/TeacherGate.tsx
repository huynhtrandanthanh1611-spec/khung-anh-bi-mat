"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Puzzle, LogOut } from "lucide-react";
import { authClient } from "@/lib/client";
import { Loading } from "@/components/shared";
export default function TeacherGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    try {
      const client = authClient();
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        if (session) setReady(true);
        else {
          setReady(false);
          router.replace("/login");
        }
      });
      return () => subscription.unsubscribe();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [router]);
  if (error)
    return (
      <main className="center-page">
        <h1>Chưa thể mở phòng giáo viên</h1>
        <p role="alert">{error}</p>
        <Link href="/">Về trang chủ</Link>
      </main>
    );
  if (!ready) return <Loading text="Đang mở phòng giáo viên…" />;
  return (
    <>
      <header className="site-header">
        <Link href="/teacher" className="brand">
          <span className="brand-icon">
            <Puzzle />
          </span>
          Khung ảnh bí mật
        </Link>
        <div className="header-actions">
          <span className="muted">Phòng giáo viên</span>
          <button
            className="button ghost"
            onClick={async () => {
              const { error } = await authClient().auth.signOut();
              if (error) setError("Chưa thể đăng xuất. Vui lòng thử lại.");
            }}
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </header>
      {children}
    </>
  );
}
