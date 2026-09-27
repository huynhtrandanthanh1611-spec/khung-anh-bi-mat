import test from "node:test";
import assert from "node:assert/strict";
import {
  shufflePieces,
  roundSchema,
  saveSchema,
  calculateScore,
  pieceBackground,
  timeText,
} from "../lib/rules";
const round = {
  id: "983c4173-4d55-4726-86b8-ea9c60c9399e",
  imagePath: "owner/game/asset.webp",
  width: 800,
  height: 600,
  title: "",
  hint: "",
  completionMessage: "",
  rows: 3,
  columns: 4,
  enabled: true,
};
const game = {
  title: "Trò chơi",
  description: "",
  subject: "",
  grade: "",
  musicPath: null,
  musicEnabled: true,
  musicVolume: 0.35,
  timerMode: "none",
  timeLimit: 300,
  scoreEnabled: false,
  sfxEnabled: false,
  version: 0,
  rounds: [round],
};
test("all supported piece counts produce a complete, non-solved permutation", () => {
  for (let rows = 2; rows <= 10; rows++)
    for (let cols = 2; cols <= 10; cols++)
      for (let trial = 0; trial < 15; trial++) {
        const n = rows * cols,
          list = shufflePieces(n);
        assert.equal(new Set(list).size, n);
        assert.deepEqual(
          [...list].sort((a, b) => a - b),
          Array.from({ length: n }, (_, i) => i),
        );
        assert.ok(list.some((x, i) => x !== i));
      }
});
test("identity shuffles still start unsolved", () =>
  assert.notDeepEqual(
    shufflePieces(4, () => 0.999999),
    [0, 1, 2, 3],
  ));
test("grid configuration refuses fractions, zero, missing or excessive dimensions", () => {
  for (const value of [0, 1, 11, 2.5, NaN])
    assert.equal(
      roundSchema.safeParse({ ...round, rows: value }).success,
      false,
    );
  assert.equal(
    roundSchema.safeParse({ ...round, rows: 2, columns: 10 }).success,
    true,
  );
});
test("each round keeps independent dimensions; duplicate identities cannot overwrite rounds", () => {
  const second = {
    ...round,
    id: "3c4dc8d4-835b-4ce7-8faa-9cd9f3c8c4a1",
    rows: 2,
    columns: 2,
  };
  assert.deepEqual(
    saveSchema
      .parse({ ...game, rounds: [round, second] })
      .rounds.map((r) => r.rows * r.columns),
    [12, 4],
  );
  assert.equal(
    saveSchema.safeParse({ ...game, rounds: [round, round] }).success,
    false,
  );
});
test("draft can disable every round, but malformed settings cannot be saved", () => {
  assert.equal(
    saveSchema.safeParse({ ...game, rounds: [{ ...round, enabled: false }] })
      .success,
    true,
  );
  assert.equal(saveSchema.safeParse({ ...game, title: "  " }).success, false);
  assert.equal(saveSchema.safeParse({ ...game, timeLimit: 0 }).success, false);
});
test("wrong placements before the first completion still reduce the final score", () => {
  assert.equal(calculateScore(0, 3), 0);
  assert.equal(calculateScore(1, 3), 85);
  assert.equal(calculateScore(5, 7), 465);
  assert.equal(calculateScore(1, 100), 0);
});
test("rectangular images use exact edge positions without cropping source content", () => {
  const first = pieceBackground(0, 3, 4, "image.webp"),
    last = pieceBackground(11, 3, 4, "image.webp");
  assert.equal(first.backgroundPosition, "0% 0%");
  assert.equal(last.backgroundPosition, "100% 100%");
  assert.equal(last.backgroundSize, "400% 300%");
});
test("clock is never negative and handles minute boundaries", () => {
  assert.equal(timeText(-1), "00:00");
  assert.equal(timeText(59.8), "00:59");
  assert.equal(timeText(222), "03:42");
  assert.equal(timeText(3600), "60:00");
});
