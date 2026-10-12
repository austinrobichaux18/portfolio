import { MusicNoteStat, MusicNoteStatsMap } from '../../core/models/MusicNoteStats';
import { MusicSessionSummary } from '../../core/models/MusicSessionSummary';
import { MUSIC_NOTES } from '../../core/data/music-notes';

const NOTE_STATS_KEY = 'other-modules-music-note:note-stats';
const HISTORY_KEY = 'other-modules-music-note:history';
const SELECTED_NOTE_IDS_KEY = 'other-modules-music-note:selected-note-ids';

function isValidNoteStat(item: unknown): item is MusicNoteStat {
  if (typeof item !== 'object' || item === null) return false;
  const s = item as Record<string, unknown>;
  return (
    typeof s['attempts'] === 'number' &&
    typeof s['correct'] === 'number' &&
    typeof s['totalTimeMs'] === 'number'
  );
}

function isValidNoteStatsMap(data: unknown): data is MusicNoteStatsMap {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  return Object.values(data as Record<string, unknown>).every(isValidNoteStat);
}

function isValidSessionSummary(item: unknown): item is MusicSessionSummary {
  if (typeof item !== 'object' || item === null) return false;
  const s = item as Record<string, unknown>;
  return (
    typeof s['timestamp'] === 'string' &&
    typeof s['durationMs'] === 'number' &&
    typeof s['totalAttempts'] === 'number' &&
    typeof s['correctAttempts'] === 'number' &&
    typeof s['avgTimeMsPerNote'] === 'number' &&
    typeof s['noteCount'] === 'number' &&
    (s['missedNotes'] === undefined || Array.isArray(s['missedNotes']))
  );
}

export function loadNoteStats(): MusicNoteStatsMap {
  try {
    const raw = localStorage.getItem(NOTE_STATS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return isValidNoteStatsMap(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveNoteStats(stats: MusicNoteStatsMap): void {
  try {
    localStorage.setItem(NOTE_STATS_KEY, JSON.stringify(stats));
  } catch {
    // Stats just won't persist across sessions — not worth surfacing to the user.
  }
}

export function loadHistory(): MusicSessionSummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidSessionSummary) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: MusicSessionSummary[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Persistence is best-effort.
  }
}

export function loadSelectedNoteIds(): string[] {
  try {
    const raw = localStorage.getItem(SELECTED_NOTE_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(MUSIC_NOTES.map((n) => n.id));
    return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id));
  } catch {
    return [];
  }
}

export function saveSelectedNoteIds(ids: Set<string>): void {
  try {
    localStorage.setItem(SELECTED_NOTE_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // Selection just won't persist across sessions — not worth surfacing to the user.
  }
}

export function mergeSessionIntoStats(
  stats: MusicNoteStatsMap,
  log: { noteId: string; correct: boolean; timeMs: number }[],
): MusicNoteStatsMap {
  const next: MusicNoteStatsMap = { ...stats };
  for (const entry of log) {
    const prev = next[entry.noteId] ?? { attempts: 0, correct: 0, totalTimeMs: 0 };
    next[entry.noteId] = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (entry.correct ? 1 : 0),
      totalTimeMs: prev.totalTimeMs + entry.timeMs,
    };
  }
  return next;
}

export interface MusicNoteImportPayload {
  noteStats: MusicNoteStatsMap;
  history: MusicSessionSummary[];
}

export function parseImportPayload(raw: string): MusicNoteImportPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const data = parsed as Record<string, unknown>;
    const noteStats = isValidNoteStatsMap(data['noteStats']) ? data['noteStats'] : {};
    const history = Array.isArray(data['history'])
      ? data['history'].filter(isValidSessionSummary)
      : [];
    return { noteStats, history };
  } catch {
    return null;
  }
}

export function mergeNoteStats(a: MusicNoteStatsMap, b: MusicNoteStatsMap): MusicNoteStatsMap {
  const merged: MusicNoteStatsMap = { ...a };
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

export function mergeHistory(
  a: MusicSessionSummary[],
  b: MusicSessionSummary[],
): MusicSessionSummary[] {
  const byTimestamp = new Map(a.map((entry) => [entry.timestamp, entry]));
  for (const entry of b) {
    if (!byTimestamp.has(entry.timestamp)) byTimestamp.set(entry.timestamp, entry);
  }
  return [...byTimestamp.values()].sort((x, y) => x.timestamp.localeCompare(y.timestamp));
}

export function downloadStatsAsJson(
  stats: MusicNoteStatsMap,
  history: MusicSessionSummary[],
): void {
  const payload = { exportedAt: new Date().toISOString(), noteStats: stats, history };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'music-note-stats.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSessionAsJson(summary: MusicSessionSummary): void {
  const noteById = new Map(MUSIC_NOTES.map((n) => [n.id, n]));
  const missedNotes = (summary.missedNotes ?? []).map((m) => {
    const note = noteById.get(m.noteId);
    return {
      note: note?.fullName ?? m.noteId,
      clef: note?.clef ?? null,
      missCount: m.missCount,
    };
  });

  const payload = { ...summary, missedNotes };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `music-note-session-${summary.timestamp.replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
