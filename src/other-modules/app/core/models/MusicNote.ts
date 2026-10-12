export type Clef = 'treble' | 'bass';

export interface MusicNote {
  id: string;              // e.g. "treble:e4"
  noteName: string;        // "E" — the single-letter answer
  fullName: string;        // "E4" — display name including octave
  clef: Clef;
  staffPosition: number;   // 1=line1 … 5=line5; 1.5=space1 … 4.5=space4; 0=ledger below; 6=ledger above
  groupId: string;         // "treble-lines" | "treble-spaces" | "bass-lines" | "bass-spaces" | "ledger"
  mnemonicWord: string;    // the specific word in the mnemonic for this note
  mnemonicPhrase: string;  // full mnemonic phrase (space-separated words)
  mnemonicWordIndex: number; // 0-based index of mnemonicWord in the phrase
}
