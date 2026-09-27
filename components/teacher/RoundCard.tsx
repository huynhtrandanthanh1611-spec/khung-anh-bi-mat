import { useRef, useState } from "react";
import {
  Minus,
  Plus,
  ImagePlus,
  MessageCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { Round } from "@/types/game";
import { pieceCount, formatCount } from "@/lib/puzzle";
function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="stepper-field">
      <span>{label}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={`Giảm ${label.toLowerCase()}`}
          disabled={value === 0}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <Minus size={18} />
        </button>
        <input
          aria-label={label}
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => {
            const next = e.target.value === "" ? 0 : Number(e.target.value);
            if (Number.isSafeInteger(next) && next >= 0) {
              setInvalid(false);
              onChange(next);
            } else setInvalid(true);
          }}
        />
        <button
          type="button"
          aria-label={`Tăng ${label.toLowerCase()}`}
          onClick={() => {
            if (Number.isSafeInteger(value + 1)) onChange(value + 1);
            else setInvalid(true);
          }}
        >
          <Plus size={18} />
        </button>
      </div>
      {invalid && (
        <small role="alert">
          Hãy nhập số nguyên từ 0 có thể biểu diễn chính xác.
        </small>
      )}
    </div>
  );
}
export default function RoundCard({
  round,
  index,
  onChange,
  onReplace,
  onCompletionImage,
  onDelete,
}: {
  round: Round;
  index: number;
  onChange: (patch: Partial<Round>) => void;
  onReplace: (f: File) => void;
  onCompletionImage: (f: File) => void;
  onDelete: () => void;
}) {
  const replace = useRef<HTMLInputElement>(null),
    reward = useRef<HTMLInputElement>(null);
  const [textOpen, setTextOpen] = useState(Boolean(round.completionText));
  const count = pieceCount(round.rows, round.columns);
  return (
    <article className="round-card">
      <div className="round-card-heading">
        <span className="round-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3>Vòng {index + 1}</h3>
        <button
          className="icon-button"
          aria-label={`Xóa vòng ${index + 1}`}
          onClick={onDelete}
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div className="round-preview">
        <img src={round.imageUrl} alt={`Ảnh ghép vòng ${index + 1}`} />
        {count > 0n && (
          <div
            className="preview-grid"
            style={{
              backgroundSize: `${100 / round.columns}% ${100 / round.rows}%`,
            }}
          />
        )}
        <button
          className="replace-image"
          onClick={() => replace.current?.click()}
        >
          <RefreshCw size={15} />
          Thay ảnh
        </button>
      </div>
      <input
        ref={replace}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onReplace(f);
          e.target.value = "";
        }}
      />
      <div className="round-card-fields">
        <div className="grid-controls">
          <Stepper
            label="Số hàng"
            value={round.rows}
            onChange={(rows) => onChange({ rows })}
          />
          <span className="times">×</span>
          <Stepper
            label="Số cột"
            value={round.columns}
            onChange={(columns) => onChange({ columns })}
          />
        </div>
        <p className="piece-count">
          {formatCount(count)} <span>mảnh ghép</span>
        </p>
        {count === 0n && (
          <p className="grid-warning" role="status">
            Vui lòng chọn {round.rows === 0 ? "số hàng" : "số cột"} để bắt đầu
            vòng này.
          </p>
        )}
        {count > 400n && (
          <p className="grid-warning" role="status">
            Bạn đang tạo {formatCount(count)} mảnh ghép. Các mảnh sẽ rất nhỏ và
            trò chơi có thể chạy chậm trên thiết bị này.
          </p>
        )}
        <div className="reward-section">
          <span className="field-caption">SAU KHI HOÀN THÀNH</span>
          {textOpen ? (
            <label className="message-field">
              <span>Lời nhắn</span>
              <textarea
                rows={2}
                maxLength={2000}
                placeholder="Giỏi quá! Đây là…"
                value={round.completionText || ""}
                onChange={(e) => onChange({ completionText: e.target.value })}
              />
            </label>
          ) : (
            <button className="reward-add" onClick={() => setTextOpen(true)}>
              <MessageCircle size={18} />
              Thêm lời nhắn
            </button>
          )}
          {round.completionImageUrl ? (
            <div className="reward-thumb">
              <img src={round.completionImageUrl} alt="Ảnh chúc mừng" />
              <button
                className="text-button"
                onClick={() => reward.current?.click()}
              >
                Thay ảnh chúc mừng
              </button>
              <button
                className="icon-button"
                aria-label={`Xóa ảnh chúc mừng vòng ${index + 1}`}
                onClick={() =>
                  onChange({
                    completionImagePath: null,
                    completionImageUrl: null,
                  })
                }
              >
                <X size={17} />
              </button>
            </div>
          ) : (
            <button
              className="reward-add"
              onClick={() => reward.current?.click()}
            >
              <ImagePlus size={18} />
              Thêm ảnh chúc mừng
            </button>
          )}
          <input
            ref={reward}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onCompletionImage(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </article>
  );
}
