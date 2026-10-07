export interface ReferenceSessionMissedCard {
  cardId: string;
  missCount: number;
}

export interface ReferenceSessionSummary {
  timestamp: string;
  totalAttempts: number;
  correctAttempts: number;
  cardCount: number;
  /** Optional for backward compatibility with summaries saved before this field existed. */
  missedCards?: ReferenceSessionMissedCard[];
}
