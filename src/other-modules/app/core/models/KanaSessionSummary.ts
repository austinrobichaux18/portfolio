export interface KanaSessionSummary {
  timestamp: string;
  durationMs: number;
  totalAttempts: number;
  correctAttempts: number;
  avgTimeMsPerChar: number;
  charCount: number;
}
