"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ImagePlus,
  Copy,
  Trash2,
  Share2,
  Play,
  ImageIcon,
} from "lucide-react";
import { api } from "@/lib/client";
import type { Game } from "@/types/game";
import { Loading, Modal } from "@/components/shared";
import ShareDialog from "./ShareDialog";
import StudentGame, { toPreview } from "@/components/student/StudentGame";
export default function Dashboard() {
  const [games, setGames] = useState<Game[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [share, setShare] = useState<Game | null>(null),
    [preview, setPreview] = useState<Game | null>(null);
  const router = useRouter();
  async function refresh() {
    setError("");
    try {
      setGames(await api<Game[]>("/api/games"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="dashboard">
      <div className="page-title">
        <div>
          <span className="eyebrow">GÓC SÁNG TẠO</span>
          <h1>Trò chơi của thầy cô</h1>
          <p>Mỗi bức ảnh là một vòng khám phá.</p>
        </div>
        <button
          disabled={busy}
          className="button primary"
          onClick={() =>
            action(async () => {
              const game = await api<Game>("/api/games", { method: "POST" });
              router.push(`/teacher/games/${game.id}/edit`);
            })
          }
        >
          <Plus />
          Tạo trò chơi
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}{" "}
          <button className="text-button" onClick={refresh}>
            Thử lại
          </button>
        </div>
      )}
      {!games && !error && <Loading />}
      {games?.length === 0 && (
        <section className="empty-state">
          <span className="empty-icon">
            <ImagePlus size={48} />
          </span>
          <h2>Bắt đầu từ một bức ảnh</h2>
          <p>
            Bạn chưa có trò chơi nào.
            <br />
            Tạo trò chơi đầu tiên, thêm ảnh và chia sẻ với lớp.
          </p>
        </section>
      )}
      <div className="games-grid">
        {games?.map((g) => (
          <article className="game-card" key={g.id}>
            <div className="card-image">
              {g.rounds[0]?.imageUrl ? (
                <img src={g.rounds[0].imageUrl} alt="" />
              ) : (
                <ImageIcon size={52} />
              )}
              <span className={`status ${g.status}`}>
                {g.status === "published" ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
            <div className="card-body">
              <span className="small muted">
                {[g.subject, g.grade].filter(Boolean).join(" · ") ||
                  "Trò chơi ghép ảnh"}
              </span>
              <h2>
                <Link href={`/teacher/games/${g.id}/edit`}>{g.title}</Link>
              </h2>
              <p>
                {g.rounds.filter((r) => r.enabled).length} / {g.rounds.length}{" "}
                vòng đang bật
              </p>
              <p className="small muted">
                Cập nhật {new Date(g.updatedAt).toLocaleDateString("vi-VN")}
                {g.status === "published" ? ` · ${g.code}` : ""}
              </p>
              <div className="card-actions">
                <Link
                  className="button secondary"
                  href={`/teacher/games/${g.id}/edit`}
                >
                  Chỉnh sửa
                </Link>
                <button
                  className="icon-button"
                  title="Xem thử"
                  aria-label={`Xem thử ${g.title}`}
                  disabled={busy || !g.rounds.some((r) => r.enabled)}
                  onClick={() =>
                    action(async () =>
                      setPreview(await api<Game>(`/api/games/${g.id}`)),
                    )
                  }
                >
                  <Play size={19} />
                </button>
                <button
                  className="icon-button"
                  title="Chia sẻ"
                  aria-label={`Chia sẻ ${g.title}`}
                  disabled={g.status !== "published"}
                  onClick={() => setShare(g)}
                >
                  <Share2 size={19} />
                </button>
                <button
                  className="icon-button"
                  title="Nhân bản"
                  aria-label={`Nhân bản ${g.title}`}
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      const clone = await api<{ id: string }>(
                        `/api/games/${g.id}/clone`,
                        { method: "POST" },
                      );
                      router.push(`/teacher/games/${clone.id}/edit`);
                    })
                  }
                >
                  <Copy size={19} />
                </button>
                <button
                  className="icon-button danger"
                  title="Xóa"
                  aria-label={`Xóa ${g.title}`}
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        `Xóa trò chơi “${g.title}” và các tệp của trò chơi?`,
                      )
                    )
                      void action(async () => {
                        await api(`/api/games/${g.id}`, { method: "DELETE" });
                        await refresh();
                      });
                  }}
                >
                  <Trash2 size={19} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {share && (
        <ShareDialog
          code={share.code}
          title={share.title}
          onClose={() => setShare(null)}
        />
      )}{" "}
      {preview && (
        <Modal title="Xem thử trò chơi" wide onClose={() => setPreview(null)}>
          <StudentGame game={toPreview(preview)} preview />
        </Modal>
      )}
    </main>
  );
}
