import { isExactMatch, isValidPrefix } from './note-match';
import { MusicNote } from '../../core/models/MusicNote';

function makeNote(noteName: string): MusicNote {
  return {
    id: `treble:${noteName.toLowerCase()}4`,
    noteName,
    fullName: `${noteName}4`,
    clef: 'treble',
    staffPosition: 1,
    groupId: 'treble-lines',
    mnemonicWord: noteName,
    mnemonicPhrase: noteName,
    mnemonicWordIndex: 0,
  };
}

describe('isExactMatch', () => {
  it('matches the correct letter case-insensitively', () => {
    const note = makeNote('E');
    expect(isExactMatch('e', note)).toBe(true);
    expect(isExactMatch('E', note)).toBe(true);
  });

  it('rejects a different letter', () => {
    const note = makeNote('E');
    expect(isExactMatch('g', note)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isExactMatch('', makeNote('A'))).toBe(false);
  });

  it('rejects whitespace-only input', () => {
    expect(isExactMatch('  ', makeNote('A'))).toBe(false);
  });
});

describe('isValidPrefix', () => {
  it('empty input is always a valid prefix', () => {
    expect(isValidPrefix('', makeNote('E'))).toBe(true);
  });

  it('the correct letter is a valid prefix', () => {
    expect(isValidPrefix('e', makeNote('E'))).toBe(true);
    expect(isValidPrefix('E', makeNote('E'))).toBe(true);
  });

  it('a wrong letter is not a valid prefix', () => {
    expect(isValidPrefix('g', makeNote('E'))).toBe(false);
  });
});
