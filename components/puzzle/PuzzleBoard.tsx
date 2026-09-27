import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Hand } from "lucide-react";
import type { Round } from "@/types/game";
import {
  effectiveRows,
  pieceCount,
  formatCount,
  permutation,
  pieceStyle,
  nearCorrectSlot,
} from "@/lib/puzzle";
import { drawPuzzleBoard } from "@/lib/drawPuzzleBoard";
const PAGE = 12n;
function PieceArt({ piece, round }: { piece: bigint; round: Round }) {
  const clip = useId().replace(/:/g, "");
  const w = round.width / round.columns,
    h = round.height / round.rows,
    x = Number(piece % BigInt(round.columns)) * w,
    y = Number(piece / BigInt(round.columns)) * h;
  return (
    <svg className="piece-art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <image
        href={round.imageUrl}
        x={-x}
        y={-y}
        width={round.width}
        height={round.height}
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
}

export default function PuzzleBoard({
  round,
  onCorrect,
  onComplete,
}: {
  round: Round;
  onCorrect: () => void;
  onComplete: () => void;
}) {
  const count = pieceCount(round.rows, round.columns);
  if (count === 0n)
    return (
      <p className="game-feedback">
        Vòng này chưa được thiết lập. Thầy cô hãy chọn số hàng và số cột.
      </p>
    );
  return (
    <PlayableBoard
      key={`${round.id}-${round.rows}-${round.columns}`}
      round={{ ...round, rows: effectiveRows(round.rows) }}
      count={count}
      onCorrect={onCorrect}
      onComplete={onComplete}
    />
  );
}
function PlayableBoard({
  round,
  count,
  onCorrect,
  onComplete,
}: {
  round: Round;
  count: bigint;
  onCorrect: () => void;
  onComplete: () => void;
}) {
  const [placed, setPlaced] = useState(new Set<bigint>()),
    [selected, setSelected] = useState<bigint | null>(null),
    [page, setPage] = useState(0n),
    [feedback, setFeedback] = useState(
      "Chọn một mảnh, rồi chạm vào khung hình nhé!",
    ),
    [ghost, setGhost] = useState<{
      piece: bigint;
      x: number;
      y: number;
    } | null>(null),
    [size, setSize] = useState({ width: 600, height: 400 }),
    [loaded, setLoaded] = useState<HTMLImageElement | null>(null),
    [broken, setBroken] = useState(false),
    [focus, setFocus] = useState(0n),
    [hovered, setHovered] = useState<bigint | null>(null),
    [bump, setBump] = useState(false);
  const area = useRef<HTMLDivElement>(null),
    board = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    placedRef = useRef(new Set<bigint>()),
    drag = useRef<{
      piece: bigint;
      x: number;
      y: number;
      moved: boolean;
    } | null>(null),
    ignoreClick = useRef(false),
    done = useRef(false);
  const order = useMemo(() => permutation(count), [count]),
    lastPage = (count - 1n) / PAGE;
  const pieces = Array.from(
    { length: Number(count - page * PAGE < PAGE ? count - page * PAGE : PAGE) },
    (_, i) => order(page * PAGE + BigInt(i)),
  );
  const ratio = round.width / round.height;
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const resize = () => {
      const width = Math.max(
        1,
        Math.min(
          Math.max(1, el.clientWidth - 30),
          Math.max(1, el.clientHeight - 30) * ratio,
        ),
      );
      setSize({ width, height: width / ratio });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratio]);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(img);
    img.onerror = () => setBroken(true);
    img.src = round.imageUrl || "";
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [round.imageUrl]);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !loaded) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round(size.width * dpr);
    el.height = Math.round(size.height * dpr);
    ctx.scale(dpr, dpr);
    drawPuzzleBoard(
      ctx,
      loaded,
      placed,
      round.rows,
      round.columns,
      size,
      hovered ?? (selected !== null ? focus : null),
    );
  }, [
    loaded,
    placed,
    size,
    round.rows,
    round.columns,
    focus,
    selected,
    hovered,
  ]);

  function place(piece: bigint, slot: bigint) {
    if (
      done.current ||
      placedRef.current.has(piece) ||
      placedRef.current.has(slot)
    )
      return;
    if (piece !== slot) {
      setFeedback("Mình thử một ô khác nhé!");
      setBump(true);
      setTimeout(() => setBump(false), 280);
      return;
    }
    const next = new Set(placedRef.current);
    next.add(piece);
    placedRef.current = next;
    setPlaced(next);
    setSelected(null);
    setFeedback("Đúng rồi! Con giỏi lắm!");
    onCorrect();
    if (BigInt(next.size) === count) {
      done.current = true;
      onComplete();
    } else if (pieces.every((p) => next.has(p)) && page < lastPage)
      setPage(page + 1n);
  }
  function canvasSlot(x: number, y: number) {
    const r = (
      board.current!.firstElementChild as HTMLElement
    ).getBoundingClientRect();
    const col = Math.max(
        0,
        Math.min(
          round.columns - 1,
          Math.floor(((x - r.left) / r.width) * round.columns),
        ),
      ),
      row = Math.max(
        0,
        Math.min(
          round.rows - 1,
          Math.floor(((y - r.top) / r.height) * round.rows),
        ),
      );
    return BigInt(row) * BigInt(round.columns) + BigInt(col);
  }
  if (broken)
    return (
      <div className="game-feedback">
        Ảnh chưa đọc được. Thầy cô hãy quay lại và chọn Thay ảnh.
      </div>
    );
  return (
    <div className="puzzle-layout">
      <div className="board-area" ref={area}>
        <div
          ref={board}
          className={`puzzle-board ${bump ? "gentle-bump" : ""} ${ghost ? "drag-active" : ""}`}
          style={{ width: size.width, height: size.height }}
        >
          {count <= 144n ? (
            <div
              className="board-grid"
              style={{
                gridTemplateColumns: `repeat(${round.columns},1fr)`,
                gridTemplateRows: `repeat(${round.rows},1fr)`,
              }}
            >
              {Array.from({ length: Number(count) }, (_, i) => {
                const p = BigInt(i);
                return (
                  <button
                    key={i}
                    className={`puzzle-cell ${placed.has(p) ? "placed" : ""} ${selected !== null ? "ready" : ""} ${hovered === p && !placed.has(p) ? "drop-target" : ""}`}
                    aria-label={`Ô hàng ${Math.floor(i / round.columns) + 1}, cột ${(i % round.columns) + 1}${placed.has(p) ? ", đã ghép" : ""}`}
                    disabled={placed.has(p)}
                    onClick={() => {
                      if (selected !== null) place(selected, p);
                      else setFeedback("Con chọn một mảnh ảnh trước nhé!");
                    }}
                  >
                    {placed.has(p) && (
                      <span
                        className="cell-image"
                        style={pieceStyle(
                          p,
                          round.rows,
                          round.columns,
                          round.imageUrl!,
                        )}
                      />
                    )}
                    {!placed.has(p) && <span className="cell-dot" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <canvas
              ref={canvas}
              style={{ width: size.width, height: size.height }}
              tabIndex={0}
              aria-label="Khung ghép ảnh. Chọn mảnh rồi chạm vào ô; dùng phím mũi tên và Enter nếu chơi bằng bàn phím."
              onClick={(e) => {
                if (selected !== null)
                  place(selected, canvasSlot(e.clientX, e.clientY));
              }}
              onKeyDown={(e) => {
                let next = focus;
                if (e.key === "ArrowRight") next = focus + 1n;
                if (e.key === "ArrowLeft") next = focus - 1n;
                if (e.key === "ArrowDown") next = focus + BigInt(round.columns);
                if (e.key === "ArrowUp") next = focus - BigInt(round.columns);
                if (e.key.startsWith("Arrow")) {
                  e.preventDefault();
                  setFocus(next < 0n ? 0n : next >= count ? count - 1n : next);
                }
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (selected !== null) place(selected, focus);
                }
              }}
            />
          )}
        </div>
      </div>
      <section className="pieces-area" aria-label="Các mảnh ghép">
        <div className="tray-title">
          <span>
            <Hand size={24} />
            Mảnh ghép của con
          </span>
          <small>
            {formatCount(BigInt(placed.size))} / {formatCount(count)}
          </small>
        </div>
        <div className="piece-tray">
          {pieces.map((p) =>
            placed.has(p) ? (
              <span key={p.toString()} className="piece-placeholder">
                <Check size={25} />
              </span>
            ) : (
              <button
                key={p.toString()}
                className={`puzzle-piece ${selected === p ? "selected" : ""} ${ghost?.piece === p ? "is-dragging" : ""}`}
                aria-label={`Mảnh ghép ${p + 1n}`}
                aria-pressed={selected === p}
                onClick={() => {
                  if (ignoreClick.current) {
                    ignoreClick.current = false;
                    return;
                  }
                  setSelected(p);
                  setFeedback("Chạm vào ô trong khung hình nhé!");
                }}
                onPointerDown={(e) => {
                  ignoreClick.current = false;
                  setSelected(p);
                  drag.current = {
                    piece: p,
                    x: e.clientX,
                    y: e.clientY,
                    moved: false,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d) return;
                  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 7)
                    d.moved = true;
                  if (d.moved) {
                    setGhost({ piece: p, x: e.clientX, y: e.clientY });
                    const rect =
                      board.current!.firstElementChild!.getBoundingClientRect();
                    setHovered(
                      e.clientX >= rect.left &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.bottom
                        ? canvasSlot(e.clientX, e.clientY)
                        : null,
                    );
                  }
                }}
                onPointerCancel={() => {
                  drag.current = null;
                  setGhost(null);
                  setHovered(null);
                }}
                onPointerUp={(e) => {
                  const d = drag.current;
                  drag.current = null;
                  setGhost(null);
                  setHovered(null);
                  if (!d?.moved) return;
                  ignoreClick.current = true;
                  setSelected(p);
                  const rect = (
                    board.current!.firstElementChild as HTMLElement
                  ).getBoundingClientRect();
                  if (
                    nearCorrectSlot(
                      e.clientX,
                      e.clientY,
                      rect,
                      p,
                      round.rows,
                      round.columns,
                    )
                  )
                    place(p, p);
                  else if (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                  )
                    place(p, canvasSlot(e.clientX, e.clientY));
                }}
              >
                <PieceArt piece={p} round={round} />
              </button>
            ),
          )}
        </div>
        {count > PAGE && (
          <div className="tray-pages">
            <button
              className="round-control"
              aria-label="Mảnh ghép trước"
              disabled={page === 0n}
              onClick={() => setPage((p) => p - 1n)}
            >
              <ChevronLeft />
            </button>
            <span>
              {formatCount(page + 1n)} / {formatCount(lastPage + 1n)}
            </span>
            <button
              className="round-control"
              aria-label="Mảnh ghép tiếp theo"
              disabled={page === lastPage}
              onClick={() => setPage((p) => p + 1n)}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </section>
      <p className="game-feedback" role="status">
        {feedback}
      </p>
      {ghost && (
        <div className="drag-ghost" style={{ left: ghost.x, top: ghost.y }}>
          <PieceArt piece={ghost.piece} round={round} />
        </div>
      )}
    </div>
  );
}
