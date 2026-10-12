import { RECIPE_SCHEMA_VERSION } from '../../../core/models/Recipe';
import { loadRecipe, newRecipe, serializeRecipe } from './recipe-loader';

describe('loadRecipe', () => {
  it('fills in defaults for a minimal file', () => {
    const result = loadRecipe({ title: 'Toast' }, 'toast');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe).toMatchObject({
      schemaVersion: RECIPE_SCHEMA_VERSION,
      id: 'toast',
      origin: 'own',
      title: 'Toast',
      ingredientGroups: [],
      stepGroups: [],
      optionGroups: [],
      tags: [],
      images: [],
      household: { frequency: 'want-to-try', trust: 'untested', cookLog: [] },
    });
    expect(result.recipe.uid).toBeTruthy();
    expect(result.changed).toBe(true); // uid had to be generated
  });

  it('round-trips a saved recipe unchanged', () => {
    const recipe = newRecipe('ramen', 'Ramen', { rating: 8, frequency: 'staple' });
    recipe.ingredientGroups = [{ items: [{ raw: '2 packs noodles', quantity: 2, name: 'packs noodles' }] }];
    recipe.optionGroups = [
      {
        id: 'toppings',
        name: 'Toppings',
        kind: 'pickAny',
        defaultOptionIds: ['egg'],
        options: [{ id: 'egg', name: 'Soft egg', ingredients: [{ raw: '1 egg', quantity: 1, name: 'egg' }], steps: [] }],
      },
    ];
    recipe.household.cookLog = [{ id: 'log-a', date: '2026-10-01', optionIds: ['egg', 'gone'], servingsMade: 2 }];

    const result = loadRecipe(JSON.parse(serializeRecipe(recipe)), 'ramen');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe).toEqual(recipe);
    expect(result.warnings).toEqual([]);
    expect(result.changed).toBe(false);
  });

  it.each([
    [null, 'not a JSON object'],
    [[], 'not a JSON object'],
    [{}, 'Missing title'],
    [{ title: '   ' }, 'Missing title'],
    [{ title: 'X', schemaVersion: 'one' }, 'schemaVersion'],
  ])('rejects %j', (data, message) => {
    const result = loadRecipe(data, 'x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });

  it('refuses files from a newer schema instead of mangling them', () => {
    const result = loadRecipe({ title: 'X', schemaVersion: RECIPE_SCHEMA_VERSION + 1 }, 'x');
    expect(result.ok).toBe(false);
  });

  it('uses the folder name as the id', () => {
    const result = loadRecipe({ title: 'X', id: 'other', uid: 'u' }, 'x');
    expect(result.ok && result.recipe.id).toBe('x');
    expect(result.ok && result.warnings.length).toBe(1);
  });

  it('drops invalid optional values with a warning instead of failing', () => {
    const result = loadRecipe(
      {
        title: 'X',
        uid: 'u',
        servings: -2,
        household: { rating: 11, frequency: 'sometimes', cookLog: [{ date: 'yesterday' }] },
      },
      'x',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.servings).toBeUndefined();
    expect(result.recipe.household.rating).toBeUndefined();
    expect(result.recipe.household.frequency).toBe('want-to-try');
    expect(result.recipe.household.cookLog).toEqual([]);
    expect(result.warnings.length).toBe(4);
  });

  it('accepts plain-string steps from hand-written files', () => {
    const result = loadRecipe({ title: 'X', stepGroups: [{ steps: ['Boil.', { text: 'Serve.' }] }] }, 'x');
    expect(result.ok && result.recipe.stepGroups[0].steps).toEqual([{ text: 'Boil.' }, { text: 'Serve.' }]);
  });

  it('skips ingredients without raw text and lowercases/dedupes tags', () => {
    const result = loadRecipe(
      { title: 'X', ingredientGroups: [{ items: [{ name: 'no raw' }, { raw: '1 egg' }] }], tags: ['Meal:Dinner', 'meal:dinner'] },
      'x',
    );
    expect(result.ok && result.recipe.ingredientGroups[0].items).toEqual([{ raw: '1 egg' }]);
    expect(result.ok && result.recipe.tags).toEqual(['meal:dinner']);
  });

  it('enforces unique option ids and keeps defaults valid', () => {
    const result = loadRecipe(
      {
        title: 'X',
        optionGroups: [
          {
            id: 'protein',
            name: 'Protein',
            kind: 'pickOne',
            defaultOptionIds: ['tofu', 'chicken', 'missing'],
            options: [
              { id: 'chicken', name: 'Chicken' },
              { id: 'chicken', name: 'Duplicate' },
              { id: 'tofu', name: 'Tofu' },
            ],
          },
        ],
      },
      'x',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const group = result.recipe.optionGroups[0];
    expect(group.options.map((o) => o.id)).toEqual(['chicken', 'tofu']);
    expect(group.defaultOptionIds).toEqual(['tofu']); // pickOne keeps one valid default
  });

  it('rejects image paths that try to leave the recipe folder and keeps one cover', () => {
    const result = loadRecipe(
      {
        title: 'X',
        images: [
          { file: '../secret.webp' },
          { file: 'img-a.webp', isCover: true },
          { file: 'img-b.webp', isCover: true },
        ],
      },
      'x',
    );
    expect(result.ok && result.recipe.images.map((i) => [i.file, i.isCover])).toEqual([
      ['img-a.webp', true],
      ['img-b.webp', undefined],
    ]);
  });

  it('only keeps http(s) source urls', () => {
    const result = loadRecipe({ title: 'X', source: { url: 'javascript:alert(1)', siteName: 'Site' } }, 'x');
    expect(result.ok && result.recipe.source).toEqual({ siteName: 'Site' });
  });
});
