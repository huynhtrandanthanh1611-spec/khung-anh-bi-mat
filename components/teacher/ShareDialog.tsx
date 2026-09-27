"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink } from "lucide-react";
import { Modal } from "@/components/shared";
export default function ShareDialog({
  code,
  title,
  onClose,
}: {
  code: string;
  title: string;
  onClose: () => void;
}) {
  const [qr, setQr] = useState(""),
    [message, setMessage] = useState("");
  const url = `${window.location.origin}/play/${code}`;
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0d2947", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() =>
        setMessage("Chưa tạo được mã QR. Bạn vẫn có thể sao chép đường dẫn."),
      );
  }, [url]);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Đã sao chép!");
    } catch {
      setMessage("Hãy chọn và sao chép đường dẫn bên dưới.");
    }
  }
  return (
    <Modal title="Chia sẻ với học sinh" onClose={onClose}>
      <div className="share-panel">
        <p>{title}</p>
        {qr && (
          <img
            className="qr"
            src={qr}
            width={220}
            height={220}
            alt={`Mã QR trò chơi ${title}`}
          />
        )}
        <span className="muted">Mã trò chơi</span>
        <strong className="share-code">{code}</strong>
        <button className="button secondary" onClick={() => copy(code)}>
          <Copy size={18} />
          Sao chép mã
        </button>
        <label>
          Đường dẫn trò chơi
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
        <div className="button-row">
          <button className="button primary" onClick={() => copy(url)}>
            <Copy size={18} />
            Sao chép link
          </button>
          {qr && (
            <a
              className="button secondary"
              href={qr}
              download={`khung-anh-${code}.png`}
            >
              <Download size={18} />
              Tải QR
            </a>
          )}
          <a
            className="button ghost"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={18} />
            Mở
          </a>
        </div>
        <p className="small muted">
          Học sinh mở link hoặc quét QR, không cần đăng nhập.
        </p>
        {message && <p role="status">{message}</p>}
      </div>
    </Modal>
  );
}
