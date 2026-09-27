import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Music2,
  Play,
  Eye,
  Trash2,
  Check,
  Plus,
} from "lucide-react";
import { api } from "@/lib/client";
import { useDraft } from "@/lib/useDraft";
import { MAX_ROUNDS } from "@/lib/rules";
import { playableError } from "@/lib/puzzle";
import type { Game, Round } from "@/types/game";
import type { StartGame } from "@/src/main";
import { Loading, Modal } from "@/components/shared";
import ShareDialog from "./ShareDialog";
import RoundCard from "./RoundCard";
type Upload = { path: string; url: string; width: number; height: number };
export default function GameEditor({ onPlay }: { onPlay: StartGame }) {
  const [params] = useSearchParams(),
    id = params.get("id") || "",
    navigate = useNavigate();
  const { game, error, setError, status, change, flush } = useDraft(id);
  const [sharing, setSharing] = useState<Game | null>(null);
  const [busy, setBusy] = useState(false),
    [removing, setRemoving] = useState<string | null>(null);
  const images = useRef<HTMLInputElement>(null),
    music = useRef<HTMLInputElement>(null);
  const patch = (v: Partial<Game>) => change((g) => ({ ...g, ...v }));
  const roundPatch = (rid: string, v: Partial<Round>) =>
    change((g) => ({
      ...g,
      rounds: g.rounds.map((r) => (r.id === rid ? { ...r, ...v } : r)),
    }));
  async function run(fn: () => Promise<void>) {
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
  async function upload(file: File, kind: "image" | "audio") {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);
    return api<Upload>(`/api/games/${id}/upload`, { method: "POST", body });
  }
  async function addImages(files: File[]) {
    await run(async () => {
      const room = MAX_ROUNDS - (game?.rounds.length || 0);
      const failures: string[] = [];
      for (const file of files.slice(0, room)) {
        try {
          const v = await upload(file, "image");
          change((g) => ({
            ...g,
            rounds: [
              ...g.rounds,
              {
                id: crypto.randomUUID(),
                imagePath: v.path,
                imageUrl: v.url,
                width: v.width,
                height: v.height,
                rows: 2,
                columns: 2,
                title: "",
                hint: "",
                completionMessage: "",
                completionText: "",
                completionImagePath: null,
                enabled: true,
              },
            ],
          }));
        } catch (e) {
          failures.push(`${file.name}: ${(e as Error).message}`);
        }
      }
      await flush();
      if (files.length > room)
        failures.push(`Mỗi trò chơi lưu tối đa ${MAX_ROUNDS} ảnh.`);
      if (failures.length) throw Error(failures.join(" "));
    });
  }
  async function begin(fullscreen = true) {
    await run(async () => {
      const saved = await flush();
      if (!saved) return;
      const problem = playableError(saved);
      if (problem) throw Error(problem);
      onPlay(saved, fullscreen);
    });
  }
  if (!game)
    return (
      <main className="teacher-main">
        <button className="text-button" onClick={() => navigate("/")}>
          ← Trò chơi của tôi
        </button>
        {error ? (
          <p className="notice error" role="alert">
            {error}
          </p>
        ) : (
          <Loading />
        )}
      </main>
    );
  return (
    <div className="teacher-shell editor-shell">
      <header className="editor-header">
        <button
          className="back-link"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await flush();
              navigate("/");
            })
          }
        >
          <ArrowLeft size={20} />
          Trò chơi của tôi
        </button>
        <span
          className={`save-state ${status === "Đã lưu" ? "saved" : ""}`}
          role="status"
        >
          <Check size={15} />
          {busy ? "Đang xử lý…" : status}
        </span>
      </header>
      <main className="editor-main">
        <div className="editor-heading">
          <span className="eyebrow">MỖI BỨC ẢNH, MỘT ĐIỀU THÚ VỊ</span>
          <h1>Cùng tạo một trò chơi!</h1>
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <fieldset disabled={busy} className="editor-fields">
          <section className="setup-card">
            <label className="game-title-field">
              <span>Tên trò chơi</span>
              <input
                value={game.title}
                maxLength={150}
                placeholder="Ví dụ: Ghép hình động vật"
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <div className="music-section">
              <div className="music-label">
                <span className="music-icon">
                  <Music2 size={22} />
                </span>
                <div>
                  <strong>Nhạc nền</strong>
                  <small>Một giai điệu cho giờ chơi thêm vui</small>
                </div>
              </div>
              {game.musicPath ? (
                <div className="music-settings">
                  <span className="music-filename">
                    {game.musicName || "Nhạc nền.mp3"}
                  </span>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={game.musicEnabled}
                      onChange={(e) =>
                        patch({ musicEnabled: e.target.checked })
                      }
                    />
                    Bật nhạc
                  </label>
                  <label className="volume-field">
                    Âm lượng
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={game.musicVolume}
                      onChange={(e) =>
                        patch({ musicVolume: Number(e.target.value) })
                      }
                    />
                  </label>
                  <button
                    className="icon-button"
                    aria-label="Xóa nhạc"
                    onClick={() =>
                      patch({ musicPath: null, musicUrl: null, musicName: "" })
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <button
                  className="button soft"
                  onClick={() => music.current?.click()}
                >
                  <Plus size={18} />
                  Thêm nhạc
                </button>
              )}
              <input
                hidden
                ref={music}
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    void run(async () => {
                      const v = await upload(file, "audio");
                      patch({
                        musicPath: v.path,
                        musicUrl: v.url,
                        musicName: file.name,
                        musicEnabled: true,
                      });
                      await flush();
                    });
                  e.target.value = "";
                }}
              />
            </div>
          </section>
          <div className="section-heading">
            <div>
              <h2>
                Các vòng chơi{" "}
                <span className="count-badge">{game.rounds.length}</span>
              </h2>
              <p>Thêm một ảnh là thêm một vòng.</p>
            </div>
            <button
              className="button soft"
              onClick={() => images.current?.click()}
            >
              <Plus size={19} />
              Thêm ảnh
            </button>
          </div>
          <div className="rounds-grid">
            {game.rounds.map((r, index) => (
              <RoundCard
                key={r.id}
                round={r}
                index={index}
                onChange={(v) => roundPatch(r.id, v)}
                onDelete={() => setRemoving(r.id)}
                onReplace={(file) =>
                  run(async () => {
                    const v = await upload(file, "image");
                    roundPatch(r.id, {
                      imagePath: v.path,
                      imageUrl: v.url,
                      width: v.width,
                      height: v.height,
                    });
                    await flush();
                  })
                }
                onCompletionImage={(file) =>
                  run(async () => {
                    const v = await upload(file, "image");
                    roundPatch(r.id, {
                      completionImagePath: v.path,
                      completionImageUrl: v.url,
                    });
                    await flush();
                  })
                }
              />
            ))}
            <button
              className="add-round-card"
              onClick={() => images.current?.click()}
            >
              <span>
                <ImagePlus size={34} />
              </span>
              <strong>Thêm ảnh</strong>
              <small>Ảnh nào sẽ được khám phá tiếp theo?</small>
            </button>
          </div>
          <input
            ref={images}
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              void addImages(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />
        </fieldset>
        <div className="editor-bottom-note">Tự lưu trên thiết bị này</div>
      </main>
      <footer className="start-bar">
        <span>
          {game.rounds.length} ảnh · {game.rounds.length} vòng khám phá
        </span>
        <div className="button-row">
          <button
            className="button soft"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const saved = await flush();
                if (saved) setSharing(saved);
              })
            }
          >
            🔗 Chia sẻ
          </button>
          <button
            className="button soft"
            disabled={busy || !game.rounds.length}
            onClick={() => begin(false)}
          >
            <Eye size={20} />
            Xem trước
          </button>
          <button
            className="button primary start-button"
            disabled={busy || !game.rounds.length}
            onClick={() => begin(true)}
          >
            <Play size={23} fill="currentColor" />
            BẮT ĐẦU TRÒ CHƠI
          </button>
        </div>
      </footer>
      {sharing && (
        <ShareDialog game={sharing} onClose={() => setSharing(null)} />
      )}
      {removing && (
        <Modal title="Xóa vòng chơi này?" onClose={() => setRemoving(null)}>
          <p>Ảnh và lời nhắn của vòng này sẽ được bỏ khỏi trò chơi.</p>
          <div className="button-row">
            <button className="button soft" onClick={() => setRemoving(null)}>
              Giữ lại
            </button>
            <button
              className="button danger"
              onClick={() => {
                change((g) => ({
                  ...g,
                  rounds: g.rounds.filter((r) => r.id !== removing),
                }));
                setRemoving(null);
              }}
            >
              Xóa vòng
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
