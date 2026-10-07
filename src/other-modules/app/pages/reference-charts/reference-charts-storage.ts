import { ReferenceCardStat, ReferenceCardStatsMap } from '../../core/models/ReferenceCardStats';
import { ReferenceSessionSummary } from '../../core/models/ReferenceSessionSummary';

const CARD_STATS_KEY = 'other-modules-reference-charts:card-stats';
const HISTORY_KEY = 'other-modules-reference-charts:history';
const SELECTED_TABLE_IDS_KEY = 'other-modules-reference-charts:selected-table-ids';

function isValidCardStat(item: unknown): item is ReferenceCardStat {
  if (typeof item !== 'object' || item === null) return false;
  const s = item as Record<string, unknown>;
  return typeof s['attempts'] === 'number' && typeof s['correct'] === 'number';
}

function isValidCardStatsMap(data: unknown): data is ReferenceCardStatsMap {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  return Object.values(data as Record<string, unknown>).every(isValidCardStat);
}

function isValidSessionSummary(item: unknown): item is ReferenceSessionSummary {
  if (typeof item !== 'object' || item === null) return false;
  const s = item as Record<string, unknown>;
  return (
    typeof s['timestamp'] === 'string' &&
    typeof s['totalAttempts'] === 'number' &&
    typeof s['correctAttempts'] === 'number' &&
    typeof s['cardCount'] === 'number' &&
    (s['missedCards'] === undefined || Array.isArray(s['missedCards']))
  );
}

export function loadCardStats(): ReferenceCardStatsMap {
  try {
    const raw = localStorage.getItem(CARD_STATS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return isValidCardStatsMap(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCardStats(stats: ReferenceCardStatsMap): void {
  try {
    localStorage.setItem(CARD_STATS_KEY, JSON.stringify(stats));
  } catch {
    // Stats just won't persist across sessions — not worth surfacing to the user.
  }
}

export function loadHistory(): ReferenceSessionSummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidSessionSummary) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: ReferenceSessionSummary[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Same as above — persistence is best-effort.
  }
}

/** Returns raw stored ids with no domain validation — the caller intersects with its own known-good table ids. */
export function loadSelectedTableIds(): string[] {
  try {
    const raw = localStorage.getItem(SELECTED_TABLE_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

export function saveSelectedTableIds(ids: Set<string>): void {
  try {
    localStorage.setItem(SELECTED_TABLE_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // Selection just won't persist across sessions — not worth surfacing to the user.
  }
}

export function mergeSessionIntoStats(
  stats: ReferenceCardStatsMap,
  log: { cardId: string; correct: boolean }[],
): ReferenceCardStatsMap {
  const next: ReferenceCardStatsMap = { ...stats };
  for (const entry of log) {
    const prev = next[entry.cardId] ?? { attempts: 0, correct: 0 };
    next[entry.cardId] = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (entry.correct ? 1 : 0),
    };
  }
  return next;
}
