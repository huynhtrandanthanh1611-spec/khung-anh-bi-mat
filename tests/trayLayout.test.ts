import test from "node:test";
import assert from "node:assert/strict";
import { trayLayout } from "../lib/trayLayout";
test("5–20 pieces fit the measured tray on desktop, portrait and landscape without overflow", () => {
  for (const count of [5, 6, 8, 10, 12, 16, 20])
    for (const [width, height] of [
      [390, 370],
      [340, 145],
      [280, 170],
    ])
      for (const ratio of [0.075, 0.3, 1, 2]) {
        const g = trayLayout(count, width, height, ratio);
        const w = (width - 8 * (g.columns - 1)) / g.columns,
          h = (height - 8 * (g.rows - 1)) / g.rows;
        assert.ok(g.columns * g.rows >= count);
        assert.ok(w > 0 && h > 0);
        assert.ok(g.columns * w + 8 * (g.columns - 1) <= width + 0.001);
        assert.ok(g.rows * h + 8 * (g.rows - 1) <= height + 0.001);
      }
});
