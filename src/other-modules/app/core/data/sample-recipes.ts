import { SampleRecipe } from '../models/SampleRecipe';

/** Self-written sample recipes for My Kitchen's read-only demo. */
export const SAMPLE_RECIPES: SampleRecipe[] = [
  {
    id: 'weeknight-ramen',
    title: 'Weeknight Ramen',
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 20,
    tags: ['cuisine:japanese', 'meal:dinner', 'effort:weeknight'],
    ingredientsText: `2 packs fresh ramen noodles
## Broth
4 cups chicken stock
2 tbsp soy sauce
1 tbsp miso paste
1 tsp sesame oil
2 cloves garlic, grated
1 tsp fresh ginger, grated`,
    stepsText: `Bring the stock to a simmer with the garlic and ginger for 10 minutes.

Whisk the miso with a ladle of hot stock until smooth, then stir it back in with the soy sauce and sesame oil. Keep warm but don't boil.

Cook the noodles 2–3 minutes, drain, and divide between bowls.

Ladle the broth over the noodles and add your toppings.`,
    options: [
      {
        id: 'toppings',
        name: 'Toppings',
        kind: 'pickAny',
        options: [
          {
            id: 'soft-egg',
            name: 'Soft-boiled egg',
            ingredientsText: '1 large egg',
            stepsText: 'Boil the egg 6½ minutes, then move it to ice water and peel.',
            isDefault: true,
          },
          {
            id: 'broccoli',
            name: 'Broccoli',
            ingredientsText: '1 cup broccoli florets',
            stepsText: 'Drop the broccoli into the noodle water for the last minute.',
          },
          { id: 'scallions', name: 'Scallions', ingredientsText: '2 scallions, sliced', isDefault: true },
          { id: 'chili-oil', name: 'Chili oil', ingredientsText: '1 tsp chili oil' },
        ],
      },
      {
        id: 'protein',
        name: 'Protein',
        kind: 'pickOne',
        options: [
          {
            id: 'chicken',
            name: 'Chicken',
            ingredientsText: '1 cup shredded cooked chicken',
            stepsText: 'Warm the chicken in the broth for 2 minutes before serving.',
            isDefault: true,
          },
          {
            id: 'tofu',
            name: 'Tofu',
            ingredientsText: '1 block firm tofu, cubed',
            stepsText: 'Pan-fry the tofu in a little oil until golden on two sides.',
          },
        ],
      },
    ],
    rating: 9,
    frequency: 'staple',
    trust: 'ours',
    notes: 'Kids always want the extra egg.',
    cookedDaysAgo: [30, 19, 9],
    sourceNutrition: { calories: 540, proteinG: 31, carbsG: 68, fatG: 14, sodiumMg: 1850 },
  },
  {
    id: 'smash-tacos',
    title: 'Smash Tacos',
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 15,
    tags: ['cuisine:mexican', 'meal:dinner', 'effort:weeknight'],
    ingredientsText: `1 lb ground beef
8 small flour tortillas
1 tsp ground cumin
1 tsp chili powder
salt and pepper
1 cup shredded cheddar
1 cup shredded lettuce`,
    stepsText: `Mix the cumin, chili powder, salt and pepper into the beef and roll into 8 balls.

Heat a cast iron pan over medium-high. Press a beef ball flat onto each tortilla.

Cook beef-side down 2–3 minutes until crisp, flip, add cheddar and cook 1 minute more.

Fold and top with lettuce and your extras.`,
    options: [
      {
        id: 'extras',
        name: 'Extras',
        kind: 'pickAny',
        options: [
          { id: 'salsa', name: 'Salsa', ingredientsText: '1/2 cup salsa', isDefault: true },
          { id: 'avocado', name: 'Avocado', ingredientsText: '1 avocado, sliced' },
          { id: 'pickled-onion', name: 'Pickled onion', ingredientsText: '1/4 cup pickled red onion' },
        ],
      },
    ],
    rating: 8,
    frequency: 'regular',
    trust: 'tested',
    cookedDaysAgo: [24],
  },
  {
    id: 'sheet-pan-lemon-chicken',
    title: 'Sheet-Pan Lemon Chicken',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 35,
    tags: ['meal:dinner', 'equip:sheet-pan'],
    ingredientsText: `2 lb chicken thighs
1 1/2 lb baby potatoes, halved
2 tbsp olive oil
1 lemon, sliced
4 cloves garlic, smashed
1 tsp dried oregano
salt and pepper`,
    stepsText: `Heat the oven to 425°F.

Toss the chicken and potatoes with the olive oil, garlic, oregano, salt and pepper on a sheet pan. Tuck the lemon slices around them.

Roast 35 minutes, until the chicken reaches 165°F and the potatoes are browned.`,
    rating: 7,
    frequency: 'occasional',
    trust: 'tested',
    cookedDaysAgo: [],
  },
  {
    id: 'brown-butter-cookies',
    title: 'Brown Butter Chocolate Chip Cookies',
    yieldText: '24 cookies',
    prepMinutes: 20,
    cookMinutes: 12,
    restMinutes: 30,
    tags: ['meal:dessert', 'effort:project'],
    ingredientsText: `1 cup unsalted butter
1 cup brown sugar
1/2 cup granulated sugar
2 large eggs
2 tsp vanilla extract
2 1/4 cups all-purpose flour
1 tsp baking soda [no-scale]
1 tsp salt
2 cups chocolate chips`,
    stepsText: `Brown the butter in a pan until it smells nutty, then cool 10 minutes.

Whisk the butter with both sugars, then the eggs and vanilla.

Stir in the flour, baking soda and salt, then the chocolate chips. Chill the dough 30 minutes.

Bake at 350°F for 11–12 minutes.`,
    rating: 10,
    frequency: 'rare',
    trust: 'ours',
    cookedDaysAgo: [70],
  },
  {
    id: 'chickpea-curry',
    title: 'Coconut Chickpea Curry',
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 25,
    tags: ['cuisine:indian', 'meal:dinner', 'diet:vegetarian'],
    ingredientsText: `1 tbsp oil
1 onion, diced
3 cloves garlic, minced
2 tbsp curry powder
2 (15 oz) cans chickpeas, drained
1 (14 oz) can coconut milk
1 (14 oz) can diced tomatoes
2 cups spinach
salt to taste`,
    stepsText: `Soften the onion in the oil, about 5 minutes. Add the garlic and curry powder and cook 1 minute.

Add the chickpeas, coconut milk and tomatoes. Simmer 15 minutes.

Stir in the spinach until wilted and season with salt.`,
    frequency: 'want-to-try',
    trust: 'untested',
    cookedDaysAgo: [],
  },
];
