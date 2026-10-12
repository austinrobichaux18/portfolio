import { MusicNote } from '../../core/models/MusicNote';

export function isExactMatch(input: string, note: MusicNote): boolean {
  const normalized = input.trim().toLowerCase();
  return normalized.length > 0 && normalized === note.noteName.toLowerCase();
}

export function isValidPrefix(input: string, note: MusicNote): boolean {
  const normalized = input.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return note.noteName.toLowerCase().startsWith(normalized);
}
