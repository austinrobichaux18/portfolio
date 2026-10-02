import {
  loadSelectedCharIds,
  mergeCharStats,
  mergeHistory,
  parseImportPayload,
  saveSelectedCharIds,
} from './kana-storage';
import { KanaSessionSummary } from '../../core/models/KanaSessionSummary';

function makeSession(timestamp: string): KanaSessionSummary {
  return {
    timestamp,
    durationMs: 1000,
    totalAttempts: 5,
    correctAttempts: 4,
    avgTimeMsPerChar: 200,
    charCount: 5,
  };
}

describe('mergeCharStats', () => {
  it('sums attempts, correct, and time for characters present on both sides', () => {
    const a = { 'hiragana:あ': { attempts: 2, correct: 1, totalTimeMs: 500 } };
    const b = { 'hiragana:あ': { attempts: 3, correct: 3, totalTimeMs: 900 } };
    expect(mergeCharStats(a, b)).toEqual({
      'hiragana:あ': { attempts: 5, correct: 4, totalTimeMs: 1400 },
    });
  });

  it('keeps characters that only appear on one side untouched', () => {
    const a = { 'hiragana:あ': { attempts: 2, correct: 1, totalTimeMs: 500 } };
    const b = { 'hiragana:い': { attempts: 1, correct: 1, totalTimeMs: 100 } };
    expect(mergeCharStats(a, b)).toEqual({
      'hiragana:あ': { attempts: 2, correct: 1, totalTimeMs: 500 },
      'hiragana:い': { attempts: 1, correct: 1, totalTimeMs: 100 },
    });
  });
});

describe('mergeHistory', () => {
  it('de-duplicates sessions with the same timestamp instead of double-counting them', () => {
    const shared = makeSession('2026-01-01T00:00:00.000Z');
    const onlyInB = makeSession('2026-01-02T00:00:00.000Z');
    const merged = mergeHistory([shared], [shared, onlyInB]);
    expect(merged.map((s) => s.timestamp)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
    ]);
  });

  it('sorts the merged result chronologically regardless of input order', () => {
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
      charStats: { 'hiragana:あ': { attempts: 1, correct: 1, totalTimeMs: 100 } },
      history: [session],
    });
    const result = parseImportPayload(raw);
    expect(result).not.toBeNull();
    expect(result?.history).toEqual([session]);
    expect(result?.charStats['hiragana:あ'].attempts).toBe(1);
  });

  it('returns null for unparseable JSON', () => {
    expect(parseImportPayload('not json')).toBeNull();
  });

  it('falls back to empty collections for malformed fields rather than rejecting the whole file', () => {
    const raw = JSON.stringify({ charStats: 'nope', history: 'also nope' });
    const result = parseImportPayload(raw);
    expect(result).toEqual({ charStats: {}, history: [] });
  });
});

describe('selected char id persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a saved selection', () => {
    saveSelectedCharIds(new Set(['hiragana:あ', 'hiragana:い']));
    expect(loadSelectedCharIds().sort()).toEqual(['hiragana:あ', 'hiragana:い']);
  });

  it('returns an empty selection when nothing has been saved', () => {
    expect(loadSelectedCharIds()).toEqual([]);
  });

  it('drops ids that no longer correspond to a known character', () => {
    localStorage.setItem(
      'other-modules-kana:selected-char-ids',
      JSON.stringify(['hiragana:あ', 'not-a-real-char']),
    );
    expect(loadSelectedCharIds()).toEqual(['hiragana:あ']);
  });

  it('ignores malformed JSON', () => {
    localStorage.setItem('other-modules-kana:selected-char-ids', 'not json');
    expect(loadSelectedCharIds()).toEqual([]);
  });
});
