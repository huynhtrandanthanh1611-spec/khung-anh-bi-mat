import type { Game } from "@/types/game";
export function pieceCount(rows: number, columns: number): bigint {
  return Number.isSafeInteger(rows) &&
    Number.isSafeInteger(columns) &&
    rows >= 0 &&
    columns >= 0
    ? BigInt(rows) * BigInt(columns)
    : 0n;
}
export const formatCount = (count: bigint) => count.toLocaleString("vi-VN");
export function playableError(game: Game): string | null {
  if (!game.rounds.length) return "Thêm ít nhất một ảnh để bắt đầu nhé.";
  for (const [i, r] of game.rounds.entries()) {
    if (r.rows === 0)
      return `Vòng ${i + 1}: vui lòng chọn số hàng để bắt đầu vòng này.`;
    if (r.columns === 0)
      return `Vòng ${i + 1}: vui lòng chọn số cột để bắt đầu vòng này.`;
    if (pieceCount(r.rows, r.columns) === 0n)
      return `Vòng ${i + 1}: số hàng và số cột cần là số nguyên từ 1.`;
    if (!r.imageUrl)
      return `Ảnh vòng ${i + 1} chưa đọc được. Hãy chọn Thay ảnh.`;
  }
  return null;
}
function gcd(a: bigint, b: bigint): bigint {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}
// An affine permutation lets even huge grids shuffle without allocating an array of all pieces.
export function permutation(
  count: bigint,
  seed = crypto.getRandomValues(new Uint32Array(2)),
) {
  if (count <= 1n) return (_: bigint) => 0n;
  let step = BigInt(seed[0]) % count || 1n;
  while (gcd(step, count) !== 1n) step = (step + 1n) % count || 1n;
  let offset = BigInt(seed[1]) % count;
  if (step === 1n && offset === 0n) offset = 1n;
  return (index: bigint) => (index * step + offset) % count;
}
export function pieceStyle(
  piece: bigint,
  rows: number,
  columns: number,
  url: string,
) {
  const col = Number(piece % BigInt(columns)),
    row = Number(piece / BigInt(columns));
  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${columns === 1 ? 0 : (col / (columns - 1)) * 100}% ${rows === 1 ? 0 : (row / (rows - 1)) * 100}%`,
  };
}
export function nearCorrectSlot(
  x: number,
  y: number,
  rect: { left: number; top: number; width: number; height: number },
  piece: bigint,
  rows: number,
  columns: number,
) {
  const col = Number(piece % BigInt(columns)),
    row = Number(piece / BigInt(columns));
  const w = rect.width / columns,
    h = rect.height / rows;
  const tolerance = Math.min(28, Math.min(w, h) * 0.3);
  return (
    x >= rect.left + col * w - tolerance &&
    x <= rect.left + (col + 1) * w + tolerance &&
    y >= rect.top + row * h - tolerance &&
    y <= rect.top + (row + 1) * h + tolerance
  );
}
