import { HouseholdRecipeData, Recipe } from '../../../core/models/Recipe';
import { newRecipe } from './recipe-loader';
import { suggest } from './suggestions';

function recipe(id: string, household: Partial<HouseholdRecipeData>, lastMade?: string, createdAt?: string): Recipe {
  const r = newRecipe(id, id, household);
  if (lastMade) r.household.cookLog = [{ id: 'l', date: lastMade, optionIds: [] }];
  if (createdAt) r.createdAt = createdAt;
  return r;
}

const TODAY = '2026-10-12';

describe('suggest', () => {
  it('lists recipes past their target interval, most overdue (relative to target) first', () => {
    const result = suggest(
      [
        recipe('staple-10d', { frequency: 'staple' }, '2026-10-02'), // 10/7
        recipe('staple-3d', { frequency: 'staple' }, '2026-10-09'), // not due
        recipe('regular-28d', { frequency: 'regular' }, '2026-09-14'), // 28/14
        recipe('occasional-31d', { frequency: 'occasional' }, '2026-09-11'), // 31/30
      ],
      TODAY,
    );
    expect(result.overdue.map((o) => [o.recipe.id, o.daysSince])).toEqual([
      ['regular-28d', 28],
      ['staple-10d', 10],
      ['occasional-31d', 31],
    ]);
  });

  it('puts never-logged regulars in their own group instead of calling them overdue', () => {
    const result = suggest(
      [recipe('a', { frequency: 'staple', rating: 7 }), recipe('b', { frequency: 'regular', rating: 9 })],
      TODAY,
    );
    expect(result.overdue).toEqual([]);
    expect(result.unlogged.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('never suggests rare, retired or want-to-try recipes as overdue', () => {
    const result = suggest(
      [
        recipe('rare', { frequency: 'rare' }, '2025-01-01'),
        recipe('retired', { frequency: 'retired' }, '2025-01-01'),
        recipe('try', { frequency: 'want-to-try' }),
      ],
      TODAY,
    );
    expect(result.overdue).toEqual([]);
    expect(result.unlogged).toEqual([]);
    expect(result.wantToTry.map((r) => r.id)).toEqual(['try']);
  });

  it('offers the longest-waiting want-to-try recipes, up to three', () => {
    const result = suggest(
      ['d', 'a', 'c', 'b'].map((id, i) =>
        recipe(id, { frequency: 'want-to-try' }, undefined, `2026-0${[4, 1, 3, 2][i]}-01T00:00:00Z`),
      ),
      TODAY,
    );
    expect(result.wantToTry.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('lists cooked-but-unrated recipes to rate', () => {
    const result = suggest(
      [
        recipe('cooked-unrated', { frequency: 'regular' }, '2026-10-10'),
        recipe('cooked-rated', { frequency: 'regular', rating: 8 }, '2026-10-10'),
        recipe('never-cooked', { frequency: 'regular' }),
      ],
      TODAY,
    );
    expect(result.unrated.map((r) => r.id)).toEqual(['cooked-unrated']);
  });
});
