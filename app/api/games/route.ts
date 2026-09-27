import { db, userId, json, route, rawGame, signed } from "@/lib/server";
export const runtime = "nodejs";
export async function GET(req: Request) {
  return route(async () => {
    const owner = await userId(req);
    const { data, error } = await db()
      .from("games")
      .select("id")
      .eq("teacher_id", owner)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const games = [];
    for (const row of data ?? []) {
      const game = await rawGame(row.id, owner);
      if (game.rounds[0]) {
        try {
          game.rounds[0].imageUrl = await signed(game.rounds[0].imagePath);
        } catch {
          /* show placeholder if an old asset is missing */
        }
      }
      games.push(game);
    }
    return json(games);
  });
}
export async function POST(req: Request) {
  return route(async () => {
    const owner = await userId(req);
    for (let i = 0; i < 3; i++) {
      const { data, error } = await db()
        .from("games")
        .insert({ teacher_id: owner })
        .select("id")
        .single();
      if (error?.code === "23505") continue;
      if (error) throw error;
      return json(await rawGame(data.id, owner), 201);
    }
    throw new Error("Could not allocate game code");
  });
}
