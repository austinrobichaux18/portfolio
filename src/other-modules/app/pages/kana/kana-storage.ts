import { KanaCharStat, KanaCharStatsMap } from '../../core/models/KanaCharStats';
import { KanaSessionSummary } from '../../core/models/KanaSessionSummary';
import { KANA_CHARS } from '../../core/data/kana-chars';

const CHAR_STATS_KEY = 'other-modules-kana:char-stats';
const HISTORY_KEY = 'other-modules-kana:history';
const SELECTED_CHAR_IDS_KEY = 'other-modules-kana:selected-char-ids';

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

export function loadSelectedCharIds(): string[] {
  try {
    const raw = localStorage.getItem(SELECTED_CHAR_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(KANA_CHARS.map((c) => c.id));
    return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id));
  } catch {
    return [];
  }
}

export function saveSelectedCharIds(ids: Set<string>): void {
  try {
    localStorage.setItem(SELECTED_CHAR_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // Selection just won't persist across sessions — not worth surfacing to the user.
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

export interface KanaImportPayload {
  charStats: KanaCharStatsMap;
  history: KanaSessionSummary[];
}

export function parseImportPayload(raw: string): KanaImportPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const data = parsed as Record<string, unknown>;
    const charStats = isValidCharStatsMap(data['charStats']) ? data['charStats'] : {};
    const history = Array.isArray(data['history'])
      ? data['history'].filter(isValidSessionSummary)
      : [];
    return { charStats, history };
  } catch {
    return null;
  }
}

/** Sums attempts/correct/time per character — safe because both sides are additive cumulative counters. */
export function mergeCharStats(a: KanaCharStatsMap, b: KanaCharStatsMap): KanaCharStatsMap {
  const merged: KanaCharStatsMap = { ...a };
  for (const [id, stat] of Object.entries(b)) {
    const prev = merged[id] ?? { attempts: 0, correct: 0, totalTimeMs: 0 };
    merged[id] = {
      attempts: prev.attempts + stat.attempts,
      correct: prev.correct + stat.correct,
      totalTimeMs: prev.totalTimeMs + stat.totalTimeMs,
    };
  }
  return merged;
}

/** Concatenates session history, de-duplicating by timestamp so re-importing the same backup is harmless. */
export function mergeHistory(
  a: KanaSessionSummary[],
  b: KanaSessionSummary[],
): KanaSessionSummary[] {
  const byTimestamp = new Map(a.map((entry) => [entry.timestamp, entry]));
  for (const entry of b) {
    if (!byTimestamp.has(entry.timestamp)) byTimestamp.set(entry.timestamp, entry);
  }
  return [...byTimestamp.values()].sort((x, y) => x.timestamp.localeCompare(y.timestamp));
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
