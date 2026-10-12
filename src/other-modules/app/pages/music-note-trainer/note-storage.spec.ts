import {
  loadSelectedNoteIds,
  mergeNoteStats,
  mergeHistory,
  parseImportPayload,
  saveSelectedNoteIds,
} from './note-storage';
import { MusicSessionSummary } from '../../core/models/MusicSessionSummary';

function makeSession(timestamp: string): MusicSessionSummary {
  return {
    timestamp,
    durationMs: 1000,
    totalAttempts: 5,
    correctAttempts: 4,
    avgTimeMsPerNote: 200,
    noteCount: 5,
  };
}

describe('mergeNoteStats', () => {
  it('sums attempts, correct, and time for notes present on both sides', () => {
    const a = { 'treble:e4': { attempts: 2, correct: 1, totalTimeMs: 500 } };
    const b = { 'treble:e4': { attempts: 3, correct: 3, totalTimeMs: 900 } };
    expect(mergeNoteStats(a, b)).toEqual({
      'treble:e4': { attempts: 5, correct: 4, totalTimeMs: 1400 },
    });
  });

  it('keeps notes that only appear on one side untouched', () => {
    const a = { 'treble:e4': { attempts: 2, correct: 1, totalTimeMs: 500 } };
    const b = { 'bass:g2': { attempts: 1, correct: 1, totalTimeMs: 100 } };
    expect(mergeNoteStats(a, b)).toEqual({
      'treble:e4': { attempts: 2, correct: 1, totalTimeMs: 500 },
      'bass:g2': { attempts: 1, correct: 1, totalTimeMs: 100 },
    });
  });
});

describe('mergeHistory', () => {
  it('de-duplicates sessions with the same timestamp', () => {
    const shared = makeSession('2026-01-01T00:00:00.000Z');
    const onlyInB = makeSession('2026-01-02T00:00:00.000Z');
    const merged = mergeHistory([shared], [shared, onlyInB]);
    expect(merged.map((s) => s.timestamp)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
    ]);
  });

  it('sorts the merged result chronologically', () => {
    const early = makeSession('2026-01-01T00:00:00.000Z');
    const late = makeSession('2026-02-01T00:00:00.000Z');
    const merged = mergeHistory([late], [early]);
    expect(merged.map((s) => s.timestamp)).toEqual([early.timestamp, late.timestamp]);
  });
});

describe('parseImportPayload', () => {
  it('parses a valid export payload', () => {
    const session = makeSession('2026-01-01T00:00:00.000Z');
    const raw = JSON.stringify({
      noteStats: { 'treble:e4': { attempts: 1, correct: 1, totalTimeMs: 100 } },
      history: [session],
    });
    const result = parseImportPayload(raw);
    expect(result).not.toBeNull();
    expect(result?.history).toEqual([session]);
    expect(result?.noteStats['treble:e4'].attempts).toBe(1);
  });

  it('returns null for unparseable JSON', () => {
    expect(parseImportPayload('not json')).toBeNull();
  });

  it('falls back to empty collections for malformed fields', () => {
    const raw = JSON.stringify({ noteStats: 'nope', history: 'also nope' });
    const result = parseImportPayload(raw);
    expect(result).toEqual({ noteStats: {}, history: [] });
  });
});

describe('selected note id persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a saved selection', () => {
    saveSelectedNoteIds(new Set(['treble:e4', 'bass:g2']));
    expect(loadSelectedNoteIds().sort()).toEqual(['bass:g2', 'treble:e4']);
  });

  it('returns an empty selection when nothing has been saved', () => {
    expect(loadSelectedNoteIds()).toEqual([]);
  });

  it('drops ids that no longer correspond to a known note', () => {
    localStorage.setItem(
      'other-modules-music-note:selected-note-ids',
      JSON.stringify(['treble:e4', 'not-a-real-note']),
    );
    expect(loadSelectedNoteIds()).toEqual(['treble:e4']);
  });

  it('ignores malformed JSON', () => {
    localStorage.setItem('other-modules-music-note:selected-note-ids', 'not json');
    expect(loadSelectedNoteIds()).toEqual([]);
  });
});
