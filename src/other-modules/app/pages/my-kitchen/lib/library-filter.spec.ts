import { Recipe } from '../../../core/models/Recipe';
import { parseIngredientLine } from './ingredient-parser';
import { daysBetween, EMPTY_FILTER, filterRecipes, isDraft, lastMadeDate, sortLibrary } from './library-filter';
import { newRecipe } from './recipe-loader';

function recipe(id: string, title: string, overrides: Partial<Recipe['household']> = {}): Recipe {
  const r = newRecipe(id, title, overrides);
  r.ingredientGroups = [{ items: [parseIngredientLine('1 cup rice')] }];
  r.stepGroups = [{ steps: [{ text: 'Cook.' }] }];
  return r;
}

describe('library filter', () => {
  const curry = recipe('curry', 'Chickpea Curry', { rating: 8 });
  curry.ingredientGroups[0].items.push(parseIngredientLine('1 can chickpeas'));
  curry.tags = ['cuisine:indian', 'meal:dinner'];
  const tacos = recipe('tacos', 'Tacos', { rating: 9, frequency: 'staple' });
  tacos.tags = ['meal:dinner'];
  tacos.optionGroups = [
    {
      id: 'protein',
      name: 'Protein',
      kind: 'pickOne',
      defaultOptionIds: [],
      options: [{ id: 'fish', name: 'Fish', ingredients: [parseIngredientLine('1 lb cod')], steps: [] }],
    },
  ];
  const cake = recipe('cake', 'Cake', { trust: 'untested', frequency: 'want-to-try' });
  const all = [curry, tacos, cake];

  it('searches ingredient names, including option ingredients', () => {
    expect(filterRecipes(all, { ...EMPTY_FILTER, query: 'chickpeas' }).map((r) => r.id)).toEqual(['curry']);
    expect(filterRecipes(all, { ...EMPTY_FILTER, query: 'cod' }).map((r) => r.id)).toEqual(['tacos']);
    expect(filterRecipes(all, { ...EMPTY_FILTER, query: 'RICE curry' }).map((r) => r.id)).toEqual(['curry']);
  });

  it('requires every selected tag', () => {
    expect(filterRecipes(all, { ...EMPTY_FILTER, tags: ['meal:dinner'] })).toHaveLength(2);
    expect(filterRecipes(all, { ...EMPTY_FILTER, tags: ['meal:dinner', 'cuisine:indian'] })).toEqual([curry]);
  });

  it('filters by frequency, trust and minimum rating', () => {
    expect(filterRecipes(all, { ...EMPTY_FILTER, frequency: 'staple' })).toEqual([tacos]);
    expect(filterRecipes(all, { ...EMPTY_FILTER, trust: 'untested' })).toEqual([cake]);
    expect(filterRecipes(all, { ...EMPTY_FILTER, minRating: 9 })).toEqual([tacos]);
  });

  it('recommended sort puts untested and retired recipes last', () => {
    const retired = recipe('old', 'Aardvark Stew', { rating: 10, frequency: 'retired' });
    expect(sortLibrary([cake, retired, curry, tacos], 'recommended').map((r) => r.id)).toEqual([
      'tacos',
      'curry',
      'cake',
      'old',
    ]);
  });

  it('sorts by last made, most recent first, never-made last', () => {
    const a = recipe('a', 'A');
    a.household.cookLog = [{ id: '1', date: '2026-09-01', optionIds: [] }, { id: '2', date: '2026-10-01', optionIds: [] }];
    const b = recipe('b', 'B');
    b.household.cookLog = [{ id: '3', date: '2026-09-15', optionIds: [] }];
    const c = recipe('c', 'C');
    expect(sortLibrary([c, b, a], 'last-made').map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(lastMadeDate(a)).toBe('2026-10-01');
    expect(lastMadeDate(c)).toBeUndefined();
  });

  it('counts a recipe without ingredients or steps as a draft', () => {
    expect(isDraft(curry)).toBe(false);
    expect(isDraft(newRecipe('x', 'X'))).toBe(true);
  });

  it('counts days between local dates across months', () => {
    expect(daysBetween('2026-09-28', '2026-10-05')).toBe(7);
  });
});
