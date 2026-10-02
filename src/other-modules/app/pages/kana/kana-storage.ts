import { KanaCharStat, KanaCharStatsMap } from '../../core/models/KanaCharStats';
import { KanaSessionSummary } from '../../core/models/KanaSessionSummary';
import { KANA_CHARS } from '../../core/data/kana-chars';

const CHAR_STATS_KEY = 'other-modules-kana:char-stats';
const HISTORY_KEY = 'other-modules-kana:history';

function isValidCharStat(item: unknown): item is KanaCharStat {
  if (typeof item !== 'object' || item === null) return false;
  const s = item as Record<string, unknown>;
  return (
    typeof s['attempts'] === 'number' &&
    typeof s['correct'] === 'number' &&
    typeof s['totalTimeMs'] === 'number'
  );
}

function isValidCharStatsMap(data: unknown): data is KanaCharStatsMap {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  return Object.values(data as Record<string, unknown>).every(isValidCharStat);
}

function isValidSessionSummary(item: unknown): item is KanaSessionSummary {
  if (typeof item !== 'object' || item === null) return false;
  const s = item as Record<string, unknown>;
  return (
    typeof s['timestamp'] === 'string' &&
    typeof s['durationMs'] === 'number' &&
    typeof s['totalAttempts'] === 'number' &&
    typeof s['correctAttempts'] === 'number' &&
    typeof s['avgTimeMsPerChar'] === 'number' &&
    typeof s['charCount'] === 'number' &&
    (s['missedChars'] === undefined || Array.isArray(s['missedChars']))
  );
}

export function loadCharStats(): KanaCharStatsMap {
  try {
    const raw = localStorage.getItem(CHAR_STATS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return isValidCharStatsMap(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCharStats(stats: KanaCharStatsMap): void {
  try {
    localStorage.setItem(CHAR_STATS_KEY, JSON.stringify(stats));
  } catch {
    // Stats just won't persist across sessions — not worth surfacing to the user.
  }
}

export function loadHistory(): KanaSessionSummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidSessionSummary) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: KanaSessionSummary[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Same as above — persistence is best-effort.
  }
}

export function mergeSessionIntoStats(
  stats: KanaCharStatsMap,
  log: { charId: string; correct: boolean; timeMs: number }[],
): KanaCharStatsMap {
  const next: KanaCharStatsMap = { ...stats };
  for (const entry of log) {
    const prev = next[entry.charId] ?? { attempts: 0, correct: 0, totalTimeMs: 0 };
    next[entry.charId] = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (entry.correct ? 1 : 0),
      totalTimeMs: prev.totalTimeMs + entry.timeMs,
    };
  }
  return next;
}

export function downloadStatsAsJson(stats: KanaCharStatsMap, history: KanaSessionSummary[]): void {
  const payload = { exportedAt: new Date().toISOString(), charStats: stats, history };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kana-stats.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSessionAsJson(summary: KanaSessionSummary): void {
  const charById = new Map(KANA_CHARS.map((c) => [c.id, c]));
  const missedChars = (summary.missedChars ?? []).map((m) => {
    const char = charById.get(m.charId);
    return { char: char?.char ?? m.charId, romaji: char?.romaji ?? null, missCount: m.missCount };
  });

  const payload = { ...summary, missedChars };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kana-session-${summary.timestamp.replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
