import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchSharedGame, shareAvailable } from "@/lib/sharing";
import type { Game } from "@/types/game";
import GameMode from "./GameMode";
export default function SharedPlayer() {
  const { shareId = "" } = useParams();
  const [game, setGame] = useState<Game | null>(null),
    [error, setError] = useState(""),
    [exited, setExited] = useState(false),
    [retry, setRetry] = useState(0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  useEffect(() => {
    let alive = true;
    setGame(null);
    setError("");
    setExited(false);
    fetchSharedGame(shareId)
      .then((g) => {
        if (alive) setGame(g);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    const check = async () => {
      try {
        if (!(await shareAvailable(shareId)) && alive) {
          setGame(null);
          setError("Thầy cô đã tắt chia sẻ trò chơi này.");
        }
      } catch {
        /* Preserve current play during temporary network loss. */
      }
    };
    const timer = setInterval(() => void check(), 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [shareId, retry]);
  useEffect(() => {
    if (!game?.musicEnabled || !game.musicUrl) {
      setAudio(null);
      return;
    }
    const a = new Audio(game.musicUrl);
    a.loop = true;
    a.volume = game.musicVolume;
    setAudio(a);
    return () => {
      a.pause();
      a.src = "";
    };
  }, [game]);
  if (game && !exited)
    return (
      <GameMode
        key={`${shareId}-${retry}`}
        game={game}
        audio={audio}
        onExit={() => {
          audio?.pause();
          setExited(true);
          if (document.fullscreenElement)
            void document.exitFullscreen().catch(() => {});
        }}
      />
    );
  return (
    <main className="shared-message">
      <h1>Khung ảnh bí mật</h1>
      <p role="status">
        {error ||
          (exited ? "Hẹn gặp lại ở giờ chơi tiếp theo!" : "Đang mở trò chơi…")}
      </p>
      {(error || exited) && (
        <button
          className="button primary"
          onClick={() => setRetry((v) => v + 1)}
        >
          {exited ? "Chơi lại" : "Thử lại"}
        </button>
      )}
    </main>
  );
}
