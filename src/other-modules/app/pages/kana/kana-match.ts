import { KanaChar } from '../../core/models/KanaChar';

export function acceptedRomaji(char: KanaChar): string[] {
  return [char.romaji, ...char.altRomaji].map((s) => s.toLowerCase());
}

export function isExactMatch(input: string, char: KanaChar): boolean {
  const normalized = input.trim().toLowerCase();
  return normalized.length > 0 && acceptedRomaji(char).includes(normalized);
}

export function isValidPrefix(input: string, char: KanaChar): boolean {
  const normalized = input.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return acceptedRomaji(char).some((accepted) => accepted.startsWith(normalized));
}
