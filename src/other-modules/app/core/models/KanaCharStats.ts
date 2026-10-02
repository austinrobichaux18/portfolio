export interface KanaCharStat {
  attempts: number;
  correct: number;
  totalTimeMs: number;
}

export type KanaCharStatsMap = Record<string, KanaCharStat>;
