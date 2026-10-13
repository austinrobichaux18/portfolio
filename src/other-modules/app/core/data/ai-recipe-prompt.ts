/**
 * Prompt users can give any AI chat (with a description of their meal, or a recipe to clean up)
 * so it answers in the JSON format My Kitchen's paste box understands — including the things that
 * are tedious to do by hand, like per-serving nutrition estimates, tags and options.
 */
export const AI_RECIPE_PROMPT = `Turn the meal I describe below into a recipe in this exact JSON format. Reply with only the JSON.

Rules:
- Ingredients and steps are plain text lines written like a normal recipe, e.g. "1 (14 oz) can diced tomatoes, drained", "2-3 cloves garlic, minced", "salt to taste". Use US units unless I use metric.
- "group" is optional; use it for sections like "Sauce" or "Broth".
- "options" are add-ins or swaps chosen at cook time (toppings, protein choices). "pick" is "one" (swap) or "any" (add-ins). Mark the usual choices with "usual": true. Leave options out if there are none.
- Keep steps short and practical — no stories, tips or serving suggestions.
- "nutritionPerServing" is your best estimate per serving for the base recipe with the usual options. Use numbers only.
- Tags are lowercase with prefixes: cuisine:, meal:, diet:, equip:, effort: (quick, weeknight or project).
- Leave out any field you don't know.

{
  "title": "Weeknight Ramen",
  "servings": 2,
  "prepMinutes": 10,
  "cookMinutes": 20,
  "restMinutes": 0,
  "totalMinutes": 30,
  "yield": "2 big bowls",
  "tags": ["cuisine:japanese", "meal:dinner", "effort:weeknight"],
  "ingredients": [
    { "group": "Broth", "items": ["4 cups chicken stock", "2 tbsp soy sauce", "1 tbsp miso paste"] },
    { "items": ["2 packs fresh ramen noodles"] }
  ],
  "steps": [
    { "group": "Broth", "items": ["Simmer the stock 10 minutes.", "Whisk in the miso and soy sauce."] },
    { "items": ["Cook the noodles 2-3 minutes and drain.", "Ladle the broth over the noodles."] }
  ],
  "options": [
    {
      "name": "Toppings",
      "pick": "any",
      "choices": [
        { "name": "Soft-boiled egg", "usual": true, "ingredients": ["1 large egg"], "steps": ["Boil 6½ minutes, then ice bath."] },
        { "name": "Chili oil", "ingredients": ["1 tsp chili oil"] }
      ]
    }
  ],
  "nutritionPerServing": {
    "calories": 540, "proteinG": 31, "carbsG": 68, "fatG": 14, "saturatedFatG": 4,
    "sugarG": 6, "fiberG": 3, "sodiumMg": 1850, "cholesterolMg": 190
  },
  "notes": "Anything we should remember, like what the kids prefer."
}

My meal:
`;
