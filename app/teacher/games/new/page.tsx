"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/client";
export default function NewGame() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  return (
    <main className="center-page">
      <h1>Tạo trò chơi mới</h1>
      <p>Sau khi tạo, hãy thêm ảnh để bắt đầu các vòng chơi.</p>
      <button
        disabled={busy}
        className="button primary"
        onClick={async () => {
          setBusy(true);
          try {
            const game = await api<{ id: string }>("/api/games", {
              method: "POST",
            });
            navigate(`/teacher/edit?id=${game.id}`, { replace: true });
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Đang tạo…" : "Tạo trò chơi"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
