import { CookLogEntry } from '../../../core/models/CookLogEntry';
import { Recipe, RecipeFrequency } from '../../../core/models/Recipe';
import { shortRandomId } from './recipe-id';

export interface MadeItInput {
  date: string;
  servingsMade?: number;
  optionIds: string[];
  /** Rating for this attempt. */
  rating?: number;
  /** Explicitly chosen overall rating (the sheet's one-tap rating); never derived automatically. */
  overallRating?: number;
  note?: string;
  images?: string[];
  /** Only for the first cook of an untested recipe: keep it (with a frequency) or retire it. */
  firstCook?: { keep: boolean; frequency: RecipeFrequency };
}

/** Adds a cook log entry, or replaces `entryId`'s entry when editing. Returns a new recipe. */
export function applyMadeIt(recipe: Recipe, input: MadeItInput, entryId?: string): Recipe {
  const entry: CookLogEntry = {
    id: entryId ?? `log-${shortRandomId()}`,
    date: input.date,
    optionIds: [...input.optionIds],
  };
  if (input.servingsMade && input.servingsMade > 0) entry.servingsMade = input.servingsMade;
  if (input.rating) entry.rating = input.rating;
  if (input.note?.trim()) entry.note = input.note.trim();
  if (input.images?.length) entry.images = [...input.images];

  const existing = entryId ? recipe.household.cookLog.find((e) => e.id === entryId) : undefined;
  // Pantry deductions (v2) belong to the original entry and must survive an edit.
  if (existing?.pantryDeductions) entry.pantryDeductions = existing.pantryDeductions;

  const cookLog = existing
    ? recipe.household.cookLog.map((e) => (e.id === entryId ? entry : e))
    : [...recipe.household.cookLog, entry];

  const household = { ...recipe.household, cookLog: sortLog(cookLog) };
  if (input.overallRating) household.rating = input.overallRating;
  if (input.firstCook) {
    household.trust = household.trust === 'untested' ? 'tested' : household.trust;
    household.frequency = input.firstCook.keep ? input.firstCook.frequency : 'retired';
  }
  return { ...recipe, household };
}

export function deleteCookEntry(recipe: Recipe, entryId: string): Recipe {
  return {
    ...recipe,
    household: { ...recipe.household, cookLog: recipe.household.cookLog.filter((e) => e.id !== entryId) },
  };
}

/** Option names for an entry; options deleted since show as "(removed option)". */
export function optionNames(recipe: Recipe, optionIds: string[]): string[] {
  const names = new Map(recipe.optionGroups.flatMap((g) => g.options.map((o) => [o.id, o.name] as const)));
  return optionIds.map((id) => names.get(id) ?? '(removed option)');
}

function sortLog(log: CookLogEntry[]): CookLogEntry[] {
  return [...log].sort((a, b) => a.date.localeCompare(b.date));
}
