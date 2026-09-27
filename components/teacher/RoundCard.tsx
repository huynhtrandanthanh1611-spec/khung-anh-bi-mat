"use client";
import { useRef } from "react";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  Replace,
  Play,
  Grid2X2,
} from "lucide-react";
import type { Round } from "@/types/game";
import { MIN_GRID, MAX_GRID, difficulty } from "@/lib/rules";
export default function RoundCard({
  round,
  index,
  count,
  onChange,
  onDelete,
  onReplace,
  onMove,
  onPreview,
  onSelect,
}: {
  round: Round;
  index: number;
  count: number;
  onChange: (patch: Partial<Round>) => void;
  onDelete: () => void;
  onReplace: (file: File) => void;
  onMove: (from: number, to: number) => void;
  onPreview: () => void;
  onSelect: () => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    drag = useRef(false);
  return (
    <article
      className={`round-card ${round.enabled ? "" : "round-off"}`}
      data-round-index={index}
    >
      <div className="round-top">
        <button
          className="icon-button grip"
          aria-label={`Kéo để di chuyển vòng ${index + 1}`}
          onPointerDown={(e) => {
            drag.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag.current) {
              if (e.clientY < 90) window.scrollBy(0, -12);
              if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 12);
            }
          }}
          onPointerCancel={() => {
            drag.current = false;
          }}
          onPointerUp={(e) => {
            if (!drag.current) return;
            drag.current = false;
            const target = document
              .elementFromPoint(e.clientX, e.clientY)
              ?.closest("[data-round-index]");
            if (target)
              onMove(index, Number(target.getAttribute("data-round-index")));
          }}
        >
          <GripVertical size={20} />
        </button>
        <strong>Vòng {index + 1}</strong>
        <span className="chip">
          {round.rows * round.columns} mảnh ·{" "}
          {difficulty(round.rows * round.columns)}
        </span>
        <label className="toggle-label">
          <input
            type="checkbox"
            role="switch"
            checked={round.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          Hiển thị
        </label>
      </div>
      <div className="round-content">
        <button
          className="round-thumb"
          onClick={onSelect}
          aria-label={`Xem lưới vòng ${index + 1}`}
        >
          <img src={round.imageUrl} alt={`Ảnh vòng ${index + 1}`} />
          <span>
            <Grid2X2 size={15} />
            Xem lưới
          </span>
        </button>
        <div className="round-fields">
          <label>
            Tên vòng
            <input
              placeholder="Ví dụ: Động vật bí ẩn"
              value={round.title}
              maxLength={150}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </label>
          <div className="grid-controls">
            <label>
              Số hàng
              <input
                type="number"
                min={MIN_GRID}
                max={MAX_GRID}
                step={1}
                value={round.rows}
                onChange={(e) => onChange({ rows: Number(e.target.value) })}
              />
            </label>
            <span>×</span>
            <label>
              Số cột
              <input
                type="number"
                min={MIN_GRID}
                max={MAX_GRID}
                step={1}
                value={round.columns}
                onChange={(e) => onChange({ columns: Number(e.target.value) })}
              />
            </label>
          </div>
          <label>
            Gợi ý
            <input
              placeholder="Một gợi ý nhỏ cho học sinh"
              value={round.hint}
              maxLength={500}
              onChange={(e) => onChange({ hint: e.target.value })}
            />
          </label>
          <label>
            Lời nhắn khi hoàn thành
            <input
              placeholder="Chính xác! Đây là…"
              value={round.completionMessage}
              maxLength={500}
              onChange={(e) => onChange({ completionMessage: e.target.value })}
            />
          </label>
        </div>
      </div>
      <div className="round-actions">
        <button className="button ghost" onClick={onPreview}>
          <Play size={16} />
          Xem thử
        </button>
        <button className="button ghost" onClick={() => input.current?.click()}>
          <Replace size={16} />
          Thay ảnh
        </button>
        <input
          hidden
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(file);
            e.target.value = "";
          }}
        />
        <span className="spacer" />
        <button
          className="icon-button"
          disabled={index === 0}
          aria-label="Chuyển vòng lên"
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp size={17} />
        </button>
        <button
          className="icon-button"
          disabled={index === count - 1}
          aria-label="Chuyển vòng xuống"
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown size={17} />
        </button>
        <button
          className="icon-button danger"
          aria-label={`Xóa vòng ${index + 1}`}
          onClick={onDelete}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
