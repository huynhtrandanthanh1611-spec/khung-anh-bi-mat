/** Fit all pieces on one page; choose the grid giving the source slices most visible area. */
export function trayLayout(
  count: number,
  width: number,
  height: number,
  ratio: number,
) {
  const gap = 8;
  let best = { columns: 1, rows: Math.max(1, count), score: -1 };
  for (let columns = 1; columns <= Math.min(count, 6); columns++) {
    const rows = Math.ceil(count / columns),
      w = Math.max(1, (width - gap * (columns - 1)) / columns),
      h = Math.max(1, (height - gap * (rows - 1)) / rows);
    const imageWidth = Math.min(w, h * ratio),
      imageHeight = Math.min(h, w / ratio);
    const touchPenalty = Math.min(1, w / 44, h / 44);
    const score = imageWidth * imageHeight * touchPenalty;
    if (score > best.score) best = { columns, rows, score };
  }
  return { columns: best.columns, rows: best.rows };
}
