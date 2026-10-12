import { Clef } from './MusicNote';

export type NoteGroupKind = 'lines' | 'spaces' | 'ledger';

export interface MusicNoteGroup {
  id: string;
  label: string;
  clef: Clef;
  kind: NoteGroupKind;
  mnemonic: string;
}
