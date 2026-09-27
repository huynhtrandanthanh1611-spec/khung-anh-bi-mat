"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Puzzle, ArrowRight, GraduationCap, KeyRound } from "lucide-react";
export default function Home() {
  const [code, setCode] = useState(""),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <div className="home">
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Puzzle />
          </span>
          Khung ảnh bí mật
        </Link>
        <Link className="button ghost" href="/teacher">
          <GraduationCap size={20} />
          Dành cho giáo viên
        </Link>
      </header>
      <main className="join-layout">
        <div>
          <span className="eyebrow">CÙNG KHÁM PHÁ</span>
          <h1>
            Bức ảnh bí mật
            <br />
            đang chờ <em>bạn!</em>
          </h1>
          <p className="lead">Ghép từng mảnh nhỏ, khám phá cả thế giới.</p>
          <div className="join-note">
            <span>01</span> Nhập mã của thầy cô <span>02</span> Bắt đầu ghép ảnh
          </div>
        </div>
        <section className="join-card">
          <span className="circle-icon">
            <KeyRound />
          </span>
          <h2>Vào trò chơi</h2>
          <p>Nhập mã trò chơi mà thầy cô đã chia sẻ.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = code.trim().toUpperCase();
              if (!/^[A-Z0-9]{8}$/.test(value)) {
                setError("Mã trò chơi gồm 8 chữ cái hoặc chữ số.");
                return;
              }
              router.push(`/play/${value}`);
            }}
          >
            <label htmlFor="game-code">Mã trò chơi</label>
            <input
              id="game-code"
              className="code-input"
              placeholder="VD: AB12CD34"
              autoComplete="off"
              maxLength={8}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide">
              Tham gia <ArrowRight size={19} />
            </button>
          </form>
          <p className="muted small">Không cần tài khoản. Sẵn sàng khám phá!</p>
        </section>
      </main>
      <footer className="home-footer">Mỗi mảnh ghép, một điều thú vị.</footer>
    </div>
  );
}
