/** Never draw the source image except for a piece the child has already placed. */
export function drawPuzzleBoard(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  placed: ReadonlySet<bigint>,
  rows: number,
  columns: number,
  size: { width: number; height: number },
  highlight: bigint | null,
) {
  ctx.fillStyle = "#fffdf4";
  ctx.fillRect(0, 0, size.width, size.height);
  const w = size.width / columns,
    h = size.height / rows;
  const sw = image.naturalWidth / columns,
    sh = image.naturalHeight / rows;
  for (const piece of placed) {
    const x = Number(piece % BigInt(columns)),
      y = Number(piece / BigInt(columns));
    ctx.drawImage(image, x * sw, y * sh, sw, sh, x * w, y * h, w, h);
  }
  ctx.strokeStyle = "#78aaa5";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const colStep = Math.max(
    1,
    Math.ceil(columns / Math.max(1, Math.floor(size.width / 5))),
  );
  const rowStep = Math.max(
    1,
    Math.ceil(rows / Math.max(1, Math.floor(size.height / 5))),
  );
  for (let c = 0; c <= columns; c += colStep) {
    ctx.moveTo(c * w, 0);
    ctx.lineTo(c * w, size.height);
  }
  for (let r = 0; r <= rows; r += rowStep) {
    ctx.moveTo(0, r * h);
    ctx.lineTo(size.width, r * h);
  }
  ctx.stroke();
  if (highlight !== null && !placed.has(highlight)) {
    const x = Number(highlight % BigInt(columns)),
      y = Number(highlight / BigInt(columns));
    ctx.fillStyle = "#ffe5a680";
    ctx.fillRect(x * w, y * h, w, h);
    ctx.strokeStyle = "#c78920";
    ctx.lineWidth = 3;
    ctx.strokeRect(x * w, y * h, w, h);
  }
}
