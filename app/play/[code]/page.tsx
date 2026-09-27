"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { PlayGame } from "@/types/game";
import StudentGame from "@/components/student/StudentGame";
import { Loading } from "@/components/shared";
export default function Play({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [game, setGame] = useState<PlayGame | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/play/${encodeURIComponent(code)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Không mở được trò chơi.");
        setGame(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [code]);
  if (error)
    return (
      <main className="center-page">
        <h1>Chưa mở được trò chơi</h1>
        <p role="alert">{error}</p>
        <Link className="button primary" href="/">
          Nhập lại mã
        </Link>
        <button className="button secondary" onClick={() => location.reload()}>
          Thử lại
        </button>
      </main>
    );
  return game ? (
    <StudentGame game={game} />
  ) : (
    <Loading text="Đang mở bức ảnh bí mật…" />
  );
}
