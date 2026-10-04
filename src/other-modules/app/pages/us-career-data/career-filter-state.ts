/**
 * The shape of a saved/sharable filter state. Used both for the "Copy Shareable Link" URL
 * (JSON, URI-encoded into a single `f` query param) and for saved-search history entries in
 * localStorage. Kept loosely typed (plain strings) rather than importing the component's
 * internal union types, since this also has to survive a JSON round-trip through the URL/storage.
 */
export interface CareerFilterStateJSON {
  q?: string;
  sg?: string[];
  je?: string[];
  ai?: string[];
  rw?: string[];
  jo?: string[];
  ed?: string[];
  ex?: string[];
  r?: Record<string, [number, number]>;
  sf?: string;
  sd?: string;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isRangeMap(value: unknown): value is Record<string, [number, number]> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number'),
  );
}

/** Defensive runtime check for data coming from an untrusted source (a URL or localStorage). */
export function isValidFilterStateJSON(value: unknown): value is CareerFilterStateJSON {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v['q'] !== undefined && typeof v['q'] !== 'string') return false;
  for (const key of ['sg', 'je', 'ai', 'rw', 'jo', 'ed', 'ex']) {
    if (v[key] !== undefined && !isStringArray(v[key])) return false;
  }
  if (v['r'] !== undefined && !isRangeMap(v['r'])) return false;
  if (v['sf'] !== undefined && typeof v['sf'] !== 'string') return false;
  if (v['sd'] !== undefined && typeof v['sd'] !== 'string') return false;
  return true;
}
