import { useState } from "react";
import { Download, Copy } from "lucide-react";
import { Modal } from "@/components/shared";
import { exportGame } from "@/lib/client";
export default function ShareDialog({
  id,
  code,
  title,
  onClose,
}: {
  id: string;
  code: string;
  title: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const url = window.location.origin + import.meta.env.BASE_URL;
  return (
    <Modal title="Gửi trò chơi" onClose={onClose}>
      <div className="share-panel">
        <h3>{title}</h3>
        <p>
          Tải tệp trò chơi và gửi cho học sinh. Học sinh mở website, chọn “Mở
          tệp trò chơi” rồi chọn tệp đã nhận.
        </p>
        <button
          className="button primary"
          onClick={async () => {
            try {
              const blob = await exportGame(id);
              const href = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = href;
              a.download = `khung-anh-${code}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(href), 1000);
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          <Download size={18} />
          Tải tệp trò chơi
        </button>
        <label>
          Địa chỉ website
          <input readOnly value={url} />
        </label>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setMessage("Đã sao chép địa chỉ website.");
            } catch {
              setMessage("Hãy sao chép địa chỉ ở trên.");
            }
          }}
        >
          <Copy size={18} />
          Sao chép địa chỉ website
        </button>
        <p className="small muted">
          Ảnh và trò chơi được lưu trên trình duyệt này. Gửi kèm tệp trò chơi để
          mở trên thiết bị khác. Hãy giữ tệp tải xuống để sao lưu.
        </p>
        {message && <p role="status">{message}</p>}
      </div>
    </Modal>
  );
}
