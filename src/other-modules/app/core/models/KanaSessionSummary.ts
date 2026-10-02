export interface KanaSessionMissedChar {
  charId: string;
  missCount: number;
}

export interface KanaSessionSummary {
  timestamp: string;
  durationMs: number;
  totalAttempts: number;
  correctAttempts: number;
  avgTimeMsPerChar: number;
  charCount: number;
  /** Optional for backward compatibility with summaries saved before this field existed. */
  missedChars?: KanaSessionMissedChar[];
}
