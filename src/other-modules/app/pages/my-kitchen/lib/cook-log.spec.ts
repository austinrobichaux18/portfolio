import { applyMadeIt, deleteCookEntry, optionNames } from './cook-log';
import { newRecipe } from './recipe-loader';

describe('applyMadeIt', () => {
  it('adds an entry with only the fields given, without touching the overall rating', () => {
    const recipe = newRecipe('x', 'X', { rating: 6 });
    const updated = applyMadeIt(recipe, { date: '2026-10-12', servingsMade: 4, optionIds: ['egg'], rating: 9, note: '  ' });

    expect(updated.household.cookLog).toEqual([
      { id: expect.stringMatching(/^log-/), date: '2026-10-12', servingsMade: 4, optionIds: ['egg'], rating: 9 },
    ]);
    expect(updated.household.rating).toBe(6);
    expect(recipe.household.cookLog).toEqual([]); // original untouched
  });

  it('sets the overall rating only when explicitly chosen', () => {
    const updated = applyMadeIt(newRecipe('x', 'X'), { date: '2026-10-12', optionIds: [], overallRating: 8, rating: 8 });
    expect(updated.household.rating).toBe(8);
  });

  it('keeps the log in date order', () => {
    let recipe = applyMadeIt(newRecipe('x', 'X'), { date: '2026-10-12', optionIds: [] });
    recipe = applyMadeIt(recipe, { date: '2026-09-01', optionIds: [] });
    expect(recipe.household.cookLog.map((e) => e.date)).toEqual(['2026-09-01', '2026-10-12']);
  });

  it('edits an entry in place and keeps its pantry deductions', () => {
    const recipe = newRecipe('x', 'X');
    recipe.household.cookLog = [
      { id: 'a', date: '2026-10-01', optionIds: [], note: 'old', pantryDeductions: [{ pantryItemId: 'eggs', amount: 2 }] },
    ];
    const updated = applyMadeIt(recipe, { date: '2026-10-02', optionIds: ['egg'], note: 'new' }, 'a');
    expect(updated.household.cookLog).toEqual([
      { id: 'a', date: '2026-10-02', optionIds: ['egg'], note: 'new', pantryDeductions: [{ pantryItemId: 'eggs', amount: 2 }] },
    ]);
  });

  it('marks a kept first cook as tested with the chosen frequency', () => {
    const recipe = newRecipe('x', 'X', { trust: 'untested', frequency: 'want-to-try' });
    const updated = applyMadeIt(recipe, { date: '2026-10-12', optionIds: [], firstCook: { keep: true, frequency: 'occasional' } });
    expect(updated.household).toMatchObject({ trust: 'tested', frequency: 'occasional' });
  });

  it('retires a first cook we did not like', () => {
    const recipe = newRecipe('x', 'X', { trust: 'untested', frequency: 'want-to-try' });
    const updated = applyMadeIt(recipe, { date: '2026-10-12', optionIds: [], firstCook: { keep: false, frequency: 'occasional' } });
    expect(updated.household.frequency).toBe('retired');
  });
});

describe('deleteCookEntry / optionNames', () => {
  it('removes one entry', () => {
    const recipe = newRecipe('x', 'X');
    recipe.household.cookLog = [
      { id: 'a', date: '2026-10-01', optionIds: [] },
      { id: 'b', date: '2026-10-02', optionIds: [] },
    ];
    expect(deleteCookEntry(recipe, 'a').household.cookLog.map((e) => e.id)).toEqual(['b']);
  });

  it('names options and marks deleted ones', () => {
    const recipe = newRecipe('x', 'X');
    recipe.optionGroups = [
      { id: 'g', name: 'G', kind: 'pickAny', defaultOptionIds: [], options: [{ id: 'egg', name: 'Egg', ingredients: [], steps: [] }] },
    ];
    expect(optionNames(recipe, ['egg', 'gone'])).toEqual(['Egg', '(removed option)']);
  });
});
