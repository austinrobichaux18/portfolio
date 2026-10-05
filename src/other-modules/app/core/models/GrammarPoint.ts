export interface GrammarExample {
  japanese: string;
  translation?: string;
}

export interface GrammarPoint {
  term: string;
  summary: string;
  examples?: GrammarExample[];
  /** Optional grouping key — consecutive points sharing a group are kept together, and a new group starts on its own line in the reference view. */
  group?: string;
}

export interface GrammarCategory {
  id: string;
  label: string;
  description?: string;
  points: GrammarPoint[];
}
