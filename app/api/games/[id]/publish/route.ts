import { z } from "zod";
import {
  db,
  userId,
  json,
  route,
  rawGame,
  checkFiles,
  HttpError,
} from "@/lib/server";
import { saveSchema } from "@/lib/rules";
export const runtime = "nodejs";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const owner = await userId(req),
      { id } = await ctx.params;
    const input = z
      .object({ version: z.number().int(), publish: z.boolean() })
      .parse(await req.json());
    const game = await rawGame(id, owner);
    if (game.version !== input.version)
      throw new HttpError(409, "Trò chơi đã thay đổi. Hãy tải lại trang.");
    const payload = saveSchema.parse(game);
    if (input.publish) {
      if (!payload.rounds.some((r) => r.enabled))
        throw new HttpError(
          400,
          "Bạn cần bật ít nhất một vòng chơi trước khi xuất bản.",
        );
      await checkFiles(payload, owner, id);
    }
    const { version: _, ...snapshot } = payload;
    const { data, error } = await db()
      .from("games")
      .update({
        status: input.publish ? "published" : "draft",
        published_data: input.publish
          ? { ...snapshot, rounds: snapshot.rounds.filter((r) => r.enabled) }
          : null,
        published_at: input.publish ? new Date().toISOString() : null,
        version: game.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("teacher_id", owner)
      .eq("version", game.version)
      .select("version")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(409, "Có thay đổi mới. Hãy tải lại trang.");
    return json({
      version: data.version,
      status: input.publish ? "published" : "draft",
      code: game.code,
    });
  });
}
