import { Recipe } from '../../../core/models/Recipe';
import { parseIngredientLine } from './ingredient-parser';
import { checkRecipe } from './recipe-checks';
import { newRecipe } from './recipe-loader';

function recipe(ingredients: string[], steps: string[], extra: Partial<Recipe> = {}): Recipe {
  return {
    ...newRecipe('x', 'X'),
    ingredientGroups: [{ items: ingredients.map(parseIngredientLine) }],
    stepGroups: [{ steps: steps.map((text) => ({ text })) }],
    ...extra,
  };
}

const messages = (r: Recipe) => checkRecipe(r).map((c) => c.message);

describe('checkRecipe', () => {
  it('is quiet for a complete, consistent recipe', () => {
    expect(
      checkRecipe(
        recipe(['2 cups rice', '3 cups water', 'salt to taste'], ['Rinse the rice.', 'Simmer in the water with salt.']),
      ),
    ).toEqual([]);
  });

  it('flags missing ingredients and steps', () => {
    expect(messages({ ...newRecipe('x', 'X') })).toEqual(['No ingredients yet.', 'No steps yet.']);
  });

  it('lists lines it could not read an amount for', () => {
    expect(messages(recipe(['Juice of 1 lemon', '1 cup rice'], ['Cook rice with lemon.']))).toContain(
      'No amount read for: Juice of 1 lemon',
    );
  });

  it('lists ingredients that no step mentions, ignoring descriptor words and plurals', () => {
    const r = recipe(
      ['2 large eggs', '1 lb ground beef', '1 tsp smoked paprika'],
      ['Beat the egg.', 'Brown the beef.'],
    );
    expect(messages(r)).toEqual(['Not mentioned in any step: smoked paprika']);
  });

  it('warns when steps mention a common ingredient that is not listed', () => {
    expect(messages(recipe(['1 lb chicken'], ['Melt the butter, then brown the chicken in oil.']))).toContain(
      "Steps mention butter, oil but the ingredients don't list them.",
    );
  });

  it('does not treat "boil" as oil or "creamy" as cream', () => {
    expect(messages(recipe(['1 lb pasta'], ['Boil the pasta until creamy.']))).toEqual([]);
  });

  it('warns when the times do not add up', () => {
    const r = recipe(['1 cup rice'], ['Cook the rice.'], { prepMinutes: 20, cookMinutes: 40, totalMinutes: 30 });
    expect(messages(r)).toContain('Prep + cook (60 min) is more than the total (30 min).');
  });

  it('flags very long steps', () => {
    expect(messages(recipe(['1 cup rice'], ['Cook the rice. ' + 'Tip: '.repeat(100)]))).toContain(
      'Step 1 is long — it may include tips you can trim.',
    );
  });
});
