import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Game, GameSettings, Round, PlayGame } from "@/types/game";
export const BUCKET = "game-assets";
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError(
      503,
      "Dịch vụ chưa được cấu hình. Vui lòng liên hệ giáo viên.",
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function userId(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new HttpError(401, "Bạn cần đăng nhập.");
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, "Phiên đăng nhập không hợp lệ.");
  return data.user.id;
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function route(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    if (e instanceof z.ZodError)
      return json(
        {
          error:
            "Dữ liệu chưa hợp lệ. Kiểm tra tên trò chơi, số hàng và số cột (2–10).",
        },
        400,
      );
    console.error(e);
    return json({ error: "Không thể xử lý yêu cầu. Vui lòng thử lại." }, 500);
  }
}
export async function owned(id: string, owner: string) {
  if (!z.uuid().safeParse(id).success)
    throw new HttpError(404, "Không tìm thấy trò chơi.");
  const { data, error } = await db()
    .from("games")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", owner)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Không tìm thấy trò chơi.");
  return data;
}
export async function rawGame(id: string, owner: string): Promise<Game> {
  const record = await owned(id, owner);
  const { data, error } = await db()
    .from("puzzle_rounds")
    .select("*")
    .eq("game_id", id)
    .order("position");
  if (error) throw error;
  const rounds: Round[] = (data ?? []).map((r) => ({
    id: r.id,
    imagePath: r.image_path,
    width: r.width,
    height: r.height,
    title: r.title,
    hint: r.hint,
    completionMessage: r.completion_message,
    rows: r.rows,
    columns: r.columns,
    enabled: r.enabled,
  }));
  return {
    ...record.data,
    id: record.id,
    code: record.code,
    status: record.status,
    version: record.version,
    updatedAt: record.updated_at,
    rounds,
  };
}
export async function signed(path: string) {
  const { data, error } = await db()
    .storage.from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data)
    throw new HttpError(
      400,
      "Không đọc được tệp ảnh hoặc nhạc. Hãy tải tệp lên lại.",
    );
  return data.signedUrl;
}
export async function hydrate(game: Game): Promise<Game> {
  return {
    ...game,
    musicUrl: game.musicPath
      ? await signed(game.musicPath).catch(() => null)
      : null,
    rounds: await Promise.all(
      game.rounds.map(async (r) => ({
        ...r,
        imageUrl: await signed(r.imagePath).catch(() => undefined),
      })),
    ),
  };
}
export async function playData(
  snapshot: GameSettings & { rounds: Round[] },
): Promise<PlayGame> {
  return {
    title: snapshot.title,
    description: snapshot.description,
    musicEnabled: snapshot.musicEnabled,
    musicVolume: snapshot.musicVolume,
    timerMode: snapshot.timerMode,
    timeLimit: snapshot.timeLimit,
    scoreEnabled: snapshot.scoreEnabled,
    sfxEnabled: snapshot.sfxEnabled,
    musicUrl:
      snapshot.musicEnabled && snapshot.musicPath
        ? await signed(snapshot.musicPath)
        : null,
    rounds: await Promise.all(
      snapshot.rounds
        .filter((r) => r.enabled)
        .map(async (r) => ({
          id: r.id,
          width: r.width,
          height: r.height,
          title: r.title,
          hint: r.hint,
          completionMessage: r.completionMessage,
          rows: r.rows,
          columns: r.columns,
          imageUrl: await signed(r.imagePath),
        })),
    ),
  };
}
export function checkPaths(
  game: GameSettings & { rounds: Round[] },
  owner: string,
  id: string,
) {
  const paths = [
    ...game.rounds.map((r) => r.imagePath),
    ...(game.musicPath ? [game.musicPath] : []),
  ];
  if (
    paths.some(
      (path) => !path.startsWith(`${owner}/${id}/`) || path.includes(".."),
    )
  )
    throw new HttpError(400, "Tệp không thuộc trò chơi này.");
}
export async function checkFiles(
  game: GameSettings & { rounds: Round[] },
  owner: string,
  id: string,
) {
  checkPaths(game, owner, id);
  const { data, error } = await db()
    .storage.from(BUCKET)
    .list(`${owner}/${id}`, { limit: 1000 });
  if (error) throw error;
  const files = new Set((data ?? []).map((f) => `${owner}/${id}/${f.name}`));
  if (
    [
      ...game.rounds.map((r) => r.imagePath),
      ...(game.musicPath ? [game.musicPath] : []),
    ].some((p) => !files.has(p))
  )
    throw new HttpError(
      400,
      "Một tệp ảnh hoặc nhạc đã bị thiếu. Hãy tải lại trước khi xuất bản.",
    );
}
