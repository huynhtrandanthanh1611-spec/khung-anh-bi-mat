import { db, userId, json, route, rawGame, BUCKET } from "@/lib/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return route(async () => {
    const owner = await userId(req),
      game = await rawGame((await ctx.params).id, owner);
    const { data: created, error } = await db()
      .from("games")
      .insert({ teacher_id: owner })
      .select("id")
      .single();
    if (error) throw error;
    const newId = created!.id;
    const bucket = db().storage.from(BUCKET),
      copied: string[] = [];
    try {
      async function copy(path: string) {
        const next = `${owner}/${newId}/${crypto.randomUUID()}.${path.split(".").pop()}`;
        const { error } = await bucket.copy(path, next);
        if (error) throw error;
        copied.push(next);
        return next;
      }
      const rounds = [];
      for (const r of game.rounds) {
        rounds.push({
          ...r,
          id: crypto.randomUUID(),
          imagePath: await copy(r.imagePath),
          imageUrl: undefined,
        });
      }
      const {
        id: _,
        code: _c,
        status: _s,
        version: _v,
        updatedAt: _u,
        rounds: _r,
        musicUrl: _m,
        ...settings
      } = game;
      settings.title = `${settings.title.slice(0, 135)} (bản sao)`;
      settings.musicPath = settings.musicPath
        ? await copy(settings.musicPath)
        : null;
      const { error: saveError } = await db().rpc("save_game", {
        p_game: created.id,
        p_owner: owner,
        p_expected: 0,
        p_data: settings,
        p_rounds: rounds,
      });
      if (saveError) throw saveError;
      return json({ id: created.id }, 201);
    } catch (e) {
      if (copied.length) await bucket.remove(copied);
      await db()
        .from("games")
        .delete()
        .eq("id", created.id)
        .eq("teacher_id", owner);
      throw e;
    }
  });
}
