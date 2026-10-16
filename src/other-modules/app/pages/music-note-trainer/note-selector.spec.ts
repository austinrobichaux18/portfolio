import { pickNextNote } from './note-selector';
import { MusicNote } from '../../core/models/MusicNote';
import { MusicNoteStatsMap } from '../../core/models/MusicNoteStats';

function makeNote(id: string): MusicNote {
  return {
    id,
    noteName: id,
    fullName: id,
    clef: 'treble',
    staffPosition: 1,
    groupId: 'treble-lines',
    mnemonicWord: id,
    mnemonicPhrase: id,
    mnemonicWordIndex: 0,
  };
}

/**
 * Feeds pickNextNote evenly spaced rolls across [0, 1) instead of Math.random(), so a weighting
 * test counts each note's exact share of the range rather than a sample that can fail by chance.
 */
function countPicks(
  pool: MusicNote[],
  stats: MusicNoteStatsMap,
  noteId: string,
  trials: number,
): number {
  const random = vi.spyOn(Math, 'random');
  let count = 0;
  for (let i = 0; i < trials; i++) {
    random.mockReturnValueOnce((i + 0.5) / trials);
    if (pickNextNote(pool, stats, null).id === noteId) count++;
  }
  random.mockRestore();
  return count;
}

describe('pickNextNote', () => {
  it('never repeats the previous note when more than one is available', () => {
    const pool = [makeNote('a'), makeNote('b')];
    const stats: MusicNoteStatsMap = {};
    for (let i = 0; i < 20; i++) {
      const next = pickNextNote(pool, stats, 'a');
      expect(next.id).toBe('b');
    }
  });

  it('weights a note with worse accuracy higher than one with a perfect record', () => {
    const pool = [makeNote('weak'), makeNote('strong')];
    const stats: MusicNoteStatsMap = {
      weak: { attempts: 10, correct: 1, totalTimeMs: 0 },
      strong: { attempts: 10, correct: 10, totalTimeMs: 0 },
    };

    const trials = 500;
    const weakCount = countPicks(pool, stats, 'weak', trials);
    expect(weakCount).toBeGreaterThan(trials * 0.7);
  });

  it('weights a slow-but-correct note higher than a fast-and-correct one', () => {
    const pool = [makeNote('slow'), makeNote('fast')];
    const stats: MusicNoteStatsMap = {
      slow: { attempts: 10, correct: 10, totalTimeMs: 10 * 10000 },
      fast: { attempts: 10, correct: 10, totalTimeMs: 10 * 1000 },
    };

    const trials = 500;
    const slowCount = countPicks(pool, stats, 'slow', trials);
    expect(slowCount).toBeGreaterThan(trials * 0.55);
  });

  it('weights an incorrect answer higher than a maxed-out slow-but-correct one', () => {
    const pool = [makeNote('wrong'), makeNote('slowCorrect')];
    const stats: MusicNoteStatsMap = {
      wrong: { attempts: 10, correct: 9, totalTimeMs: 10 * 1000 },
      slowCorrect: { attempts: 10, correct: 10, totalTimeMs: 10 * 100000 },
    };

    const trials = 500;
    const wrongCount = countPicks(pool, stats, 'wrong', trials);
    expect(wrongCount).toBeGreaterThan(trials * 0.5);
  });
});
