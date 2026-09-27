import { z } from "zod";
export const MIN_GRID = 0,
  MAX_ROUNDS = 50,
  MAX_FILE_BYTES = 4 * 1024 * 1024;
export const roundSchema = z.object({
  id: z.uuid(),
  imagePath: z.string().min(1).max(300),
  width: z.number().int().min(1).max(20000),
  height: z.number().int().min(1).max(20000),
  title: z.string().max(150),
  hint: z.string().max(500),
  completionMessage: z.string().max(500),
  completionText: z.string().max(2000).optional(),
  completionImagePath: z.string().max(300).nullable().optional(),
  rows: z.number().int().min(MIN_GRID),
  columns: z.number().int().min(MIN_GRID),
  enabled: z.boolean(),
});
export const settingsSchema = z.object({
  title: z.string().trim().min(1, "Hãy nhập tên trò chơi.").max(150),
  description: z.string().max(1500),
  subject: z.string().max(100),
  grade: z.string().max(50),
  musicPath: z.string().max(300).nullable(),
  musicName: z.string().max(300).optional(),
  musicEnabled: z.boolean(),
  musicVolume: z.number().min(0).max(1),
  timerMode: z.enum(["none", "elapsed", "limit"]),
  timeLimit: z.number().int().min(10).max(3600),
  scoreEnabled: z.boolean(),
  sfxEnabled: z.boolean(),
});
export const saveSchema = settingsSchema
  .extend({
    version: z.number().int().min(0),
    rounds: z.array(roundSchema).max(MAX_ROUNDS),
  })
  .superRefine((v, ctx) => {
    if (new Set(v.rounds.map((r) => r.id)).size !== v.rounds.length)
      ctx.addIssue({ code: "custom", message: "Mỗi vòng cần mã riêng." });
  });
export function shufflePieces(
  count: number,
  random: () => number = Math.random,
): number[] {
  const list = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  if (count > 1 && list.every((v, i) => v === i))
    [list[0], list[1]] = [list[1], list[0]];
  return list;
}
export function difficulty(n: number) {
  return n <= 6
    ? "Dễ"
    : n <= 12
      ? "Vừa sức"
      : n <= 25
        ? "Thử thách"
        : "Rất khó";
}
export function calculateScore(completed: number, mistakes: number) {
  return Math.max(0, completed * 100 - mistakes * 5);
}
export function timeText(n: number) {
  const s = Math.max(0, Math.floor(n));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
export function pieceBackground(
  index: number,
  rows: number,
  columns: number,
  imageUrl: string,
) {
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${columns === 1 ? 0 : ((index % columns) / (columns - 1)) * 100}% ${rows === 1 ? 0 : (Math.floor(index / columns) / (rows - 1)) * 100}%`,
  };
}
