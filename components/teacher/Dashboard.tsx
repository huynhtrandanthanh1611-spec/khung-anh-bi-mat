import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Pencil, Trash2, ImagePlus, Puzzle } from "lucide-react";
import { api } from "@/lib/client";
import { playableError } from "@/lib/puzzle";
import { Loading, Modal } from "@/components/shared";
import { Rainbow, Sun } from "@/components/game/Decor";
import type { Game } from "@/types/game";
import type { StartGame } from "@/src/main";
export default function Dashboard({ onPlay }: { onPlay: StartGame }) {
  const [games, setGames] = useState<Game[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState<Game | null>(null);
  const navigate = useNavigate();
  async function refresh() {
    try {
      setGames(await api<Game[]>("/api/games"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const g = await api<Game>("/api/games", { method: "POST" });
      navigate(`/teacher/edit?id=${g.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="teacher-shell">
      <header className="teacher-header">
        <a className="brand" href="#/">
          <span className="brand-mark">
            <Puzzle />
          </span>
          Khung ảnh bí mật
        </a>
        <span className="local-note">Góc sáng tạo của thầy cô</span>
      </header>
      <main className="dashboard">
        <section className="teacher-hero">
          <div>
            <span className="eyebrow">CÙNG CON KHÁM PHÁ</span>
            <h1>
              Một bức ảnh,
              <br />
              cả một <em>cuộc phiêu lưu.</em>
            </h1>
            <p>Thêm ảnh, chọn số mảnh và cùng các con ghép hình.</p>
            <button className="button primary" disabled={busy} onClick={create}>
              <Plus size={21} />
              Tạo trò chơi
            </button>
          </div>
          <div className="hero-art">
            <Sun />
            <Rainbow />
            <span className="sticker star-one">✦</span>
            <span className="sticker star-two">✦</span>
          </div>
        </section>
        <section className="game-library">
          <div className="section-heading">
            <h2>Trò chơi của tôi</h2>
            {games && <span>{games.length} trò chơi</span>}
          </div>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          {!games && !error && <Loading />}
          {games?.length === 0 && (
            <div className="empty-state">
              <div className="empty-picture">
                <ImagePlus size={42} />
              </div>
              <h3>Bắt đầu từ một bức ảnh nhé!</h3>
              <p>Tạo trò chơi đầu tiên của thầy cô.</p>
            </div>
          )}
          <div className="games-grid">
            {games?.map((g, i) => (
              <article className="game-card" key={g.id}>
                <div className={`game-cover cover-${i % 3}`}>
                  {g.rounds[0]?.imageUrl ? (
                    <img src={g.rounds[0].imageUrl} alt="" />
                  ) : (
                    <Puzzle size={62} />
                  )}
                  <span className="round-count">{g.rounds.length} vòng</span>
                </div>
                <div className="game-card-content">
                  <h3>{g.title}</h3>
                  <div className="game-card-actions">
                    <button
                      className="button primary small"
                      onClick={() => {
                        const problem = playableError(g);
                        if (problem) setError(problem);
                        else onPlay(g);
                      }}
                    >
                      <Play size={18} fill="currentColor" />
                      Chơi
                    </button>
                    <button
                      className="button soft small"
                      onClick={() => navigate(`/teacher/edit?id=${g.id}`)}
                    >
                      <Pencil size={17} />
                      Chỉnh sửa
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Xóa ${g.title}`}
                      onClick={() => setDeleting(g)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <p className="storage-note">
          Trò chơi được tự lưu trên trình duyệt này. Thầy cô dùng cùng thiết bị
          để mở lại.
        </p>
      </main>
      {deleting && (
        <Modal title="Xóa trò chơi?" onClose={() => setDeleting(null)}>
          <p>
            “{deleting.title}” và các ảnh của trò chơi sẽ bị xóa trên thiết bị
            này.
          </p>
          <div className="button-row">
            <button className="button soft" onClick={() => setDeleting(null)}>
              Giữ lại
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(`/api/games/${deleting.id}`, { method: "DELETE" });
                  setDeleting(null);
                  await refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Xóa trò chơi
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
