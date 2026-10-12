import { frequencyInfo } from '../../../core/data/recipe-statuses';
import { Recipe } from '../../../core/models/Recipe';
import { daysBetween, lastMadeDate } from './library-filter';

export interface OverdueSuggestion {
  recipe: Recipe;
  daysSince: number;
  targetDays: number;
}

export interface Suggestions {
  /** Staples/regulars/occasionals made longer ago than their target interval, most overdue first. */
  overdue: OverdueSuggestion[];
  /** Recipes we make regularly but haven't logged a cook for yet — "last made" unknown, not overdue. */
  unlogged: Recipe[];
  /** "Want to try" recipes, longest-waiting first. */
  wantToTry: Recipe[];
  /** Cooked at least once but never given an overall rating. */
  unrated: Recipe[];
}

const LIMIT = 6;

/** "What should we make?" — a pure function of the library and today's local date. */
export function suggest(recipes: Recipe[], today: string): Suggestions {
  const overdue: OverdueSuggestion[] = [];
  const unlogged: Recipe[] = [];

  for (const recipe of recipes) {
    const targetDays = frequencyInfo(recipe.household.frequency).targetDays;
    if (targetDays === null) continue;
    const last = lastMadeDate(recipe);
    if (!last) {
      unlogged.push(recipe);
      continue;
    }
    const daysSince = daysBetween(last, today);
    if (daysSince >= targetDays) overdue.push({ recipe, daysSince, targetDays });
  }

  overdue.sort((a, b) => b.daysSince / b.targetDays - a.daysSince / a.targetDays);
  unlogged.sort((a, b) => (b.household.rating ?? 0) - (a.household.rating ?? 0) || a.title.localeCompare(b.title));

  const wantToTry = recipes
    .filter((r) => r.household.frequency === 'want-to-try')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const unrated = recipes.filter(
    (r) => r.household.rating === undefined && r.household.cookLog.length > 0 && r.household.frequency !== 'retired',
  );

  return {
    overdue: overdue.slice(0, LIMIT),
    unlogged: unlogged.slice(0, LIMIT),
    wantToTry: wantToTry.slice(0, 3),
    unrated: unrated.slice(0, LIMIT),
  };
}
