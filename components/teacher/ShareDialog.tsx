import { useEffect, useState } from "react";
import { Modal } from "@/components/shared";
import {
  createShare,
  disableShare,
  shareAvailable,
  shareKey,
  shareLink,
  type ShareKey,
} from "@/lib/sharing";
import type { Game } from "@/types/game";
export default function ShareDialog({
  game,
  onClose,
}: {
  game: Game;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState<ShareKey | null>(() => shareKey(game.id)),
    [busy, setBusy] = useState(true),
    [message, setMessage] = useState("Đang kiểm tra…"),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = shareKey(game.id);
        if (current && !(await shareAvailable(current.id))) {
          localStorage.removeItem(`khung-anh-share:${game.id}`);
          if (active) setSaved(null);
        }
        if (active) setMessage("");
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [game.id]);
  async function toggle() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (saved) {
        await disableShare(game.id);
        setSaved(null);
        setMessage("Đã tắt chia sẻ. Link cũ không còn hoạt động.");
      } else {
        setSaved(await createShare(game, setMessage));
        setMessage("Link đã sẵn sàng!");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const link = saved ? shareLink(saved.id) : "";
  return (
    <Modal
      title="Chia sẻ trò chơi"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>
        Khi bật, ảnh và nội dung trò chơi được lưu trực tuyến để người có link
        mở vào chơi.
      </p>
      <label className="share-switch">
        <input
          type="checkbox"
          checked={Boolean(saved)}
          disabled={busy}
          onChange={() => void toggle()}
        />{" "}
        Cho phép chia sẻ trò chơi
      </label>
      {saved && (
        <>
          <label className="share-url">
            Link trò chơi
            <input
              aria-label="Link trò chơi"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <div className="button-row">
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setMessage("Đã sao chép link!");
                } catch {
                  setError("Hãy chọn link ở trên rồi nhấn Ctrl+C để sao chép.");
                }
              }}
            >
              Sao chép link
            </button>
            <a
              className="button soft"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở thử
            </a>
          </div>
          <p className="share-note">
            Link chứa bản game tại lúc bật chia sẻ. Muốn chia sẻ bản đã sửa, hãy
            tắt rồi bật lại để tạo link mới.
          </p>
        </>
      )}
      <p className="share-note">
        Dùng trình duyệt này để tắt link khi cần. Người nhận không thấy phần
        chỉnh sửa.
      </p>
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </Modal>
  );
}
