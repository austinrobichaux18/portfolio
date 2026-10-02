export type KanaScript = 'hiragana' | 'katakana';

export interface KanaChar {
  id: string;
  char: string;
  romaji: string;
  altRomaji: string[];
  script: KanaScript;
  rowId: string;
}
