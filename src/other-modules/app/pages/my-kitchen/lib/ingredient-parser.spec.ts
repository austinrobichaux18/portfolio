import { parseIngredientLine } from './ingredient-parser';

describe('parseIngredientLine', () => {
  it('parses a simple quantity, unit and name', () => {
    expect(parseIngredientLine('2 cups flour')).toEqual({
      raw: '2 cups flour',
      quantity: 2,
      unit: 'cup',
      name: 'flour',
    });
  });

  it('keeps the original line in raw, trimmed', () => {
    expect(parseIngredientLine('  1 tsp salt  ').raw).toBe('1 tsp salt');
  });

  describe('quantities', () => {
    it.each([
      ['1/2 cup sugar', 0.5],
      ['1 1/2 cups milk', 1.5],
      ['1-1/2 cups milk', 1.5],
      ['½ cup sugar', 0.5],
      ['1½ cups milk', 1.5],
      ['1 ½ cups milk', 1.5],
      ['0.25 cup oil', 0.25],
      ['.5 cup oil', 0.5],
      ['1/3 cup honey', 0.3333],
    ])('%s → %d', (line, quantity) => {
      expect(parseIngredientLine(line).quantity).toBe(quantity);
    });

    it.each([
      ['2-3 cloves garlic', 2, 3],
      ['2–3 cloves garlic', 2, 3],
      ['2 to 3 cloves garlic', 2, 3],
      ['8–10 cherry tomatoes', 8, 10],
    ])('parses the range in %s', (line, low, high) => {
      const result = parseIngredientLine(line);
      expect(result.quantity).toBe(low);
      expect(result.quantityMax).toBe(high);
    });

    it('does not mistake "to" at the start of a word for a range', () => {
      expect(parseIngredientLine('1 tomato, diced')).toEqual({
        raw: '1 tomato, diced',
        quantity: 1,
        name: 'tomato',
        prep: 'diced',
      });
    });

    it('treats "a"/"an" before a unit as 1', () => {
      expect(parseIngredientLine('a pinch of salt')).toMatchObject({
        quantity: 1,
        unit: 'pinch',
        name: 'salt',
      });
      expect(parseIngredientLine('Handful of spinach')).toMatchObject({
        quantity: 1,
        unit: 'handful',
        name: 'spinach',
      });
    });

    it('leaves the quantity empty when there is none', () => {
      expect(parseIngredientLine('Juice of 1 lemon')).toEqual({
        raw: 'Juice of 1 lemon',
        name: 'Juice of 1 lemon',
      });
    });
  });

  describe('units', () => {
    it.each([
      ['1 T sugar', 'tbsp'],
      ['1 Tbsp sugar', 'tbsp'],
      ['1 tbsp. sugar', 'tbsp'],
      ['2 tablespoons sugar', 'tbsp'],
      ['1 t salt', 'tsp'],
      ['1 teaspoon salt', 'tsp'],
      ['2 c. flour', 'cup'],
      ['1 lb. ground beef', 'lb'],
      ['16 ounces pasta', 'oz'],
      ['10 oz. spinach', 'oz'],
      ['8 fl oz cream', 'floz'],
      ['2 fluid ounces cream', 'floz'],
      ['200g flour', 'g'],
      ['1.5 kg potatoes', 'kg'],
      ['3 cloves garlic', 'clove'],
      ['1 stick butter', 'stick'],
      ['1 bunch cilantro', 'bunch'],
      ['2 sprigs thyme', 'sprig'],
      ['4 slices bacon', 'slice'],
    ])('%s → %s', (line, unit) => {
      expect(parseIngredientLine(line).unit).toBe(unit);
    });

    it('does not treat a word that merely starts like a unit as a unit', () => {
      const result = parseIngredientLine('2 green onions');
      expect(result.unit).toBeUndefined();
      expect(result.name).toBe('green onions');
    });

    it('strips "of" after the unit', () => {
      expect(parseIngredientLine('1 cup of flour').name).toBe('flour');
    });

    it('leaves size words in the name', () => {
      expect(parseIngredientLine('2 large eggs')).toEqual({
        raw: '2 large eggs',
        quantity: 2,
        name: 'large eggs',
      });
    });
  });

  describe('package sizes', () => {
    it('parses "1 (14 oz) can diced tomatoes, drained"', () => {
      expect(parseIngredientLine('1 (14 oz) can diced tomatoes, drained')).toEqual({
        raw: '1 (14 oz) can diced tomatoes, drained',
        quantity: 1,
        packageQuantity: 14,
        packageUnit: 'oz',
        unit: 'can',
        name: 'diced tomatoes',
        prep: 'drained',
      });
    });

    it('parses a package size after the unit', () => {
      expect(parseIngredientLine('1 package (8 oz) cream cheese, softened')).toMatchObject({
        quantity: 1,
        unit: 'package',
        packageQuantity: 8,
        packageUnit: 'oz',
        name: 'cream cheese',
        prep: 'softened',
      });
    });

    it('handles "14.5-ounce" and trailing periods', () => {
      expect(parseIngredientLine('2 (14.5-ounce) cans black beans')).toMatchObject({
        quantity: 2,
        packageQuantity: 14.5,
        packageUnit: 'oz',
        unit: 'can',
        name: 'black beans',
      });
      expect(parseIngredientLine('1 (15 oz.) can corn')).toMatchObject({
        packageQuantity: 15,
        packageUnit: 'oz',
      });
    });
  });

  describe('flags', () => {
    it('marks "to taste" lines and removes the phrase from the name', () => {
      expect(parseIngredientLine('salt to taste')).toEqual({
        raw: 'salt to taste',
        toTaste: true,
        name: 'salt',
      });
      expect(parseIngredientLine('Freshly ground pepper, to taste')).toMatchObject({
        toTaste: true,
        name: 'Freshly ground pepper',
      });
    });

    it('marks "salt and pepper" as to taste', () => {
      expect(parseIngredientLine('Salt and pepper').toTaste).toBe(true);
      expect(parseIngredientLine('kosher salt & black pepper').toTaste).toBe(true);
    });

    it.each(['2 tbsp chili oil (optional)', '2 tbsp chili oil, optional', 'Optional: 2 tbsp chili oil'])(
      'marks %s as optional',
      (line) => {
        expect(parseIngredientLine(line)).toMatchObject({
          optional: true,
          quantity: 2,
          unit: 'tbsp',
          name: 'chili oil',
        });
      },
    );

    it('reads [no-scale] and keeps it in raw', () => {
      expect(parseIngredientLine('1 bay leaf [no-scale]')).toEqual({
        raw: '1 bay leaf [no-scale]',
        quantity: 1,
        name: 'bay leaf',
        scales: false,
      });
    });
  });

  describe('name and prep', () => {
    it('splits at the first comma outside parentheses', () => {
      expect(parseIngredientLine('3 cloves garlic, minced, divided')).toMatchObject({
        name: 'garlic',
        prep: 'minced, divided',
      });
    });

    it('turns a trailing parenthetical into prep', () => {
      expect(parseIngredientLine('2 cups flour (spooned and leveled)')).toMatchObject({
        name: 'flour',
        prep: 'spooned and leveled',
      });
    });

    it('strips list bullets and checkbox characters copied from recipe sites', () => {
      expect(parseIngredientLine('▢ 1 tsp salt').name).toBe('salt');
      expect(parseIngredientLine('- 1 tsp salt').name).toBe('salt');
    });
  });

  describe('never throws', () => {
    it.each(['', '   ', '()', '1/0 cup', '???', '1', '2 cups', '(14 oz)'])(
      'handles %j without throwing and keeps raw',
      (line) => {
        const result = parseIngredientLine(line);
        expect(result.raw).toBe(line.trim());
      },
    );

    it('leaves the quantity empty for a divide-by-zero fraction', () => {
      expect(parseIngredientLine('1/0 cup sugar').quantity).toBeUndefined();
    });
  });
});
