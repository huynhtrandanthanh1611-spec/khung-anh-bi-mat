import type { Game } from "@/types/game";
import { playableError } from "./puzzle";
export const SHARE_API =
  "https://khung-anh-chia-se.punch-wetsuit-7b.chatgpt.site/api/shares";
const MAX_BODY = 12 * 1024 * 1024;
export type ShareKey = { id: string; token: string };
const key = (id: string) => `khung-anh-share:${id}`;
export function shareKey(id: string): ShareKey | null {
  try {
    return JSON.parse(localStorage.getItem(key(id)) || "null");
  } catch {
    return null;
  }
}
export function shareLink(id: string) {
  return `${location.origin}${location.pathname}#/play/${id}`;
}
async function request(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) {
    let error = "Chưa kết nối được dịch vụ chia sẻ. Hãy thử lại.";
    try {
      error = (await r.json()).error || error;
    } catch {}
    throw Error(error);
  }
  return r;
}
async function asset(url?: string | null): Promise<string | null> {
  if (!url) return null;
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error("Không đọc được ảnh hoặc nhạc."));
    reader.readAsDataURL(blob);
  });
}
export async function createShare(
  game: Game,
  onProgress: (text: string) => void,
) {
  const problem = playableError(game);
  if (problem) throw Error(problem);
  onProgress("Đang chuẩn bị ảnh…");
  const rounds = [];
  for (const [i, r] of game.rounds.entries()) {
    onProgress(`Đang chuẩn bị ảnh ${i + 1}/${game.rounds.length}…`);
    rounds.push({
      id: r.id,
      rows: r.rows,
      columns: r.columns,
      width: r.width,
      height: r.height,
      imageUrl: await asset(r.imageUrl),
      completionText: r.completionText || "",
      completionImageUrl: await asset(r.completionImageUrl),
      rewardStickerEnabled: r.rewardStickerEnabled ?? false,
      rewardStickerMode: r.rewardStickerMode || "random",
      rewardStickerId: r.rewardStickerId,
    });
  }
  const body = JSON.stringify({
    version: 1,
    title: game.title,
    rounds,
    musicEnabled: game.musicEnabled,
    musicVolume: game.musicVolume,
    sfxEnabled: game.sfxEnabled,
    musicUrl: game.musicEnabled ? await asset(game.musicUrl) : null,
  });
  if (new Blob([body]).size > MAX_BODY)
    throw Error(
      "Bản chia sẻ vượt 12 MB. Hãy giảm số ảnh hoặc tắt nhạc rồi thử lại.",
    );
  onProgress("Đang tạo link…");
  const result = (await (
    await request(SHARE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
  ).json()) as ShareKey;
  try {
    localStorage.setItem(key(game.id), JSON.stringify(result));
  } catch {
    await request(`${SHARE_API}/${result.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${result.token}` },
    });
    throw Error("Không lưu được quyền quản lý link trên trình duyệt này.");
  }
  return result;
}
export async function disableShare(gameId: string) {
  const saved = shareKey(gameId);
  if (!saved) return;
  await request(`${SHARE_API}/${saved.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${saved.token}` },
  });
  localStorage.removeItem(key(gameId));
}
export async function shareAvailable(id: string) {
  const r = await fetch(`${SHARE_API}/${id}`, {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (r.status === 404) return false;
  if (!r.ok) throw Error("Chưa kiểm tra được trạng thái chia sẻ.");
  return true;
}
export async function fetchSharedGame(id: string): Promise<Game> {
  if (!/^[0-9a-f]{32}$/.test(id)) throw Error("Link trò chơi không hợp lệ.");
  const data = await (await request(`${SHARE_API}/${id}`)).json();
  if (data.version !== 1 || !Array.isArray(data.rounds) || !data.rounds.length)
    throw Error("Dữ liệu trò chơi không hợp lệ.");
  return {
    id,
    code: "",
    status: "published",
    version: 0,
    updatedAt: "",
    title: data.title,
    description: "",
    subject: "",
    grade: "",
    musicPath: null,
    musicUrl: data.musicUrl,
    musicEnabled: data.musicEnabled,
    musicVolume: data.musicVolume,
    sfxEnabled: data.sfxEnabled,
    scoreEnabled: false,
    timerMode: "none",
    timeLimit: 300,
    rounds: data.rounds.map((r: Game["rounds"][number]) => ({
      ...r,
      imagePath: "shared",
      title: "",
      hint: "",
      completionMessage: "",
      enabled: true,
    })),
  };
}
