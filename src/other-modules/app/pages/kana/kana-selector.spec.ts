import { pickNextChar } from './kana-selector';
import { KanaChar } from '../../core/models/KanaChar';
import { KanaCharStatsMap } from '../../core/models/KanaCharStats';

function makeChar(id: string): KanaChar {
  return { id, char: id, romaji: id, altRomaji: [], script: 'hiragana', rowId: 'a' };
}

describe('pickNextChar', () => {
  it('never repeats the previous character when more than one is available', () => {
    const pool = [makeChar('a'), makeChar('b')];
    const stats: KanaCharStatsMap = {};
    for (let i = 0; i < 20; i++) {
      const next = pickNextChar(pool, stats, 'a');
      expect(next.id).toBe('b');
    }
  });

  it('weights a character with worse accuracy higher than one with a perfect record', () => {
    const pool = [makeChar('weak'), makeChar('strong')];
    const stats: KanaCharStatsMap = {
      weak: { attempts: 10, correct: 1, totalTimeMs: 0 },
      strong: { attempts: 10, correct: 10, totalTimeMs: 0 },
    };

    let weakCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const next = pickNextChar(pool, stats, null);
      if (next.id === 'weak') weakCount++;
    }

    expect(weakCount).toBeGreaterThan(trials * 0.7);
  });
});
