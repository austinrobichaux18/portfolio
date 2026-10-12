export interface MusicSessionMissedNote {
  noteId: string;
  missCount: number;
}

export interface MusicSessionSummary {
  timestamp: string;
  durationMs: number;
  totalAttempts: number;
  correctAttempts: number;
  avgTimeMsPerNote: number;
  noteCount: number;
  missedNotes?: MusicSessionMissedNote[];
}
