import { MusicNote } from '../../core/models/MusicNote';
import { MusicNoteStatsMap } from '../../core/models/MusicNoteStats';

const MIN_WEIGHT = 0.05;

const HEALTHY_TIME_MS = 2000;
const TIME_CAP_MS = 10000;
const TIME_STEP_MS = 1000;
const MAX_TIME_STEPS = (TIME_CAP_MS - HEALTHY_TIME_MS) / TIME_STEP_MS;
const MAX_TIME_PENALTY = 0.5;

function timePenalty(avgTimeMs: number): number {
  const overage = Math.min(avgTimeMs, TIME_CAP_MS) - HEALTHY_TIME_MS;
  if (overage <= 0) return 0;
  const steps = Math.floor(overage / TIME_STEP_MS);
  return (steps / MAX_TIME_STEPS) * MAX_TIME_PENALTY;
}

function noteWeight(stats: MusicNoteStatsMap, noteId: string): number {
  const stat = stats[noteId];
  const attempts = stat?.attempts ?? 0;
  const correct = stat?.correct ?? 0;
  const misses = attempts - correct;
  const avgTimeMs = attempts > 0 ? (stat?.totalTimeMs ?? 0) / attempts : 0;

  const effectiveMisses = misses + timePenalty(avgTimeMs);
  const missRate = (effectiveMisses + 1) / (attempts + 2);
  return Math.max(missRate, MIN_WEIGHT);
}

/** Weighted-random pick that favors notes the user misses more often, never repeating the previous pick. */
export function pickNextNote(
  pool: MusicNote[],
  stats: MusicNoteStatsMap,
  lastNoteId: string | null,
): MusicNote {
  const candidates = pool.length > 1 ? pool.filter((n) => n.id !== lastNoteId) : pool;
  const weights = candidates.map((n) => noteWeight(stats, n.id));
  const total = weights.reduce((sum, w) => sum + w, 0);

  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
