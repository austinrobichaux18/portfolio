import { AI_RECIPE_PROMPT } from '../../../core/data/ai-recipe-prompt';
import { parseIngredientsText, parseStepsText } from './recipe-text';
import { parseRecipeJson } from './recipe-json';

function ok(text: string) {
  const result = parseRecipeJson(text);
  if (!result || !result.ok) throw new Error(`expected a recipe, got ${JSON.stringify(result)}`);
  return result.recipe;
}

describe('parseRecipeJson', () => {
  it('reads the example in the AI prompt completely (prompt and parser stay in sync)', () => {
    const recipe = ok(AI_RECIPE_PROMPT);

    expect(recipe).toMatchObject({
      title: 'Weeknight Ramen',
      servings: 2,
      prepMinutes: 10,
      cookMinutes: 20,
      totalMinutes: 30,
      yieldText: '2 big bowls',
      tags: ['cuisine:japanese', 'meal:dinner', 'effort:weeknight'],
      nutrition: {
        calories: 540,
        proteinG: 31,
        carbsG: 68,
        fatG: 14,
        saturatedFatG: 4,
        sugarG: 6,
        fiberG: 3,
        sodiumMg: 1850,
        cholesterolMg: 190,
      },
    });
    expect(recipe.restMinutes).toBeUndefined(); // 0 means "none"
    expect(recipe.source).toEqual({
      url: 'https://example.com/weeknight-ramen',
      siteName: 'Example Kitchen',
      author: 'Sam Cook',
    });
    expect(recipe.images).toEqual([
      { file: 'ramen.jpg' },
      { file: 'https://example.com/photos/ramen-toppings.jpg', caption: 'Usual toppings' },
    ]);

    const ingredients = parseIngredientsText(recipe.ingredientsText);
    expect(ingredients.map((g) => [g.name, g.items.map((i) => i.raw)])).toEqual([
      ['Broth', ['4 cups chicken stock', '2 tbsp soy sauce', '1 tbsp miso paste']],
      [undefined, ['2 packs fresh ramen noodles']],
    ]);
    const steps = parseStepsText(recipe.stepsText);
    expect(steps.map((g) => [g.name, g.steps.map((s) => s.text)])).toEqual([
      ['Broth', ['Simmer the stock 10 minutes.', 'Whisk in the miso and soy sauce.']],
      [undefined, ['Cook the noodles 2-3 minutes and drain.', 'Ladle the broth over the noodles.']],
    ]);
    expect(recipe.optionGroups).toEqual([
      {
        name: 'Toppings',
        kind: 'pickAny',
        options: [
          {
            name: 'Soft-boiled egg',
            ingredientsText: '1 large egg',
            stepsText: 'Boil 6½ minutes, then ice bath.',
            note: '',
            isDefault: true,
          },
          { name: 'Chili oil', ingredientsText: '1 tsp chili oil', stepsText: '', note: '', isDefault: false },
        ],
      },
    ]);
  });

  it('ignores ```json fences and chatter around the object', () => {
    const recipe = ok('Sure! Here is your recipe:\n```json\n{"title": "Toast", "ingredients": ["1 slice bread"], "steps": ["Toast it."]}\n```\nEnjoy!');
    expect(recipe).toMatchObject({ title: 'Toast', ingredientsText: '1 slice bread', stepsText: 'Toast it.' });
  });

  it('repairs JSON copied from a rendered ChatGPT reply (brackets escaped / turned into \\( \\))', () => {
    // Verbatim paste that used to fail with "couldn't be read".
    const pasted = String.raw`{ "title": "Potato Salad Sandwiches with Ritz Crackers", "servings": 2, "prepMinutes": 5, "cookMinutes": 0, "restMinutes": 0, "totalMinutes": 5, "yield": "2 sandwiches with crackers", "tags": \("cuisine:american", "meal:lunch", "effort:quick"\), "ingredients": \({ "items": \[ "4 slices bread, 70 calories per slice", "1 cup prepared potato salad", "1 serving Ritz crackers"\) } ], "steps": \({ "items": \[ "Spread potato salad evenly over 2 slices of bread.", "Top with the remaining 2 slices of bread.", "Serve with Ritz crackers."\) } ], "nutritionPerServing": { "calories": 530, "proteinG": 9, "carbsG": 67, "fatG": 25, "saturatedFatG": 6, "sugarG": 7, "fiberG": 3, "sodiumMg": 900, "cholesterolMg": 35 } }`;
    const recipe = ok(pasted);

    expect(recipe).toMatchObject({
      title: 'Potato Salad Sandwiches with Ritz Crackers',
      servings: 2,
      prepMinutes: 5,
      totalMinutes: 5,
      yieldText: '2 sandwiches with crackers',
      tags: ['cuisine:american', 'meal:lunch', 'effort:quick'],
      ingredientsText: '4 slices bread, 70 calories per slice\n1 cup prepared potato salad\n1 serving Ritz crackers',
      stepsText:
        'Spread potato salad evenly over 2 slices of bread.\n\nTop with the remaining 2 slices of bread.\n\nServe with Ritz crackers.',
      nutrition: {
        calories: 530,
        proteinG: 9,
        carbsG: 67,
        fatG: 25,
        saturatedFatG: 6,
        sugarG: 7,
        fiberG: 3,
        sodiumMg: 900,
        cholesterolMg: 35,
      },
    });
    expect(recipe.cookMinutes).toBeUndefined();
    expect(recipe.restMinutes).toBeUndefined();
  });

  it('leaves parentheses inside strings alone when repairing', () => {
    const recipe = ok(String.raw`{ "title": "Chili (mild)", "ingredients": \( "1 (14 oz) can beans" \) }`);
    expect(recipe).toMatchObject({ title: 'Chili (mild)', ingredientsText: '1 (14 oz) can beans' });
  });

  it('accepts lenient shapes: string arrays, numbers as strings, numbered steps', () => {
    const recipe = ok(
      JSON.stringify({
        title: 'Rice',
        servings: '4',
        ingredients: ['2 cups rice', '3 cups water'],
        steps: ['1. Rinse the rice.', 'Step 2: Simmer 18 minutes.'],
        nutrition: { calories: '210 kcal' },
      }),
    );
    expect(recipe).toMatchObject({
      servings: 4,
      ingredientsText: '2 cups rice\n3 cups water',
      stepsText: 'Rinse the rice.\n\nSimmer 18 minutes.',
      nutrition: { calories: 210 },
    });
  });

  it('keeps one usual choice in a pick-one option group', () => {
    const recipe = ok(
      JSON.stringify({
        title: 'Tacos',
        options: [
          {
            name: 'Protein',
            pick: 'one',
            choices: [
              { name: 'Beef', usual: true },
              { name: 'Chicken', usual: true },
            ],
          },
        ],
      }),
    );
    expect(recipe.optionGroups[0].kind).toBe('pickOne');
    expect(recipe.optionGroups[0].options.map((o) => o.isDefault)).toEqual([true, false]);
  });

  it('accepts a bare source link and drops non-web links and image paths', () => {
    expect(ok('{"title": "Pie", "source": "https://pies.example/apple"}').source).toEqual({
      url: 'https://pies.example/apple',
    });
    expect(ok('{"title": "Pie", "source": "javascript:alert(1)"}').source).toBeUndefined();
    expect(
      ok('{"title": "Pie", "images": ["pie.jpg", "../x.jpg", "a/b.jpg", "pie.jpg", "", "ftp://x/y.jpg"]}').images,
    ).toEqual([{ file: 'pie.jpg' }]);
    expect(ok('{"title": "Pie", "images": [{ "url": "https://pies.example/pie.jpg" }]}').images).toEqual([
      { file: 'https://pies.example/pie.jpg' },
    ]);
  });

  it('returns null for ordinary recipe text so the text splitter handles it', () => {
    expect(parseRecipeJson('Ingredients\n1 cup rice\nSteps\nCook {gently}.')).toBeNull();
  });

  it('explains when JSON is broken or empty', () => {
    expect(parseRecipeJson('{"title": "Cut off')).toBeNull(); // no closing brace: treated as text
    expect(parseRecipeJson('{"title": "Bad", }')).toEqual({ ok: false, error: expect.stringContaining("couldn't be read") });
    expect(parseRecipeJson('{"servings": 2}')).toEqual({ ok: false, error: 'The JSON has no title, ingredients or steps.' });
  });
});
