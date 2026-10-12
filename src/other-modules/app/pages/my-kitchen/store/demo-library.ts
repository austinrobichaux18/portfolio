import { SAMPLE_RECIPES } from '../../../core/data/sample-recipes';
import { Recipe } from '../../../core/models/Recipe';
import { SampleRecipe } from '../../../core/models/SampleRecipe';
import { localDateString } from '../lib/recipe-id';
import { newRecipe } from '../lib/recipe-loader';
import { parseIngredientsText, parseOptionIngredientsText, parseOptionStepsText, parseStepsText } from '../lib/recipe-text';
import { InMemoryKitchenStore } from './in-memory-kitchen-store';

export const DEMO_LABEL = 'Demo recipes';

/** Read-only library of the sample recipes, with cook dates relative to `today`. */
export function createDemoStore(today: Date = new Date()): InMemoryKitchenStore {
  return new InMemoryKitchenStore(
    SAMPLE_RECIPES.map((sample) => buildSampleRecipe(sample, today)),
    DEMO_LABEL,
    true,
  );
}

export function buildSampleRecipe(sample: SampleRecipe, today: Date): Recipe {
  const recipe = newRecipe(sample.id, sample.title, {
    frequency: sample.frequency,
    trust: sample.trust,
    ...(sample.rating ? { rating: sample.rating } : {}),
    ...(sample.notes ? { notes: sample.notes } : {}),
  });
  recipe.uid = `demo-${sample.id}`;
  recipe.ingredientGroups = parseIngredientsText(sample.ingredientsText);
  recipe.stepGroups = parseStepsText(sample.stepsText);
  recipe.tags = [...sample.tags];
  for (const key of ['servings', 'prepMinutes', 'cookMinutes', 'restMinutes'] as const) {
    if (sample[key]) recipe[key] = sample[key];
  }
  if (sample.yieldText) recipe.yieldText = sample.yieldText;
  if (sample.sourceNutrition) recipe.sourceNutrition = { ...sample.sourceNutrition };

  recipe.optionGroups = (sample.options ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    kind: group.kind,
    defaultOptionIds: group.options.filter((o) => o.isDefault).map((o) => o.id),
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      ingredients: parseOptionIngredientsText(option.ingredientsText),
      steps: parseOptionStepsText(option.stepsText ?? ''),
      ...(option.note ? { note: option.note } : {}),
    })),
  }));

  const defaults = recipe.optionGroups.flatMap((g) => g.defaultOptionIds);
  recipe.household.cookLog = [...sample.cookedDaysAgo]
    .sort((a, b) => b - a)
    .map((daysAgo, i) => ({
      id: `demo-log-${i + 1}`,
      date: localDateString(new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo)),
      optionIds: defaults,
      ...(recipe.servings ? { servingsMade: recipe.servings } : {}),
    }));
  return recipe;
}
