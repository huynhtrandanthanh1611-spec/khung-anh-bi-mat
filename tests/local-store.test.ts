import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { api, hydrate } from "../lib/client";
import type { Game } from "../types/game";
test("local game save is atomic across concurrent edits", async () => {
  const game = await api<Game>("/api/games", { method: "POST" });
  const results = await Promise.allSettled([
    api(`/api/games/${game.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...game, title: "A" }),
    }),
    api(`/api/games/${game.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...game, title: "B" }),
    }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await api<Game>(`/api/games/${game.id}`)).version, 1);
  await api(`/api/games/${game.id}`, { method: "DELETE" });
  await assert.rejects(api(`/api/games/${game.id}`), /Không tìm thấy/);
});
test("legacy games retain completion text and zero or large grids can be saved", async () => {
  const game = await api<Game>("/api/games", { method: "POST" });
  game.rounds = [
    {
      id: crypto.randomUUID(),
      imagePath: "old.webp",
      width: 800,
      height: 600,
      title: "Old round",
      hint: "",
      completionMessage: "Lời nhắn cũ",
      rows: 0,
      columns: 100,
      enabled: false,
    },
  ];
  const migrated = await hydrate(game);
  assert.equal(migrated.rounds[0].completionText, "Lời nhắn cũ");
  assert.equal(migrated.rounds[0].completionImagePath, null);
  await api(`/api/games/${game.id}`, {
    method: "PUT",
    body: JSON.stringify(migrated),
  });
  const loaded = await api<Game>(`/api/games/${game.id}`);
  assert.equal(loaded.rounds[0].rows, 0);
  assert.equal(loaded.rounds[0].columns, 100);
  assert.equal(loaded.rounds[0].enabled, false);
  assert.equal(loaded.rounds[0].completionText, "Lời nhắn cũ");
  loaded.rounds[0].completionText = "Giỏi quá";
  loaded.rounds[0].completionImagePath = "reward.webp";
  loaded.rounds[0].rows = 1000;
  loaded.rounds[0].rewardStickerEnabled = true;
  loaded.rounds[0].rewardStickerMode = "selected";
  loaded.rounds[0].rewardStickerId = "gioi-qua";
  await api(`/api/games/${game.id}`, {
    method: "PUT",
    body: JSON.stringify(loaded),
  });
  const updated = await api<Game>(`/api/games/${game.id}`);
  assert.equal(updated.rounds[0].completionText, "Giỏi quá");
  assert.equal(updated.rounds[0].completionImagePath, "reward.webp");
  assert.equal(updated.rounds[0].rows, 1000);
  assert.equal(updated.rounds[0].rewardStickerEnabled, true);
  assert.equal(updated.rounds[0].rewardStickerMode, "selected");
  assert.equal(updated.rounds[0].rewardStickerId, "gioi-qua");
  await api(`/api/games/${game.id}`, { method: "DELETE" });
});
