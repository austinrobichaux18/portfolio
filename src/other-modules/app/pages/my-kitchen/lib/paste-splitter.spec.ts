import { parseDuration, parseNutrition, splitPastedRecipe } from './paste-splitter';

describe('splitPastedRecipe', () => {
  it('splits on headings and drops the intro', () => {
    const pasted = `Easy Weeknight Ramen
This recipe reminds me of a trip I took in 2009, when...
Ingredients
2 cups ramen noodles
For the broth:
4 cups chicken stock
Instructions
1. Boil the stock.
2) Add noodles and cook 3 minutes.
Step 3: Serve.
Notes
Leftover broth freezes well.`;

    expect(splitPastedRecipe(pasted)).toEqual({
      title: 'Easy Weeknight Ramen',
      ingredientsText: '2 cups ramen noodles\n## For the broth\n4 cups chicken stock',
      stepsText: 'Boil the stock.\n\nAdd noodles and cook 3 minutes.\n\nServe.',
      notesText: 'Leftover broth freezes well.',
    });
  });

  it('accepts heading variants with colons and capitals', () => {
    const result = splitPastedRecipe('Tacos\nINGREDIENTS:\n1 lb beef\nDIRECTIONS:\nBrown the beef.');
    expect(result.ingredientsText).toBe('1 lb beef');
    expect(result.stepsText).toBe('Brown the beef.');
  });

  it('guesses when there are no headings', () => {
    const result = splitPastedRecipe('Pancakes\n1 cup flour\n1 egg\nWhisk everything together.\nCook on a hot griddle.');
    expect(result.title).toBe('Pancakes');
    expect(result.ingredientsText).toBe('1 cup flour\n1 egg');
    expect(result.stepsText).toBe('Whisk everything together.\n\nCook on a hot griddle.');
  });

  it('does not strip a leading number that is part of the step', () => {
    expect(splitPastedRecipe('Steps\n10-15 minutes before serving, warm the plates.').stepsText).toBe(
      '10-15 minutes before serving, warm the plates.',
    );
  });

  it('turns colon-less ingredient group headings into groups', () => {
    const result = splitPastedRecipe(`Ingredients
Sauce
2 tbsp soy sauce
Meat & Veggies
▢1 lb chicken
▢Green Onions
For Serving
lime wedges
Toppings
sesame seeds
Steps
Cook.`);
    expect(result.ingredientsText).toBe(
      '## Sauce\n2 tbsp soy sauce\n## Meat & Veggies\n1 lb chicken\nGreen Onions\n## For Serving\nlime wedges\n## Toppings\nsesame seeds',
    );
  });

  it('drops site furniture: unit toggles, scale buttons, cook mode, ratings, print links', () => {
    const result = splitPastedRecipe(`My Soup
5 Stars 4 Stars 3 Stars 2 Stars 1 Star
4.8 from 120 reviews
Print Recipe
Pin Recipe
Ingredients
US Customary - Metric
1/2x
1x
2x
1 cup rice
Cook Mode
Prevent your screen from going dark
Instructions
Cook the rice.`);
    expect(result.title).toBe('My Soup');
    expect(result.ingredientsText).toBe('1 cup rice');
    expect(result.stepsText).toBe('Cook the rice.');
  });

  it('reads servings and times, including values on the next line', () => {
    const result = splitPastedRecipe(`Soup
Prep Time:
15 mins
Cook Time: 1 hr 10 mins
Total Time:
1 hour 25 minutes
Yield: 4 Servings
Ingredients
1 cup rice
Steps
Cook.`);
    expect(result).toMatchObject({ servings: 4, prepMinutes: 15, cookMinutes: 70, totalMinutes: 85 });
    expect(result.ingredientsText).toBe('1 cup rice');
  });

  it('reads "Servings:" on its own line and "yields N servings"', () => {
    expect(splitPastedRecipe('Ingredients\nServings:\n3\n1 cup rice\nSteps\nCook.').servings).toBe(3);
    expect(splitPastedRecipe('Ingredients\nOriginal recipe (1X) yields 6 servings\n1 cup rice\nSteps\nCook.').servings).toBe(6);
  });

  it('removes photo captions and credits from steps, keeps tips as notes, and groups step sections', () => {
    const result = splitPastedRecipe(`Ingredients
1 cup rice
Instructions
Before You Start
Gather everything.
Two images side by side: rice in a pot on the left, a bowl on the right.
To Cook the Rice
Rinse the rice.
rice simmering in a small pot
Pat Cook / Food Styling: Sam Plate
A close-up of a spoon stirring the pot.
Cook's Tip: Rinse until the water runs clear.
Simmer 18 minutes.`);
    expect(result.stepsText).toBe(
      '## Before You Start\n\nGather everything.\n\n## To Cook the Rice\n\nRinse the rice.\n\nSimmer 18 minutes.',
    );
    expect(result.notesText).toBe("Cook's Tip: Rinse until the water runs clear.");
  });

  it('takes nutrition out of the steps and reads it', () => {
    const result = splitPastedRecipe(`Ingredients
1 cup rice
Directions
Cook.
Recipe Tip
Use jasmine rice.
Nutrition Facts (per serving)
291
Calories
10g
Fat
Calories 291
Total Fat 10g 13%
Saturated Fat 4g 20%
Total Carbohydrate 42g 15%
Protein 7g 14%`);
    expect(result.stepsText).toBe('Cook.');
    expect(result.notesText).toBe('Use jasmine rice.');
    expect(result.nutrition).toEqual({ calories: 291, fatG: 10, saturatedFatG: 4, carbsG: 42, proteinG: 7 });
  });

  it('strips footnote marks so "Cook the chicken: ¹" is still a step heading', () => {
    expect(splitPastedRecipe('Ingredients\n1 cup rice\nInstructions\nCook the chicken: ¹\nSear it.').stepsText).toBe(
      '## Cook the chicken\n\nSear it.',
    );
  });
});

describe('parseNutrition', () => {
  it('reads a comma-separated summary without confusing fat types', () => {
    expect(
      parseNutrition('Calories: 511kcal, Carbohydrates: 39g, Protein: 27g, Fat: 27g, Saturated Fat: 11g, Polyunsaturated Fat: 3g, Sodium: 1465mg, Fiber: 2g, Sugar: 6g'),
    ).toEqual({ calories: 511, carbsG: 39, proteinG: 27, fatG: 27, saturatedFatG: 11, sodiumMg: 1465, fiberG: 2, sugarG: 6 });
  });

  it('returns undefined when there is nothing to read', () => {
    expect(parseNutrition('Information is not currently available.')).toBeUndefined();
  });
});

describe('parseDuration', () => {
  it.each<[string, number | undefined]>([
    ['15 mins', 15],
    ['1 hour', 60],
    ['1 hr 30 mins', 90],
    ['2 hours 5 minutes', 125],
    ['soon', undefined],
  ])('%s → %s', (text, minutes) => {
    expect(parseDuration(text)).toBe(minutes);
  });
});
