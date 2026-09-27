import {
  db,
  userId,
  json,
  route,
  rawGame,
  hydrate,
  owned,
  checkPaths,
  BUCKET,
  HttpError,
} from "@/lib/server";
import { saveSchema } from "@/lib/rules";
type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";
export async function GET(req: Request, ctx: Context) {
  return route(async () =>
    json(
      await hydrate(await rawGame((await ctx.params).id, await userId(req))),
    ),
  );
}
export async function PUT(req: Request, ctx: Context) {
  return route(async () => {
    const owner = await userId(req),
      { id } = await ctx.params;
    await owned(id, owner);
    const text = await req.text();
    if (text.length > 150000)
      throw new HttpError(413, "Dữ liệu trò chơi quá lớn.");
    const input = saveSchema.parse(JSON.parse(text));
    checkPaths(input, owner, id);
    const { rounds, version, ...settings } = input;
    const { data, error } = await db().rpc("save_game", {
      p_game: id,
      p_owner: owner,
      p_expected: version,
      p_data: settings,
      p_rounds: rounds,
    });
    if (error?.message.includes("EDIT_CONFLICT"))
      throw new HttpError(
        409,
        "Trò chơi đã được sửa ở cửa sổ khác. Hãy tải lại trang trước khi tiếp tục.",
      );
    if (error) throw error;
    return json({ version: data, updatedAt: new Date().toISOString() });
  });
}
export async function DELETE(req: Request, ctx: Context) {
  return route(async () => {
    const owner = await userId(req),
      { id } = await ctx.params;
    await owned(id, owner);
    const { error } = await db()
      .from("games")
      .delete()
      .eq("id", id)
      .eq("teacher_id", owner);
    if (error) throw error;
    const bucket = db().storage.from(BUCKET);
    const { data: files, error: listError } = await bucket.list(
      `${owner}/${id}`,
      { limit: 1000 },
    );
    if (listError) console.error("Asset cleanup pending", listError);
    if (files?.length) {
      const { error: cleanupError } = await bucket.remove(
        files.map((f) => `${owner}/${id}/${f.name}`),
      );
      if (cleanupError) console.error("Asset cleanup pending", cleanupError);
    }
    return json({ ok: true });
  });
}
