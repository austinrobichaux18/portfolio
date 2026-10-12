import { Recipe } from '../../../core/models/Recipe';
import { parseIngredientLine } from './ingredient-parser';
import { applyForm, formFromRecipe, normalizeTags } from './recipe-form';
import { newRecipe } from './recipe-loader';

function ramen(): Recipe {
  const recipe = newRecipe('ramen', 'Ramen', { rating: 9, frequency: 'staple', notes: 'Kids love it' });
  recipe.servings = 2;
  recipe.prepMinutes = 10;
  recipe.tags = ['cuisine:japanese', 'meal:dinner'];
  recipe.source = { url: 'https://example.com/ramen', siteName: 'Example' };
  recipe.ingredientGroups = [
    { items: [{ ...parseIngredientLine('2 packs ramen noodles'), ingredientId: 'noodles' }] },
    { name: 'Broth', items: [parseIngredientLine('4 cups chicken stock')] },
  ];
  recipe.stepGroups = [{ steps: [{ text: 'Boil stock.', timerMinutes: 10 }, { text: 'Add noodles.' }] }];
  recipe.optionGroups = [
    {
      id: 'toppings',
      name: 'Toppings',
      kind: 'pickAny',
      defaultOptionIds: ['soft-egg'],
      options: [
        { id: 'soft-egg', name: 'Soft egg', ingredients: [parseIngredientLine('1 egg')], steps: [{ text: 'Boil 6.5 min.' }] },
        { id: 'broccoli', name: 'Broccoli', ingredients: [parseIngredientLine('1 cup broccoli')], steps: [], note: 'Steam it' },
      ],
    },
    {
      id: 'protein',
      name: 'Protein',
      kind: 'pickOne',
      defaultOptionIds: ['chashu'],
      options: [
        { id: 'chashu', name: 'Chashu', ingredients: [], steps: [] },
        { id: 'tofu', name: 'Tofu', ingredients: [], steps: [] },
      ],
    },
  ];
  recipe.images = [{ file: 'img-a.webp', thumb: 'img-a.thumb.webp', isCover: true, origin: 'own' }];
  recipe.household.cookLog = [{ id: 'l1', date: '2026-10-01', optionIds: ['soft-egg'] }];
  return recipe;
}

describe('recipe form', () => {
  it('round-trips: applying the unchanged form gives back the same recipe', () => {
    const recipe = ramen();
    expect(applyForm(formFromRecipe(recipe), recipe)).toEqual(recipe);
  });

  it('applies edits while keeping settings on unchanged lines and untouched data', () => {
    const recipe = ramen();
    const form = formFromRecipe(recipe);
    form.title = '  Weeknight Ramen ';
    form.ingredientsText += '\n1 tbsp chili oil';
    form.servings = '';

    const updated = applyForm(form, recipe);

    expect(updated.title).toBe('Weeknight Ramen');
    expect(updated.id).toBe('ramen');
    expect(updated.ingredientGroups[0].items[0].ingredientId).toBe('noodles');
    expect(updated.ingredientGroups[1].items.map((i) => i.name)).toEqual(['chicken stock', 'chili oil']);
    expect(updated.servings).toBeUndefined();
    expect(updated.images).toEqual(recipe.images);
    expect(updated.household.cookLog).toEqual(recipe.household.cookLog);
    expect(updated.household.rating).toBe(9);
  });

  it('gives new options and groups ids from their names, unique within the group', () => {
    const recipe = ramen();
    const form = formFromRecipe(recipe);
    form.optionGroups[0].options.push(
      { name: 'Soft egg', ingredientsText: '2 eggs', stepsText: '', note: '', isDefault: false },
      { name: 'Corn', ingredientsText: '', stepsText: '', note: '', isDefault: true },
    );
    form.optionGroups.push({
      name: 'Broth',
      kind: 'pickOne',
      options: [{ name: 'Miso', ingredientsText: '', stepsText: '', note: '', isDefault: true }],
    });

    const updated = applyForm(form, recipe);

    expect(updated.optionGroups[0].options.map((o) => o.id)).toEqual(['soft-egg', 'broccoli', 'soft-egg-2', 'corn']);
    expect(updated.optionGroups[0].defaultOptionIds).toEqual(['soft-egg', 'corn']);
    expect(updated.optionGroups[2]).toMatchObject({ id: 'broth', defaultOptionIds: ['miso'] });
  });

  it('keeps only one default for pick-one groups and drops unnamed options/groups', () => {
    const recipe = ramen();
    const form = formFromRecipe(recipe);
    form.optionGroups[1].options.forEach((o) => (o.isDefault = true));
    form.optionGroups[1].options.push({ name: '  ', ingredientsText: '', stepsText: '', note: '', isDefault: false });
    form.optionGroups.push({ name: '', kind: 'pickAny', options: [] });

    const updated = applyForm(form, recipe);

    expect(updated.optionGroups).toHaveLength(2);
    expect(updated.optionGroups[1].defaultOptionIds).toEqual(['chashu']);
    expect(updated.optionGroups[1].options).toHaveLength(2);
  });

  it('ignores non-http source urls and invalid numbers', () => {
    const recipe = ramen();
    const form = formFromRecipe(recipe);
    form.sourceUrl = 'javascript:alert(1)';
    form.sourceSiteName = '';
    form.prepMinutes = 'abc';
    form.cookMinutes = '-5';

    const updated = applyForm(form, recipe);

    expect(updated.source).toBeUndefined();
    expect(updated.prepMinutes).toBeUndefined();
    expect(updated.cookMinutes).toBeUndefined();
  });
});

describe('normalizeTags', () => {
  it('lowercases, joins words with dashes, tidies prefixes and dedupes', () => {
    expect(normalizeTags(['Cuisine : Japanese', 'cuisine:japanese', 'Date Night', ' '])).toEqual([
      'cuisine:japanese',
      'date-night',
    ]);
  });
});
