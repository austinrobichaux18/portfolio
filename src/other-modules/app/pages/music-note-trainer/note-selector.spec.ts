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

    let weakCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      if (pickNextNote(pool, stats, null).id === 'weak') weakCount++;
    }
    expect(weakCount).toBeGreaterThan(trials * 0.7);
  });

  it('weights a slow-but-correct note higher than a fast-and-correct one', () => {
    const pool = [makeNote('slow'), makeNote('fast')];
    const stats: MusicNoteStatsMap = {
      slow: { attempts: 10, correct: 10, totalTimeMs: 10 * 10000 },
      fast: { attempts: 10, correct: 10, totalTimeMs: 10 * 1000 },
    };

    let slowCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      if (pickNextNote(pool, stats, null).id === 'slow') slowCount++;
    }
    expect(slowCount).toBeGreaterThan(trials * 0.55);
  });

  it('weights an incorrect answer higher than a maxed-out slow-but-correct one', () => {
    const pool = [makeNote('wrong'), makeNote('slowCorrect')];
    const stats: MusicNoteStatsMap = {
      wrong: { attempts: 10, correct: 9, totalTimeMs: 10 * 1000 },
      slowCorrect: { attempts: 10, correct: 10, totalTimeMs: 10 * 100000 },
    };

    let wrongCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      if (pickNextNote(pool, stats, null).id === 'wrong') wrongCount++;
    }
    expect(wrongCount).toBeGreaterThan(trials * 0.5);
  });
});
