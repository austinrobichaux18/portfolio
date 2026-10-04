import { KanaChar } from '../../core/models/KanaChar';
import { KanaCharStatsMap } from '../../core/models/KanaCharStats';

const MIN_WEIGHT = 0.05;

// Avg response time considered fast/healthy; no time penalty at or below this.
const HEALTHY_TIME_MS = 2000;
// Beyond this, extra slowness stops adding weight (10s is as bad as 100s).
const TIME_CAP_MS = 10000;
const TIME_STEP_MS = 1000;
const MAX_TIME_STEPS = (TIME_CAP_MS - HEALTHY_TIME_MS) / TIME_STEP_MS;
// Capped below 1 so a maxed-out slow-but-correct answer never outweighs an actual miss.
const MAX_TIME_PENALTY = 0.5;

/** Time-based penalty in whole-second steps past the healthy threshold, capped at TIME_CAP_MS. */
function timePenalty(avgTimeMs: number): number {
  const overage = Math.min(avgTimeMs, TIME_CAP_MS) - HEALTHY_TIME_MS;
  if (overage <= 0) return 0;
  const steps = Math.floor(overage / TIME_STEP_MS);
  return (steps / MAX_TIME_STEPS) * MAX_TIME_PENALTY;
}

function charWeight(stats: KanaCharStatsMap, charId: string): number {
  const stat = stats[charId];
  const attempts = stat?.attempts ?? 0;
  const correct = stat?.correct ?? 0;
  const misses = attempts - correct;
  const avgTimeMs = attempts > 0 ? (stat?.totalTimeMs ?? 0) / attempts : 0;

  const effectiveMisses = misses + timePenalty(avgTimeMs);
  const missRate = (effectiveMisses + 1) / (attempts + 2);
  return Math.max(missRate, MIN_WEIGHT);
}

/** Weighted-random pick that favors characters the user misses more often, never repeating the previous pick. */
export function pickNextChar(
  pool: KanaChar[],
  stats: KanaCharStatsMap,
  lastCharId: string | null,
): KanaChar {
  const candidates = pool.length > 1 ? pool.filter((c) => c.id !== lastCharId) : pool;
  const weights = candidates.map((c) => charWeight(stats, c.id));
  const total = weights.reduce((sum, w) => sum + w, 0);

  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
