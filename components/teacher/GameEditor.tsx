"use client";
import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Music2,
  Play,
  Send,
  Share2,
  Trash2,
  EyeOff,
  Save,
} from "lucide-react";
import { api } from "@/lib/client";
import { useDraft } from "@/lib/useDraft";
import { saveSchema, MAX_ROUNDS, MAX_FILE_BYTES } from "@/lib/rules";
import type { Game, Round } from "@/types/game";
import { Loading, Modal } from "@/components/shared";
import RoundCard from "./RoundCard";
import ShareDialog from "./ShareDialog";
import StudentGame, { toPreview } from "@/components/student/StudentGame";
type Upload = { path: string; url: string; width: number; height: number };
export default function GameEditor() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || "";
  const { game, error, setError, status, change, flush, serverChange } =
      useDraft(id),
    [busy, setBusy] = useState(false),
    [uploadText, setUploadText] = useState(""),
    [share, setShare] = useState(false),
    [preview, setPreview] = useState<Game | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  const photos = useRef<HTMLInputElement>(null),
    audio = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  function patch(value: Partial<Game>) {
    change((g) => ({ ...g, ...value }));
  }
  function roundPatch(rid: string, value: Partial<Round>) {
    setSelected(rid);
    change((g) => ({
      ...g,
      rounds: g.rounds.map((r) => (r.id === rid ? { ...r, ...value } : r)),
    }));
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setUploadText("");
    }
  }
  async function upload(file: File, kind: "image" | "audio") {
    if (file.size > MAX_FILE_BYTES)
      throw new Error(`${file.name}: tệp vượt quá 4 MB.`);
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return api<Upload>(`/api/games/${id}/upload`, {
      method: "POST",
      body: form,
    });
  }
  async function addPhotos(files: File[]) {
    await run(async () => {
      let remaining = MAX_ROUNDS - (game?.rounds.length ?? 0);
      const errors: string[] = [];
      if (files.length > remaining)
        errors.push(
          `Mỗi trò chơi tối đa ${MAX_ROUNDS} ảnh. Các ảnh vượt giới hạn chưa được tải lên.`,
        );
      for (const [index, file] of files.slice(0, remaining).entries()) {
        setUploadText(
          `Đang tải ảnh ${index + 1} / ${Math.min(files.length, remaining)}…`,
        );
        try {
          const asset = await upload(file, "image"),
            rid = crypto.randomUUID();
          change((g) => ({
            ...g,
            rounds: [
              ...g.rounds,
              {
                id: rid,
                imagePath: asset.path,
                imageUrl: asset.url,
                width: asset.width,
                height: asset.height,
                title: "",
                hint: "",
                completionMessage: "",
                rows: 3,
                columns: 3,
                enabled: true,
              },
            ],
          }));
          setSelected(rid);
        } catch (e) {
          errors.push(`${file.name}: ${(e as Error).message}`);
        }
      }
      if (errors.length) setError(errors.join(" "));
    });
  }
  function move(from: number, to: number) {
    if (from === to || to < 0) return;
    change((g) => {
      const rounds = [...g.rounds];
      const [item] = rounds.splice(from, 1);
      rounds.splice(to, 0, item);
      return { ...g, rounds };
    });
  }
  function showPreview(one?: Round) {
    if (!game) return;
    const candidate = one
      ? { ...game, rounds: [{ ...one, enabled: true }] }
      : game;
    const valid = saveSchema.safeParse(candidate);
    if (!valid.success) {
      setError(
        "Hãy nhập tên trò chơi và số hàng/cột nguyên từ 2 đến 10 trước khi xem thử.",
      );
      return;
    }
    if (!candidate.rounds.some((r) => r.enabled)) {
      setError("Hãy bật ít nhất một vòng để xem thử.");
      return;
    }
    setPreview(candidate);
  }
  async function publish(enabled: boolean) {
    await run(async () => {
      const saved = await flush();
      if (!saved) return;
      const result = await api<{ version: number; status: Game["status"] }>(
        `/api/games/${id}/publish`,
        {
          method: "POST",
          body: JSON.stringify({ version: saved.version, publish: enabled }),
        },
      );
      serverChange(result);
      if (enabled) setShare(true);
    });
  }
  if (!game)
    return (
      <main className="dashboard">
        {error ? (
          <div className="error" role="alert">
            {error}
            <button className="text-button" onClick={() => location.reload()}>
              Tải lại
            </button>
          </div>
        ) : (
          <Loading />
        )}
      </main>
    );
  const active = game.rounds.filter((r) => r.enabled).length,
    focused = game.rounds.find((r) => r.id === selected) || game.rounds[0];
  return (
    <main className="editor">
      <div className="editor-heading">
        <button
          className="icon-button"
          aria-label="Về danh sách trò chơi"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await flush();
              navigate("/teacher");
            })
          }
        >
          <ArrowLeft />
        </button>
        <div className="editor-heading-text">
          <h1>{game.title || "Trò chơi mới"}</h1>
          <span
            className={`save-state ${status.includes("Chưa") ? "pending" : ""}`}
            role="status"
          >
            <Check size={14} />
            {status}
          </span>
        </div>
        <div className="editor-toolbar">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await flush();
              })
            }
          >
            <Save size={17} />
            <span>Lưu ngay</span>
          </button>
          <button
            className="button secondary"
            disabled={busy || !active}
            onClick={() => showPreview()}
          >
            <Play size={17} />
            <span>Xem thử</span>
          </button>
          <button
            className="button primary"
            disabled={busy || !active}
            onClick={() => publish(true)}
          >
            <Send size={17} />
            {game.status === "published" ? "Gửi trò chơi" : "Gửi trò chơi"}
          </button>
        </div>
      </div>
      {error && (
        <div className="error editor-error" role="alert">
          {error}
        </div>
      )}
      {uploadText && (
        <div className="notice" role="status">
          {uploadText}
        </div>
      )}
      <div className="editor-layout">
        <aside className="editor-nav">
          <span className="eyebrow">NỘI DUNG</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("info")?.scrollIntoView();
            }}
          >
            01 <span>Thông tin</span>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("rounds")?.scrollIntoView();
            }}
          >
            02 <span>Các vòng chơi</span>
            <b>{game.rounds.length}</b>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("music")?.scrollIntoView();
            }}
          >
            03 <span>Nhạc nền</span>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("settings")?.scrollIntoView();
            }}
          >
            04 <span>Cài đặt</span>
          </a>
          <div className="round-count">
            <strong>
              {active}
              <small> / {game.rounds.length}</small>
            </strong>
            <p>vòng đang bật</p>
          </div>
          {game.status === "published" && (
            <>
              <button
                className="button secondary wide"
                onClick={() => setShare(true)}
              >
                <Share2 size={17} />
                Chia sẻ
              </button>
              <button
                className="button ghost wide"
                disabled={busy}
                onClick={() => publish(false)}
              >
                <EyeOff size={17} />
                Tạm ẩn trò chơi
              </button>
              <p className="small muted">
                Sửa bản nháp rồi bấm “Gửi trò chơi” để học sinh thấy
                nội dung mới.
              </p>
            </>
          )}
        </aside>
        <fieldset className="editor-form" disabled={busy}>
          <section id="info" className="editor-section">
            <div className="section-heading">
              <span className="section-number">01</span>
              <div>
                <h2>Thông tin trò chơi</h2>
                <p>Đặt tên cho hành trình khám phá của lớp.</p>
              </div>
            </div>
            <label>
              Tên trò chơi <span className="required">*</span>
              <input
                maxLength={150}
                required
                value={game.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Ví dụ: Khám phá thế giới động vật"
              />
            </label>
            <label>
              Mô tả
              <textarea
                rows={3}
                maxLength={1500}
                value={game.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Một lời giới thiệu ngắn cho học sinh…"
              />
            </label>
            <div className="two-cols">
              <label>
                Môn học
                <input
                  maxLength={100}
                  value={game.subject}
                  placeholder="Không bắt buộc"
                  onChange={(e) => patch({ subject: e.target.value })}
                />
              </label>
              <label>
                Lớp
                <input
                  maxLength={50}
                  value={game.grade}
                  placeholder="Không bắt buộc"
                  onChange={(e) => patch({ grade: e.target.value })}
                />
              </label>
            </div>
          </section>
          <section id="rounds" className="editor-section">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <h2>
                  Các vòng chơi{" "}
                  <span className="badge">{game.rounds.length} ảnh</span>
                </h2>
                <p>Một ảnh = một vòng. Kéo tay nắm để đổi thứ tự.</p>
              </div>
            </div>
            {game.rounds.map((r, i) => (
              <RoundCard
                key={r.id}
                round={r}
                index={i}
                count={game.rounds.length}
                onChange={(p) => roundPatch(r.id, p)}
                onMove={move}
                onSelect={() => setSelected(r.id)}
                onPreview={() => showPreview(r)}
                onDelete={() => {
                  if (confirm("Bạn có chắc muốn xóa vòng này?"))
                    change((g) => ({
                      ...g,
                      rounds: g.rounds.filter((item) => item.id !== r.id),
                    }));
                }}
                onReplace={(file) =>
                  run(async () => {
                    const result = await upload(file, "image");
                    roundPatch(r.id, {
                      imagePath: result.path,
                      imageUrl: result.url,
                      width: result.width,
                      height: result.height,
                    });
                  })
                }
              />
            ))}
            <button
              className="upload-zone"
              disabled={game.rounds.length >= MAX_ROUNDS}
              onClick={() => photos.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy) void addPhotos(Array.from(e.dataTransfer.files));
              }}
            >
              <ImagePlus size={30} />
              <strong>
                {game.rounds.length ? "+ Thêm ảnh" : "Thêm bức ảnh đầu tiên"}
              </strong>
              <span>Kéo ảnh vào đây hoặc bấm để chọn nhiều ảnh</span>
              <small>
                JPG, PNG, WEBP · tối đa 4 MB/ảnh · tối đa {MAX_ROUNDS} ảnh
              </small>
            </button>
            <input
              ref={photos}
              hidden
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                void addPhotos(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
            {!active && game.rounds.length > 0 && (
              <p className="error">
                Bạn cần bật ít nhất một vòng chơi trước khi xuất bản.
              </p>
            )}
          </section>
          <section id="music" className="editor-section">
            <div className="section-heading">
              <span className="section-number">03</span>
              <div>
                <h2>Nhạc nền</h2>
                <p>Âm nhạc bắt đầu khi học sinh bấm “Bắt đầu”.</p>
              </div>
            </div>
            <input
              hidden
              ref={audio}
              type="file"
              accept="audio/mpeg,.mp3"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void run(async () => {
                    setUploadText("Đang tải nhạc…");
                    const result = await upload(file, "audio");
                    patch({
                      musicPath: result.path,
                      musicUrl: result.url,
                      musicEnabled: true,
                    });
                  });
                e.target.value = "";
              }}
            />
            <div className="button-row">
              <button
                className="button secondary"
                onClick={() => audio.current?.click()}
              >
                <Music2 size={18} />
                {game.musicPath ? "Thay nhạc" : "Thêm nhạc MP3"}
              </button>
              {game.musicPath && (
                <button
                  className="button ghost danger"
                  onClick={() => patch({ musicPath: null, musicUrl: null })}
                >
                  <Trash2 size={17} />
                  Xóa nhạc
                </button>
              )}
            </div>
            <p className="small muted">MP3, tối đa 4 MB.</p>
            {game.musicUrl && (
              <audio
                className="music-preview"
                src={game.musicUrl}
                controls
                preload="metadata"
              />
            )}
            <label className="toggle-label setting-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={game.musicEnabled}
                onChange={(e) => patch({ musicEnabled: e.target.checked })}
              />
              Bật nhạc nền
            </label>
            <label>
              Âm lượng: {Math.round(game.musicVolume * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={game.musicVolume * 100}
                onChange={(e) =>
                  patch({ musicVolume: Number(e.target.value) / 100 })
                }
              />
            </label>
          </section>
          <section id="settings" className="editor-section">
            <div className="section-heading">
              <span className="section-number">04</span>
              <div>
                <h2>Cài đặt trải nghiệm</h2>
                <p>Chọn nhịp chơi phù hợp với lớp.</p>
              </div>
            </div>
            <label>
              Đồng hồ
              <select
                value={game.timerMode}
                onChange={(e) =>
                  patch({ timerMode: e.target.value as Game["timerMode"] })
                }
              >
                <option value="none">Không hiển thị thời gian</option>
                <option value="elapsed">Đếm thời gian hoàn thành</option>
                <option value="limit">Giới hạn thời gian toàn trò chơi</option>
              </select>
            </label>
            {game.timerMode === "limit" && (
              <label>
                Giới hạn (phút)
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={game.timeLimit / 60}
                  onChange={(e) =>
                    patch({
                      timeLimit: Math.round(Number(e.target.value) * 60),
                    })
                  }
                />
              </label>
            )}
            <label className="toggle-label setting-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={game.scoreEnabled}
                onChange={(e) => patch({ scoreEnabled: e.target.checked })}
              />
              Bật tính điểm
            </label>
            <p className="small muted">
              Mỗi vòng hoàn thành +100 điểm; đặt sai −5 điểm. Tổng điểm không
              dưới 0.
            </p>
            <label className="toggle-label setting-toggle">
              <input
                type="checkbox"
                role="switch"
                checked={game.sfxEnabled}
                onChange={(e) => patch({ sfxEnabled: e.target.checked })}
              />
              Âm thanh khi ghép đúng và hoàn thành
            </label>
          </section>
        </fieldset>
        <aside className="live-preview">
          <span className="eyebrow">XEM LƯỚI ẢNH</span>
          {focused ? (
            <>
              <h3>
                {focused.title || `Vòng ${game.rounds.indexOf(focused) + 1}`}
              </h3>
              <div
                className="grid-preview"
                style={{ aspectRatio: focused.width / focused.height }}
              >
                <img src={focused.imageUrl} alt="Ảnh với lưới chia mảnh" />
                <div
                  className="grid-overlay"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(10, Math.max(2, focused.columns))},1fr)`,
                  }}
                >
                  {Array.from(
                    {
                      length: Math.min(
                        100,
                        Math.max(4, focused.rows * focused.columns),
                      ),
                    },
                    (_, i) => (
                      <span key={i} />
                    ),
                  )}
                </div>
              </div>
              <strong>
                {focused.rows} hàng × {focused.columns} cột
              </strong>
              <p>{focused.rows * focused.columns} mảnh bằng nhau</p>
              <button
                className="button secondary wide"
                onClick={() => showPreview(focused)}
              >
                <Play size={17} />
                Ghép thử vòng này
              </button>
            </>
          ) : (
            <div className="preview-empty">
              <ImagePlus size={34} />
              <p>Thêm ảnh để xem lưới chia mảnh tại đây.</p>
            </div>
          )}
        </aside>
      </div>
      {share && (
        <ShareDialog
          title={game.title}
          id={game.id}
          code={game.code}
          onClose={() => setShare(false)}
        />
      )}{" "}
      {preview && (
        <Modal
          title="Xem thử — bản nháp hiện tại"
          wide
          onClose={() => setPreview(null)}
        >
          <StudentGame game={toPreview(preview)} preview />
        </Modal>
      )}
    </main>
  );
}
