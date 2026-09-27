import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { api, importGame } from "../lib/client";
import type { Game } from "../types/game";

test("local game creation, save, conflict detection, copy and deletion", async () => {
  const g = await api<Game>("/api/games", { method: "POST" });
  assert.equal(g.status, "draft");
  const result = await api<{ version: number }>(`/api/games/${g.id}`, {
    method: "PUT",
    body: JSON.stringify({ ...g, title: "Bài học" }),
  });
  assert.equal(result.version, 1);
  await assert.rejects(
    api(`/api/games/${g.id}`, { method: "PUT", body: JSON.stringify(g) }),
    /cửa sổ khác/,
  );
  assert.equal((await api<Game>(`/api/games/${g.id}`)).title, "Bài học");
  const copy = await api<{ id: string }>(`/api/games/${g.id}/clone`, {
    method: "POST",
  });
  assert.notEqual(copy.id, g.id);
  assert.equal((await api<Game>(`/api/games/${copy.id}`)).status, "draft");
  await assert.rejects(
    api(`/api/games/${g.id}/publish`, {
      method: "POST",
      body: JSON.stringify({ version: 1, publish: true }),
    }),
    /ít nhất một vòng/,
  );
  await api(`/api/games/${g.id}`, { method: "DELETE" });
  await assert.rejects(api(`/api/games/${g.id}`), /Không tìm thấy/);
  await api(`/api/games/${copy.id}`, { method: "DELETE" });
});
test("import rejects invalid packages without adding a game", async () => {
  const before = (await api<Game[]>("/api/games")).length;
  await assert.rejects(
    importGame(new File(['{"format":"wrong"}'], "bad.json")),
    /không hợp lệ/,
  );
  assert.equal((await api<Game[]>("/api/games")).length, before);
});
