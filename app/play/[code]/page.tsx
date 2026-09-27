import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PlayGame } from "@/types/game";
import StudentGame from "@/components/student/StudentGame";
import { Loading } from "@/components/shared";
import { loadPublished } from "@/lib/client";

export default function Play() {
  const { code = "" } = useParams();
  const [game, setGame] = useState<PlayGame | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadPublished(code).then((value) => active && setGame(value)).catch((e) => active && setError(e.message));
    return () => { active = false; };
  }, [code]);
  if (error) return <main className="center-page"><h1>Chưa mở được trò chơi</h1><p role="alert">{error}</p><Link className="button primary" to="/">Nhập lại mã</Link><button className="button secondary" onClick={() => location.reload()}>Thử lại</button></main>;
  return game ? <StudentGame game={game} /> : <Loading text="Đang mở bức ảnh bí mật…" />;
}
