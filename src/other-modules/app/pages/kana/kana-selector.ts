import { KanaChar } from '../../core/models/KanaChar';
import { KanaCharStatsMap } from '../../core/models/KanaCharStats';

const MIN_WEIGHT = 0.05;

function charWeight(stats: KanaCharStatsMap, charId: string): number {
  const stat = stats[charId];
  const attempts = stat?.attempts ?? 0;
  const correct = stat?.correct ?? 0;
  const misses = attempts - correct;
  const missRate = (misses + 1) / (attempts + 2);
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
