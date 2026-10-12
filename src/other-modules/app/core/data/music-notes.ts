import { MusicNote } from '../models/MusicNote';
import { MusicNoteGroup } from '../models/MusicNoteGroup';

export const MUSIC_NOTES: MusicNote[] = [
  // ── Treble Clef Lines: Every Good Boy Does Fine ──────────────────────────
  { id: 'treble:e4', noteName: 'E', fullName: 'E4', clef: 'treble', staffPosition: 1,   groupId: 'treble-lines',  mnemonicPhrase: 'Every Good Boy Does Fine', mnemonicWord: 'Every',  mnemonicWordIndex: 0 },
  { id: 'treble:g4', noteName: 'G', fullName: 'G4', clef: 'treble', staffPosition: 2,   groupId: 'treble-lines',  mnemonicPhrase: 'Every Good Boy Does Fine', mnemonicWord: 'Good',   mnemonicWordIndex: 1 },
  { id: 'treble:b4', noteName: 'B', fullName: 'B4', clef: 'treble', staffPosition: 3,   groupId: 'treble-lines',  mnemonicPhrase: 'Every Good Boy Does Fine', mnemonicWord: 'Boy',    mnemonicWordIndex: 2 },
  { id: 'treble:d5', noteName: 'D', fullName: 'D5', clef: 'treble', staffPosition: 4,   groupId: 'treble-lines',  mnemonicPhrase: 'Every Good Boy Does Fine', mnemonicWord: 'Does',   mnemonicWordIndex: 3 },
  { id: 'treble:f5', noteName: 'F', fullName: 'F5', clef: 'treble', staffPosition: 5,   groupId: 'treble-lines',  mnemonicPhrase: 'Every Good Boy Does Fine', mnemonicWord: 'Fine',   mnemonicWordIndex: 4 },

  // ── Treble Clef Spaces: F A C E ──────────────────────────────────────────
  { id: 'treble:f4', noteName: 'F', fullName: 'F4', clef: 'treble', staffPosition: 1.5, groupId: 'treble-spaces', mnemonicPhrase: 'F A C E', mnemonicWord: 'F', mnemonicWordIndex: 0 },
  { id: 'treble:a4', noteName: 'A', fullName: 'A4', clef: 'treble', staffPosition: 2.5, groupId: 'treble-spaces', mnemonicPhrase: 'F A C E', mnemonicWord: 'A', mnemonicWordIndex: 1 },
  { id: 'treble:c5', noteName: 'C', fullName: 'C5', clef: 'treble', staffPosition: 3.5, groupId: 'treble-spaces', mnemonicPhrase: 'F A C E', mnemonicWord: 'C', mnemonicWordIndex: 2 },
  { id: 'treble:e5', noteName: 'E', fullName: 'E5', clef: 'treble', staffPosition: 4.5, groupId: 'treble-spaces', mnemonicPhrase: 'F A C E', mnemonicWord: 'E', mnemonicWordIndex: 3 },

  // ── Bass Clef Lines: Good Boys Do Fine Always ─────────────────────────────
  { id: 'bass:g2',   noteName: 'G', fullName: 'G2', clef: 'bass',   staffPosition: 1,   groupId: 'bass-lines',    mnemonicPhrase: 'Good Boys Do Fine Always', mnemonicWord: 'Good',   mnemonicWordIndex: 0 },
  { id: 'bass:b2',   noteName: 'B', fullName: 'B2', clef: 'bass',   staffPosition: 2,   groupId: 'bass-lines',    mnemonicPhrase: 'Good Boys Do Fine Always', mnemonicWord: 'Boys',   mnemonicWordIndex: 1 },
  { id: 'bass:d3',   noteName: 'D', fullName: 'D3', clef: 'bass',   staffPosition: 3,   groupId: 'bass-lines',    mnemonicPhrase: 'Good Boys Do Fine Always', mnemonicWord: 'Do',     mnemonicWordIndex: 2 },
  { id: 'bass:f3',   noteName: 'F', fullName: 'F3', clef: 'bass',   staffPosition: 4,   groupId: 'bass-lines',    mnemonicPhrase: 'Good Boys Do Fine Always', mnemonicWord: 'Fine',   mnemonicWordIndex: 3 },
  { id: 'bass:a3',   noteName: 'A', fullName: 'A3', clef: 'bass',   staffPosition: 5,   groupId: 'bass-lines',    mnemonicPhrase: 'Good Boys Do Fine Always', mnemonicWord: 'Always', mnemonicWordIndex: 4 },

  // ── Bass Clef Spaces: All Cows Eat Grass ─────────────────────────────────
  { id: 'bass:a2',   noteName: 'A', fullName: 'A2', clef: 'bass',   staffPosition: 1.5, groupId: 'bass-spaces',   mnemonicPhrase: 'All Cows Eat Grass', mnemonicWord: 'All',   mnemonicWordIndex: 0 },
  { id: 'bass:c3',   noteName: 'C', fullName: 'C3', clef: 'bass',   staffPosition: 2.5, groupId: 'bass-spaces',   mnemonicPhrase: 'All Cows Eat Grass', mnemonicWord: 'Cows',  mnemonicWordIndex: 1 },
  { id: 'bass:e3',   noteName: 'E', fullName: 'E3', clef: 'bass',   staffPosition: 3.5, groupId: 'bass-spaces',   mnemonicPhrase: 'All Cows Eat Grass', mnemonicWord: 'Eat',   mnemonicWordIndex: 2 },
  { id: 'bass:g3',   noteName: 'G', fullName: 'G3', clef: 'bass',   staffPosition: 4.5, groupId: 'bass-spaces',   mnemonicPhrase: 'All Cows Eat Grass', mnemonicWord: 'Grass', mnemonicWordIndex: 3 },

  // ── Ledger Lines: Middle C ────────────────────────────────────────────────
  // Middle C (C4) sits on the first ledger line below the treble staff (position 0).
  { id: 'treble:c4', noteName: 'C', fullName: 'C4', clef: 'treble', staffPosition: 0,   groupId: 'ledger',        mnemonicPhrase: 'Middle C', mnemonicWord: 'Middle C', mnemonicWordIndex: 0 },
];

export const MUSIC_NOTE_GROUPS: MusicNoteGroup[] = [
  { id: 'treble-lines',  label: 'Lines',        clef: 'treble', kind: 'lines',  mnemonic: 'Every Good Boy Does Fine' },
  { id: 'treble-spaces', label: 'Spaces',       clef: 'treble', kind: 'spaces', mnemonic: 'F A C E' },
  { id: 'bass-lines',    label: 'Lines',        clef: 'bass',   kind: 'lines',  mnemonic: 'Good Boys Do Fine Always' },
  { id: 'bass-spaces',   label: 'Spaces',       clef: 'bass',   kind: 'spaces', mnemonic: 'All Cows Eat Grass' },
  { id: 'ledger',        label: 'Ledger Lines', clef: 'treble', kind: 'ledger', mnemonic: 'Middle C' },
];

const notesByGroup = new Map<string, MusicNote[]>();
for (const note of MUSIC_NOTES) {
  const arr = notesByGroup.get(note.groupId) ?? [];
  arr.push(note);
  notesByGroup.set(note.groupId, arr);
}

export function notesForGroup(groupId: string): MusicNote[] {
  return notesByGroup.get(groupId) ?? [];
}
