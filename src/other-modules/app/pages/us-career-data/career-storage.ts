import { CareerFilterStateJSON, isValidFilterStateJSON } from './career-filter-state';

const HISTORY_KEY = 'other-modules-career-data:history';

export interface CareerSearchRun {
  timestamp: string;
  label: string;
  state: CareerFilterStateJSON;
  resultCount: number;
}

function isValidRun(item: unknown): item is CareerSearchRun {
  if (typeof item !== 'object' || item === null) return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r['timestamp'] === 'string' &&
    typeof r['label'] === 'string' &&
    isValidFilterStateJSON(r['state']) &&
    typeof r['resultCount'] === 'number'
  );
}

export function loadHistory(): CareerSearchRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidRun) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: CareerSearchRun[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // History just won't persist across sessions -- not worth surfacing to the user.
  }
}
