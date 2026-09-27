import { db, json, route, playData, HttpError } from "@/lib/server";
export const runtime = "nodejs";
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  return route(async () => {
    const code = (await ctx.params).code.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(code))
      throw new HttpError(404, "Không tìm thấy trò chơi.");
    const { data, error } = await db()
      .from("games")
      .select("published_data")
      .eq("code", code)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data?.published_data)
      throw new HttpError(
        404,
        "Không tìm thấy trò chơi hoặc trò chơi hiện chưa sẵn sàng.",
      );
    return json(await playData(data.published_data));
  });
}
