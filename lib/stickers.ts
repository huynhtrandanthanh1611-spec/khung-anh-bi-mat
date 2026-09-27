import type { Round } from "../types/game";
export const rewardStickers = [
  { id: "con-gioi-lam", name: "Con giỏi lắm!" },
  { id: "gioi-qua", name: "Giỏi quá!" },
  { id: "xuat-sac", name: "Xuất sắc!" },
  { id: "tuyet-voi", name: "Tuyệt vời!" },
  { id: "hoan-ho", name: "Hoan hô!" },
];
export type RewardSticker = (typeof rewardStickers)[number];
export const stickerImage = (id: string) =>
  `${import.meta.env.BASE_URL}stickers/${id}.png`;
export function chooseRewardSticker(
  round: Pick<
    Round,
    "rewardStickerEnabled" | "rewardStickerMode" | "rewardStickerId"
  >,
  previous?: string,
  random = Math.random,
): RewardSticker | null {
  if (!round.rewardStickerEnabled) return null;
  if (round.rewardStickerMode === "selected") {
    const fixed = rewardStickers.find((s) => s.id === round.rewardStickerId);
    if (fixed) return fixed;
  }
  const choices = rewardStickers.filter((s) => s.id !== previous);
  return choices[Math.floor(random() * choices.length)];
}
