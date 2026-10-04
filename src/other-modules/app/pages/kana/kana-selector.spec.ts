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

  it('weights a slow-but-correct character higher than a fast-and-correct one', () => {
    const pool = [makeChar('slow'), makeChar('fast')];
    const stats: KanaCharStatsMap = {
      slow: { attempts: 10, correct: 10, totalTimeMs: 10 * 10000 }, // 10s avg, maxed out
      fast: { attempts: 10, correct: 10, totalTimeMs: 10 * 1000 }, // 1s avg, within healthy range
    };

    let slowCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const next = pickNextChar(pool, stats, null);
      if (next.id === 'slow') slowCount++;
    }

    expect(slowCount).toBeGreaterThan(trials * 0.55);
  });

  it('weights an incorrect answer higher than a maxed-out slow-but-correct one', () => {
    const pool = [makeChar('wrong'), makeChar('slowCorrect')];
    const stats: KanaCharStatsMap = {
      wrong: { attempts: 10, correct: 9, totalTimeMs: 10 * 1000 }, // one miss, fast
      slowCorrect: { attempts: 10, correct: 10, totalTimeMs: 10 * 100000 }, // never misses, always maxed-out slow
    };

    let wrongCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const next = pickNextChar(pool, stats, null);
      if (next.id === 'wrong') wrongCount++;
    }

    expect(wrongCount).toBeGreaterThan(trials * 0.5);
  });
});
