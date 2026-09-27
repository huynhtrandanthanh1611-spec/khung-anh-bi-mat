"use client";
import { useRef, useState } from "react";
import { Check, Lightbulb } from "lucide-react";
import type { PlayRound } from "@/types/game";
import { shufflePieces, pieceBackground } from "@/lib/rules";
export default function PuzzleBoard({
  round,
  onWrong,
  onCorrect,
  onComplete,
  locked = false,
}: {
  round: PlayRound;
  onWrong: () => void;
  onCorrect: (count: number) => void;
  onComplete: () => void;
  locked?: boolean;
}) {
  const count = round.rows * round.columns;
  const [order] = useState(() => shufflePieces(count)),
    [placed, setPlaced] = useState<Set<number>>(new Set()),
    [selected, setSelected] = useState<number | null>(null),
    [feedback, setFeedback] = useState("Chọn một mảnh, rồi chọn ô cần đặt."),
    [ghost, setGhost] = useState<{
      piece: number;
      x: number;
      y: number;
    } | null>(null),
    [showHint, setShowHint] = useState(false),
    [broken, setBroken] = useState(false);
  const placedRef = useRef(new Set<number>()),
    drag = useRef<{
      piece: number;
      x: number;
      y: number;
      moved: boolean;
    } | null>(null),
    ignoreClick = useRef(false);
  const ratio = round.width / round.height,
    pieceRatio = (ratio * round.rows) / round.columns;
  function place(piece: number, slot: number) {
    if (locked || placedRef.current.has(piece) || placedRef.current.has(slot))
      return;
    if (piece !== slot) {
      setFeedback("Chưa đúng rồi! Em thử một ô khác nhé.");
      onWrong();
      return;
    }
    const next = new Set(placedRef.current);
    next.add(piece);
    placedRef.current = next;
    setPlaced(next);
    setSelected(null);
    setFeedback(
      next.size === count
        ? "Tuyệt vời! Bức ảnh đã hoàn chỉnh."
        : "Chính xác! Tiếp tục nhé.",
    );
    onCorrect(next.size);
    if (next.size === count) onComplete();
  }
  if (broken)
    return (
      <div className="error" role="alert">
        Ảnh chưa tải được. Hãy kiểm tra kết nối rồi{" "}
        <button
          className="text-button"
          onClick={() => {
            setBroken(false);
          }}
        >
          thử lại
        </button>
        .
      </div>
    );
  return (
    <div className="puzzle-workspace">
      <img hidden src={round.imageUrl} alt="" onError={() => setBroken(true)} />
      <div className="puzzle-main">
        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${round.columns},1fr)`,
            aspectRatio: ratio,
            width: `min(100%, ${56 * ratio}vh)`,
          }}
          aria-label="Lưới ghép ảnh"
        >
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              className={`slot ${placed.has(i) ? "correct" : ""} ${selected !== null && !placed.has(i) ? "can-place" : ""}`}
              style={
                placed.has(i)
                  ? pieceBackground(
                      i,
                      round.rows,
                      round.columns,
                      round.imageUrl,
                    )
                  : undefined
              }
              data-slot={i}
              aria-label={
                placed.has(i)
                  ? `Ô ${i + 1}, đã ghép đúng`
                  : `Đặt mảnh vào hàng ${Math.floor(i / round.columns) + 1}, cột ${(i % round.columns) + 1}`
              }
              disabled={locked || placed.has(i)}
              onClick={() => {
                if (selected !== null) place(selected, i);
                else setFeedback("Em chọn một mảnh ảnh trước nhé.");
              }}
            >
              {!placed.has(i) && <span>{i + 1}</span>}
            </button>
          ))}
        </div>
        {round.hint && (
          <div className="hint-area">
            <button
              className="button ghost"
              onClick={() => setShowHint((v) => !v)}
              aria-expanded={showHint}
            >
              <Lightbulb size={18} />
              {showHint ? "Ẩn gợi ý" : "Cần một gợi ý?"}
            </button>
            {showHint && <p>{round.hint}</p>}
          </div>
        )}
        <p className="puzzle-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      </div>
      <aside className="piece-panel">
        <div className="piece-heading">
          <h3>Các mảnh ghép</h3>
          <span>
            <Check size={15} />
            {placed.size}/{count}
          </span>
        </div>
        <p className="small muted">Kéo thả hoặc chạm mảnh → chạm ô.</p>
        <div className="piece-tray">
          {order.map((piece) =>
            placed.has(piece) ? (
              <div
                key={piece}
                className="piece-placeholder"
                style={{ aspectRatio: pieceRatio }}
              >
                <Check size={17} />
              </div>
            ) : (
              <button
                key={piece}
                className={`piece ${selected === piece ? "selected" : ""}`}
                disabled={locked}
                style={{
                  ...pieceBackground(
                    piece,
                    round.rows,
                    round.columns,
                    round.imageUrl,
                  ),
                  aspectRatio: pieceRatio,
                }}
                aria-label={`Mảnh ảnh ${order.indexOf(piece) + 1}`}
                aria-pressed={selected === piece}
                onClick={() => {
                  if (ignoreClick.current) {
                    ignoreClick.current = false;
                    return;
                  }
                  setSelected(piece);
                  setFeedback("Bây giờ chọn một ô trong khung ảnh.");
                }}
                onPointerDown={(e) => {
                  if (locked) return;
                  ignoreClick.current = false;
                  drag.current = {
                    piece,
                    x: e.clientX,
                    y: e.clientY,
                    moved: false,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const current = drag.current;
                  if (!current) return;
                  if (
                    Math.hypot(e.clientX - current.x, e.clientY - current.y) > 7
                  )
                    current.moved = true;
                  if (current.moved)
                    setGhost({ piece, x: e.clientX, y: e.clientY });
                }}
                onPointerCancel={() => {
                  drag.current = null;
                  setGhost(null);
                }}
                onPointerUp={(e) => {
                  const current = drag.current;
                  drag.current = null;
                  setGhost(null);
                  if (!current?.moved) return;
                  ignoreClick.current = true;
                  const slot = document
                    .elementFromPoint(e.clientX, e.clientY)
                    ?.closest("[data-slot]");
                  if (slot)
                    place(
                      current.piece,
                      Number(slot.getAttribute("data-slot")),
                    );
                }}
              />
            ),
          )}
        </div>
      </aside>
      {ghost && (
        <div
          className="drag-ghost"
          style={{
            ...pieceBackground(
              ghost.piece,
              round.rows,
              round.columns,
              round.imageUrl,
            ),
            left: ghost.x,
            top: ghost.y,
            aspectRatio: pieceRatio,
          }}
        />
      )}
    </div>
  );
}
