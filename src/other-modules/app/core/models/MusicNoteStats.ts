export interface MusicNoteStat {
  attempts: number;
  correct: number;
  totalTimeMs: number;
}

export type MusicNoteStatsMap = Record<string, MusicNoteStat>;
