export type Round = {
  id: string;
  imagePath: string;
  imageUrl?: string;
  width: number;
  height: number;
  title: string;
  hint: string;
  completionMessage: string;
  completionText?: string;
  rewardStickerEnabled?: boolean;
  rewardStickerMode?: "random" | "selected";
  rewardStickerId?: string;
  completionImagePath?: string | null;
  completionImageUrl?: string | null;
  rows: number;
  columns: number;
  enabled: boolean;
};
export type GameSettings = {
  title: string;
  description: string;
  subject: string;
  grade: string;
  musicPath: string | null;
  musicName?: string;
  musicUrl?: string | null;
  musicEnabled: boolean;
  musicVolume: number;
  timerMode: "none" | "elapsed" | "limit";
  timeLimit: number;
  scoreEnabled: boolean;
  sfxEnabled: boolean;
};
export type Game = GameSettings & {
  id: string;
  code: string;
  status: "draft" | "published";
  version: number;
  updatedAt: string;
  rounds: Round[];
};
export type PlayRound = Pick<
  Round,
  | "id"
  | "width"
  | "height"
  | "title"
  | "hint"
  | "completionMessage"
  | "rows"
  | "columns"
> & { imageUrl: string };
export type PlayGame = Pick<
  GameSettings,
  | "title"
  | "description"
  | "musicEnabled"
  | "musicVolume"
  | "timerMode"
  | "timeLimit"
  | "scoreEnabled"
  | "sfxEnabled"
> & { musicUrl: string | null; rounds: PlayRound[] };
