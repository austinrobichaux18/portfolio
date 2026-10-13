import { IngredientGroup } from '../../../core/models/RecipeIngredient';
import { StepGroup } from '../../../core/models/Recipe';
import { parseIngredientLine } from './ingredient-parser';
import {
  ingredientsToText,
  parseIngredientsText,
  parseOptionIngredientsText,
  parseStepsText,
  stepsToText,
} from './recipe-text';

describe('ingredients text', () => {
  it('parses lines into an unnamed group, skipping blank lines', () => {
    const groups = parseIngredientsText('2 cups flour\n\n1 tsp salt\n');
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBeUndefined();
    expect(groups[0].items.map((i) => i.name)).toEqual(['flour', 'salt']);
  });

  it('starts a named group at "## Name"', () => {
    const groups = parseIngredientsText('1 lb pork\n## For the sauce\n2 tbsp soy sauce\n1 tbsp mirin');
    expect(groups.map((g) => g.name)).toEqual([undefined, 'For the sauce']);
    expect(groups[1].items).toHaveLength(2);
  });

  it('keeps a heading with no items as an empty group', () => {
    expect(parseIngredientsText('## Garnish')).toEqual([{ name: 'Garnish', items: [] }]);
  });

  it('keeps per-line settings when the line text is unchanged', () => {
    const linked = { ...parseIngredientLine('2 large eggs'), ingredientId: 'eggs' };
    const corrected = { raw: '1 knob ginger', quantity: 1, name: 'ginger', unit: 'piece' as const };
    const previous: IngredientGroup[] = [{ items: [linked, corrected] }];

    const groups = parseIngredientsText('2 large eggs\n1 knob ginger\n1 cup rice', previous);

    expect(groups[0].items[0].ingredientId).toBe('eggs');
    expect(groups[0].items[1]).toEqual(corrected);
    expect(groups[0].items[2].name).toBe('rice');
  });

  it('re-parses a line whose text changed (and drops its old settings)', () => {
    const previous: IngredientGroup[] = [
      { items: [{ ...parseIngredientLine('2 large eggs'), ingredientId: 'eggs' }] },
    ];
    const groups = parseIngredientsText('3 large eggs', previous);
    expect(groups[0].items[0].quantity).toBe(3);
    expect(groups[0].items[0].ingredientId).toBeUndefined();
  });

  it('matches duplicate lines one-to-one', () => {
    const previous: IngredientGroup[] = [
      { items: [{ ...parseIngredientLine('1 tsp salt'), ingredientId: 'salt' }] },
    ];
    const groups = parseIngredientsText('1 tsp salt\n1 tsp salt', previous);
    expect(groups[0].items[0].ingredientId).toBe('salt');
    expect(groups[0].items[1].ingredientId).toBeUndefined();
  });

  it('does not share objects with the previous model', () => {
    const previous: IngredientGroup[] = [{ items: [parseIngredientLine('1 tsp salt')] }];
    const groups = parseIngredientsText('1 tsp salt', previous);
    expect(groups[0].items[0]).not.toBe(previous[0].items[0]);
  });

  it('round-trips model → text → model without losing anything', () => {
    const model: IngredientGroup[] = [
      {
        items: [
          { ...parseIngredientLine('1 (14 oz) can diced tomatoes, drained'), ingredientId: 'tomatoes' },
          parseIngredientLine('1 bay leaf [no-scale]'),
        ],
      },
      { name: 'For the sauce', items: [parseIngredientLine('2 tbsp chili oil (optional)')] },
      { name: 'Garnish', items: [] },
    ];
    const text = ingredientsToText(model);
    expect(parseIngredientsText(text, model)).toEqual(model);
    // Even with no previous model, the parsed fields come back the same (only manual settings need the match).
    const withoutLinks = structuredClone(model);
    delete withoutLinks[0].items[0].ingredientId;
    expect(parseIngredientsText(text)).toEqual(withoutLinks);
  });

  it('round-trips an unnamed group that comes after a named one', () => {
    const model: IngredientGroup[] = [
      { name: 'Broth', items: [parseIngredientLine('4 cups stock')] },
      { items: [parseIngredientLine('2 cups noodles')] },
    ];
    const text = ingredientsToText(model);
    expect(text).toBe('## Broth\n4 cups stock\n\n##\n2 cups noodles');
    expect(parseIngredientsText(text)).toEqual(model);
  });

  it('flattens option ingredients', () => {
    expect(parseOptionIngredientsText('## ignored\n1 egg\n1 tsp chili oil')).toHaveLength(2);
  });
});

describe('steps text', () => {
  it('splits steps on blank lines and keeps single line breaks inside a step', () => {
    const groups = parseStepsText('Boil water.\n\nCook noodles 3 minutes.\nDrain well.');
    expect(groups[0].steps.map((s) => s.text)).toEqual([
      'Boil water.',
      'Cook noodles 3 minutes.\nDrain well.',
    ]);
  });

  it('starts a named group at "## Name", with or without a blank line after it', () => {
    const groups = parseStepsText('Prep.\n\n## Sauce\nWhisk.\n\n## Serve\n\nPlate it.');
    expect(groups.map((g) => g.name)).toEqual([undefined, 'Sauce', 'Serve']);
    expect(groups[1].steps[0].text).toBe('Whisk.');
    expect(groups[2].steps[0].text).toBe('Plate it.');
  });

  it('keeps step images and timers when the text is unchanged', () => {
    const previous: StepGroup[] = [{ steps: [{ text: 'Simmer.', timerMinutes: 20, image: 'img-a.webp' }] }];
    expect(parseStepsText('Simmer.\n\nServe.', previous)[0].steps[0]).toEqual(previous[0].steps[0]);
  });

  it('round-trips an unnamed step group after a named one', () => {
    const model: StepGroup[] = [{ name: 'Broth', steps: [{ text: 'Simmer.' }] }, { steps: [{ text: 'Serve.' }] }];
    expect(parseStepsText(stepsToText(model))).toEqual(model);
  });

  it('round-trips model → text → model', () => {
    const model: StepGroup[] = [
      { steps: [{ text: 'Boil water.' }, { text: 'Cook noodles.\nDrain.', timerMinutes: 3 }] },
      { name: 'Toppings', steps: [{ text: 'Soft-boil the eggs.', image: 'img-x.webp' }] },
    ];
    expect(parseStepsText(stepsToText(model), model)).toEqual(model);
  });
});
