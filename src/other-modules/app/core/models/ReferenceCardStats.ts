export interface ReferenceCardStat {
  attempts: number;
  correct: number;
}

export type ReferenceCardStatsMap = Record<string, ReferenceCardStat>;
