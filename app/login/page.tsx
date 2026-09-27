"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Puzzle } from "lucide-react";
import { authClient } from "@/lib/client";
export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const auth = authClient().auth;
      const result =
        mode === "login"
          ? await auth.signInWithPassword({ email, password })
          : await auth.signUp({
              email,
              password,
              options: { emailRedirectTo: `${location.origin}/teacher` },
            });
      if (result.error) {
        const text = result.error.message;
        throw new Error(
          text.includes("Invalid login")
            ? "Email hoặc mật khẩu chưa đúng."
            : text.includes("Email not confirmed")
              ? "Hãy xác nhận email trước khi đăng nhập."
              : text.includes("rate limit")
                ? "Đã có nhiều yêu cầu. Hãy thử lại sau vài phút."
                : "Chưa thể đăng nhập hoặc tạo tài khoản. Hãy kiểm tra thông tin và thử lại.",
        );
      }
      if (result.data.session) router.replace("/teacher");
      else
        setMessage(
          "Hãy mở email xác nhận tài khoản, sau đó quay lại đăng nhập.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <Link href="/" className="brand">
        <span className="brand-icon">
          <Puzzle />
        </span>
        Khung ảnh bí mật
      </Link>
      <section className="join-card">
        <span className="eyebrow">PHÒNG GIÁO VIÊN</span>
        <h1>{mode === "login" ? "Chào thầy cô!" : "Tạo tài khoản"}</h1>
        <p>Tạo những giờ học nhiều khám phá.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              minLength={8}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {mode === "signup" && (
            <p className="small muted">Mật khẩu cần ít nhất 8 ký tự.</p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          <button disabled={busy} className="button primary wide">
            {busy
              ? "Đang xử lý…"
              : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"}
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Chưa có tài khoản? Đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </button>
      </section>
    </main>
  );
}
