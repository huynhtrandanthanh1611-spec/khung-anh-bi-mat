import test from "node:test";
import assert from "node:assert/strict";
import {
  permutation,
  pieceCount,
  pieceStyle,
  nearCorrectSlot,
  playableError,
} from "../lib/puzzle";
import type { Game } from "../types/game";
test("lazy permutations contain all pieces exactly once and do not start solved", () => {
  for (const count of [1, 2, 4, 6, 12, 100, 2500, 10000]) {
    const fn = permutation(BigInt(count), new Uint32Array([17, 0])),
      values = Array.from({ length: count }, (_, i) => fn(BigInt(i)));
    assert.equal(new Set(values).size, count);
    assert.ok(values.every((v) => v >= 0n && v < BigInt(count)));
    if (count > 1) assert.ok(values.some((v, i) => v !== BigInt(i)));
  }
});
test("huge grids count precisely and generate only requested pieces", () => {
  const count = pieceCount(1000000000, 1000000000);
  assert.equal(count, 1000000000000000000n);
  const fn = permutation(count, new Uint32Array([77, 123]));
  assert.ok(fn(count - 1n) < count);
  assert.equal(pieceCount(0, 100), 0n);
});
test("1x1, 1xN and Nx1 backgrounds have no division by zero", () => {
  for (const [r, c] of [
    [1, 1],
    [1, 5],
    [5, 1],
  ]) {
    const style = pieceStyle(0n, r, c, "image");
    assert.ok(!JSON.stringify(style).includes("NaN"));
    assert.ok(!JSON.stringify(style).includes("Infinity"));
  }
});
test("pointer drop snaps near correct cell without accepting distant cells", () => {
  const rect = { left: 10, top: 20, width: 400, height: 200 };
  assert.ok(nearCorrectSlot(215, 100, rect, 0n, 2, 2));
  assert.ok(!nearCorrectSlot(350, 170, rect, 0n, 2, 2));
});
test("zero grids stop play with a helpful message", () => {
  const g = { rounds: [{ rows: 0, columns: 4, imageUrl: "image" }] } as Game;
  assert.match(playableError(g)!, /số hàng/);
  g.rounds[0].rows = 1;
  g.rounds[0].columns = 0;
  assert.match(playableError(g)!, /số cột/);
  g.rounds[0].columns = 1;
  assert.equal(playableError(g), null);
});
