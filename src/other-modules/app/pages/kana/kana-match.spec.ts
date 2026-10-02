import { isExactMatch, isValidPrefix } from './kana-match';
import { KanaChar } from '../../core/models/KanaChar';

const shi: KanaChar = {
  id: 'hiragana:し',
  char: 'し',
  romaji: 'shi',
  altRomaji: ['si'],
  script: 'hiragana',
  rowId: 'sa',
};

describe('kana-match', () => {
  it('accepts the primary romaji as an exact match', () => {
    expect(isExactMatch('shi', shi)).toBe(true);
  });

  it('accepts an alternate spelling as an exact match', () => {
    expect(isExactMatch('si', shi)).toBe(true);
  });

  it('treats a partial but valid prefix as neither exact nor invalid', () => {
    expect(isExactMatch('s', shi)).toBe(false);
    expect(isValidPrefix('s', shi)).toBe(true);
  });

  it('rejects input that cannot lead to any accepted spelling', () => {
    expect(isValidPrefix('x', shi)).toBe(false);
  });
});
