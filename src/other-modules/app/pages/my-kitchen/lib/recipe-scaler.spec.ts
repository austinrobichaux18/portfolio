import { parseIngredientLine } from './ingredient-parser';
import { newRecipe } from './recipe-loader';
import { roundKitchen, scaleFactor, scaleIngredient } from './recipe-scaler';

const scale = (line: string, factor: number) => scaleIngredient(parseIngredientLine(line), factor);

describe('scaleIngredient', () => {
  it('shows the line exactly as written at ×1', () => {
    expect(scale('2 c. flour, sifted', 1)).toBe('2 c. flour, sifted');
  });

  it('scales amounts and keeps name, prep and optional', () => {
    expect(scale('1 cup flour, sifted', 2)).toBe('2 cups flour, sifted');
    expect(scale('1/2 cup sugar', 1.5)).toBe('¾ cup sugar');
    expect(scale('2 tbsp chili oil (optional)', 0.5)).toBe('1 tbsp chili oil (optional)');
  });

  it('rounds to measurable kitchen fractions', () => {
    expect(scale('1 cup milk', 1 / 3)).toBe('⅓ cup milk');
    expect(scale('3 tbsp butter', 1.25)).toBe('3 ¾ tbsp butter');
  });

  it('scales ranges', () => {
    expect(scale('2-3 tbsp soy sauce', 2)).toBe('4–6 tbsp soy sauce');
  });

  it('keeps package sizes and scales the count of packages', () => {
    expect(scale('1 (14 oz) can diced tomatoes, drained', 2)).toBe('2 cans (14 oz) diced tomatoes, drained');
  });

  it('never gives fractional whole items: rounds when close, otherwise a range', () => {
    expect(scale('2 large eggs', 1.5)).toBe('3 large eggs');
    expect(scale('1 large egg', 1.5)).toBe('1–2 large eggs');
    expect(scale('3 cloves garlic', 1.33)).toBe('4 cloves garlic');
    expect(scale('3 cloves garlic', 1.5)).toBe('4–5 cloves garlic');
  });

  it('pluralizes a single unit-less item when it becomes several', () => {
    expect(scale('1 tomato, diced', 2)).toBe('2 tomatoes, diced');
    expect(scale('1 onion', 3)).toBe('3 onions');
    expect(scale('1 cherry', 2)).toBe('2 cherries');
    expect(scale('1 cup flour', 2)).toBe('2 cups flour');
  });

  it('leaves to-taste, no-scale, pinch-type and unparsed lines alone', () => {
    expect(scale('salt to taste', 2)).toBe('salt to taste');
    expect(scale('1 bay leaf [no-scale]', 2)).toBe('1 bay leaf [no-scale]');
    expect(scale('a pinch of salt', 3)).toBe('a pinch of salt');
    expect(scale('Juice of 1 lemon', 2)).toBe('Juice of 1 lemon');
  });

  it('rounds metric amounts to sensible steps', () => {
    expect(scale('250 g flour', 1.5)).toBe('375 g flour');
    expect(scale('200 g flour', 1.37)).toBe('275 g flour');
  });
});

describe('roundKitchen', () => {
  it.each([
    [0.3, 0.3333],
    [0.6, 0.625],
    [2.6, 2.6667],
    [12.3, 12.5],
    [23.4, 23],
  ])('%d → %d', (value, rounded) => {
    expect(roundKitchen(value)).toBeCloseTo(rounded, 3);
  });

  it('never rounds a small positive amount down to zero', () => {
    expect(roundKitchen(0.02)).toBeGreaterThan(0);
  });
});

describe('scaleFactor', () => {
  it('is target / servings, or 1 without servings', () => {
    const recipe = newRecipe('x', 'X');
    expect(scaleFactor(recipe, 6)).toBe(1);
    recipe.servings = 4;
    expect(scaleFactor(recipe, 6)).toBe(1.5);
  });
});
