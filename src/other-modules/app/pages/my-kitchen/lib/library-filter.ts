import { Recipe, RecipeFrequency, RecipeTrust } from '../../../core/models/Recipe';

export type LibrarySort = 'recommended' | 'rating' | 'last-made' | 'newest' | 'title';

export interface LibraryFilter {
  query: string;
  tags: string[];
  frequency: RecipeFrequency | '';
  trust: RecipeTrust | '';
  minRating: number;
}

export const EMPTY_FILTER: LibraryFilter = { query: '', tags: [], frequency: '', trust: '', minRating: 0 };

/** Most recent cook log date (YYYY-MM-DD), if any. */
export function lastMadeDate(recipe: Recipe): string | undefined {
  return recipe.household.cookLog.reduce<string | undefined>(
    (latest, entry) => (!latest || entry.date > latest ? entry.date : latest),
    undefined,
  );
}

/** Only a title so far: missing ingredients or steps. Derived, never stored. */
export function isDraft(recipe: Recipe): boolean {
  const hasIngredients = recipe.ingredientGroups.some((g) => g.items.length > 0);
  const hasSteps = recipe.stepGroups.some((g) => g.steps.length > 0);
  return !hasIngredients || !hasSteps;
}

/** Whole days between two local YYYY-MM-DD dates. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function filterRecipes(recipes: Recipe[], filter: LibraryFilter): Recipe[] {
  const terms = filter.query.toLowerCase().split(/\s+/).filter(Boolean);
  return recipes.filter((recipe) => {
    if (filter.frequency && recipe.household.frequency !== filter.frequency) return false;
    if (filter.trust && recipe.household.trust !== filter.trust) return false;
    if (filter.minRating && (recipe.household.rating ?? 0) < filter.minRating) return false;
    if (!filter.tags.every((tag) => recipe.tags.includes(tag))) return false;
    if (terms.length) {
      const haystack = searchText(recipe);
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  });
}

const TRUST_ORDER: Record<RecipeTrust, number> = { ours: 0, tested: 1, untested: 2 };

export function sortLibrary(recipes: Recipe[], sort: LibrarySort): Recipe[] {
  const byTitle = (a: Recipe, b: Recipe) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  const sorted = [...recipes];
  switch (sort) {
    case 'recommended':
      // Untested recipes sink below the ones we've actually cooked; retired ones go last.
      return sorted.sort(
        (a, b) =>
          Number(a.household.frequency === 'retired') - Number(b.household.frequency === 'retired') ||
          TRUST_ORDER[a.household.trust] - TRUST_ORDER[b.household.trust] ||
          (b.household.rating ?? 0) - (a.household.rating ?? 0) ||
          byTitle(a, b),
      );
    case 'rating':
      return sorted.sort((a, b) => (b.household.rating ?? 0) - (a.household.rating ?? 0) || byTitle(a, b));
    case 'last-made':
      return sorted.sort((a, b) => (lastMadeDate(b) ?? '').localeCompare(lastMadeDate(a) ?? '') || byTitle(a, b));
    case 'newest':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || byTitle(a, b));
    case 'title':
      return sorted.sort(byTitle);
  }
}

/** Title, tags, notes and every ingredient name — so "chickpeas" finds every recipe that uses them. */
function searchText(recipe: Recipe): string {
  const ingredients = [
    ...recipe.ingredientGroups.flatMap((g) => g.items),
    ...recipe.optionGroups.flatMap((g) => g.options.flatMap((o) => o.ingredients)),
  ].map((i) => i.raw);
  const optionNames = recipe.optionGroups.flatMap((g) => [g.name, ...g.options.map((o) => o.name)]);
  return [recipe.title, ...recipe.tags, ...ingredients, ...optionNames, recipe.household.notes ?? '']
    .join('\n')
    .toLowerCase();
}
