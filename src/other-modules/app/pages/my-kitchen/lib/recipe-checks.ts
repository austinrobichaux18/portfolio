import { COMMON_STEP_INGREDIENTS, INGREDIENT_DESCRIPTOR_WORDS } from '../../../core/data/recipe-check-words';
import { Recipe } from '../../../core/models/Recipe';

export interface RecipeCheck {
  /** `warning` = probably a mistake; `info` = worth a glance. Checks never block saving. */
  level: 'warning' | 'info';
  message: string;
}

const LONG_STEP_CHARS = 400;
const MAX_LISTED = 4;

/** Catches import mistakes and incomplete recipes before they get trusted. */
export function checkRecipe(recipe: Recipe): RecipeCheck[] {
  const checks: RecipeCheck[] = [];
  const baseIngredients = recipe.ingredientGroups.flatMap((g) => g.items);
  const allIngredients = [...baseIngredients, ...recipe.optionGroups.flatMap((g) => g.options.flatMap((o) => o.ingredients))];
  const steps = [...recipe.stepGroups.flatMap((g) => g.steps), ...recipe.optionGroups.flatMap((g) => g.options.flatMap((o) => o.steps))];
  const stepText = steps.map((s) => s.text.toLowerCase()).join('\n');

  if (!baseIngredients.length) checks.push({ level: 'warning', message: 'No ingredients yet.' });
  if (!recipe.stepGroups.some((g) => g.steps.length)) checks.push({ level: 'warning', message: 'No steps yet.' });

  const unread = allIngredients
    .filter((i) => !i.name || (i.quantity === undefined && !i.toTaste && !i.optional))
    .map((i) => i.raw);
  if (unread.length) {
    checks.push({ level: 'info', message: `No amount read for: ${list(unread)}` });
  }

  if (steps.length) {
    const unmentioned = baseIngredients
      .filter((i) => i.name && !i.toTaste && !isMentioned(i.name, stepText))
      .map((i) => i.name!);
    if (unmentioned.length) {
      checks.push({ level: 'info', message: `Not mentioned in any step: ${list(unmentioned)}` });
    }

    const ingredientText = allIngredients.map((i) => i.raw.toLowerCase()).join('\n');
    const missing = COMMON_STEP_INGREDIENTS.filter(
      (word) => wordPattern(word).test(stepText) && !ingredientText.includes(word),
    );
    if (missing.length) {
      checks.push({
        level: 'warning',
        message: `Steps mention ${list(missing)} but the ingredients don't list ${missing.length === 1 ? 'it' : 'them'}.`,
      });
    }
  }

  const parts = [recipe.prepMinutes, recipe.cookMinutes, recipe.restMinutes].filter((m): m is number => !!m);
  const sum = parts.reduce((a, b) => a + b, 0);
  if (recipe.totalMinutes && parts.length && sum > recipe.totalMinutes + 5) {
    checks.push({
      level: 'warning',
      message: `Prep + cook${recipe.restMinutes ? ' + rest' : ''} (${sum} min) is more than the total (${recipe.totalMinutes} min).`,
    });
  }

  steps.forEach((step, i) => {
    if (step.text.length > LONG_STEP_CHARS) {
      checks.push({ level: 'info', message: `Step ${i + 1} is long — it may include tips you can trim.` });
    }
  });

  return checks;
}

/** An ingredient counts as mentioned if any word of its name (ignoring "large", "fresh"…) appears. */
function isMentioned(name: string, stepText: string): boolean {
  const words = name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && !INGREDIENT_DESCRIPTOR_WORDS.has(w));
  if (!words.length) return true;
  // Try the singular too: "eggs" → "egg", "tomatoes" → "tomato".
  return words.some((w) =>
    [w, w.replace(/es$/, ''), w.replace(/s$/, '')].some((form) => form.length >= 3 && stepText.includes(form)),
  );
}

function wordPattern(word: string): RegExp {
  return new RegExp(`\\b${word.replace(/ /g, '\\s+')}(s|es)?\\b`);
}

function list(items: string[]): string {
  const unique = [...new Set(items)];
  const shown = unique.slice(0, MAX_LISTED).join(', ');
  return unique.length > MAX_LISTED ? `${shown} and ${unique.length - MAX_LISTED} more` : shown;
}
