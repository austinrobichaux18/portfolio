import { RecipeFrequency, RecipeTrust } from '../models/Recipe';

export interface FrequencyInfo {
  id: RecipeFrequency;
  label: string;
  description: string;
  /** Roughly how often we want it; drives "overdue" suggestions. Null = never suggested as overdue. */
  targetDays: number | null;
}

export const FREQUENCIES: FrequencyInfo[] = [
  { id: 'staple', label: 'Staple', description: 'Weekly-ish', targetDays: 7 },
  { id: 'regular', label: 'Regular', description: 'A couple times a month', targetDays: 14 },
  { id: 'occasional', label: 'Occasional', description: 'Monthly-ish', targetDays: 30 },
  { id: 'rare', label: 'Rare', description: 'Special occasions', targetDays: null },
  { id: 'want-to-try', label: 'Want to try', description: 'Never made yet', targetDays: null },
  { id: 'retired', label: 'Retired', description: "Don't make it anymore", targetDays: null },
];

export interface TrustInfo {
  id: RecipeTrust;
  label: string;
  description: string;
}

export const TRUST_LEVELS: TrustInfo[] = [
  { id: 'untested', label: 'Untested', description: 'Never cooked by us' },
  { id: 'tested', label: 'Tested', description: 'Cooked and kept' },
  { id: 'ours', label: 'Ours', description: 'Family-approved version' },
];

/** Tag prefixes offered first in the tag autocomplete; any other tag is still allowed. */
export const TAG_PREFIXES = ['cuisine', 'meal', 'equip', 'diet', 'effort'] as const;

export function frequencyInfo(id: RecipeFrequency): FrequencyInfo {
  return FREQUENCIES.find((f) => f.id === id) ?? FREQUENCIES[0];
}

export function trustInfo(id: RecipeTrust): TrustInfo {
  return TRUST_LEVELS.find((t) => t.id === id) ?? TRUST_LEVELS[0];
}
