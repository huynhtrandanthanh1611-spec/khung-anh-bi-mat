import test from "node:test";
import assert from "node:assert/strict";
import { chooseRewardSticker, rewardStickers } from "../lib/stickers";
test("stickers are optional; selected choice stays fixed and unknown choice falls back", () => {
  assert.equal(chooseRewardSticker({}), null);
  for (const sticker of rewardStickers) {
    assert.equal(
      chooseRewardSticker(
        {
          rewardStickerEnabled: true,
          rewardStickerMode: "selected",
          rewardStickerId: sticker.id,
        },
        sticker.id,
        () => 0,
      )?.id,
      sticker.id,
    );
  }
  assert.ok(
    chooseRewardSticker({
      rewardStickerEnabled: true,
      rewardStickerMode: "selected",
      rewardStickerId: "missing",
    }),
  );
});
test("random reward excludes preceding sticker and defaults to random when enabled", () => {
  for (const previous of rewardStickers) {
    for (const value of [0, 0.2, 0.5, 0.9999]) {
      const result = chooseRewardSticker(
        { rewardStickerEnabled: true },
        previous.id,
        () => value,
      );
      assert.ok(result);
      assert.notEqual(result.id, previous.id);
    }
  }
});
