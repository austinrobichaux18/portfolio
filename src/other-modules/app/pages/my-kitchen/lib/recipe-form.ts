import { Recipe, RecipeFrequency, RecipeOptionGroup, RecipeTrust } from '../../../core/models/Recipe';
import { uniqueId } from './recipe-id';
import {
  ingredientsToText,
  optionIngredientsToText,
  optionStepsToText,
  parseIngredientsText,
  parseOptionIngredientsText,
  parseOptionStepsText,
  parseStepsText,
  stepsToText,
} from './recipe-text';

/** Everything the editor edits, as plain strings/booleans (images are handled separately). */
export interface RecipeForm {
  title: string;
  ingredientsText: string;
  stepsText: string;
  optionGroups: OptionGroupForm[];
  servings: string;
  servingsMax: string;
  yieldText: string;
  prepMinutes: string;
  cookMinutes: string;
  restMinutes: string;
  totalMinutes: string;
  tags: string[];
  sourceUrl: string;
  sourceSiteName: string;
  sourceAuthor: string;
  description: string;
  notes: string;
  frequency: RecipeFrequency;
  trust: RecipeTrust;
}

export interface OptionGroupForm {
  /** Existing id; new groups get one from the name on save. */
  id?: string;
  name: string;
  kind: 'pickOne' | 'pickAny';
  options: OptionForm[];
}

export interface OptionForm {
  id?: string;
  name: string;
  ingredientsText: string;
  stepsText: string;
  note: string;
  isDefault: boolean;
}

export function formFromRecipe(recipe: Recipe): RecipeForm {
  return {
    title: recipe.title,
    ingredientsText: ingredientsToText(recipe.ingredientGroups),
    stepsText: stepsToText(recipe.stepGroups),
    optionGroups: recipe.optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      kind: group.kind,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        ingredientsText: optionIngredientsToText(option.ingredients),
        stepsText: optionStepsToText(option.steps),
        note: option.note ?? '',
        isDefault: group.defaultOptionIds.includes(option.id),
      })),
    })),
    servings: numberText(recipe.servings),
    servingsMax: numberText(recipe.servingsMax),
    yieldText: recipe.yieldText ?? '',
    prepMinutes: numberText(recipe.prepMinutes),
    cookMinutes: numberText(recipe.cookMinutes),
    restMinutes: numberText(recipe.restMinutes),
    totalMinutes: numberText(recipe.totalMinutes),
    tags: [...recipe.tags],
    sourceUrl: recipe.source?.url ?? '',
    sourceSiteName: recipe.source?.siteName ?? '',
    sourceAuthor: recipe.source?.author ?? '',
    description: recipe.description ?? '',
    notes: recipe.household.notes ?? '',
    frequency: recipe.household.frequency,
    trust: recipe.household.trust,
  };
}

/**
 * Applies the form on top of `base`. Ingredient lines, steps and options are matched back to
 * `base` so per-line settings survive; everything the form doesn't cover (images, cook log,
 * rating, ids, timestamps) is kept from `base`.
 */
export function applyForm(form: RecipeForm, base: Recipe): Recipe {
  const recipe: Recipe = structuredClone(base);
  recipe.title = form.title.trim();
  recipe.ingredientGroups = parseIngredientsText(form.ingredientsText, base.ingredientGroups);
  recipe.stepGroups = parseStepsText(form.stepsText, base.stepGroups);
  recipe.optionGroups = applyOptionGroups(form.optionGroups, base.optionGroups);
  recipe.tags = normalizeTags(form.tags);

  setNumber(recipe, 'servings', form.servings);
  setNumber(recipe, 'servingsMax', form.servingsMax);
  setNumber(recipe, 'prepMinutes', form.prepMinutes);
  setNumber(recipe, 'cookMinutes', form.cookMinutes);
  setNumber(recipe, 'restMinutes', form.restMinutes);
  setNumber(recipe, 'totalMinutes', form.totalMinutes);
  setText(recipe, 'yieldText', form.yieldText);
  setText(recipe, 'description', form.description);

  const url = form.sourceUrl.trim();
  const source = {
    ...(url && /^https?:\/\//i.test(url) ? { url } : {}),
    ...(form.sourceSiteName.trim() ? { siteName: form.sourceSiteName.trim() } : {}),
    ...(form.sourceAuthor.trim() ? { author: form.sourceAuthor.trim() } : {}),
  };
  if (Object.keys(source).length) recipe.source = source;
  else delete recipe.source;

  recipe.household.frequency = form.frequency;
  recipe.household.trust = form.trust;
  if (form.notes.trim()) recipe.household.notes = form.notes.trim();
  else delete recipe.household.notes;

  return recipe;
}

export function normalizeTags(tags: string[]): string[] {
  return [
    ...new Set(
      tags
        .map((t) =>
          t
            .trim()
            .toLowerCase()
            .replace(/\s*:\s*/g, ':')
            .replace(/\s+/g, '-'),
        )
        .filter((t) => t.length > 0),
    ),
  ];
}

function applyOptionGroups(forms: OptionGroupForm[], previous: RecipeOptionGroup[]): RecipeOptionGroup[] {
  const groupIds: string[] = [];
  return forms
    .filter((g) => g.name.trim())
    .map((groupForm) => {
      const prevGroup = previous.find((g) => g.id === groupForm.id);
      const groupId =
        groupForm.id && !groupIds.includes(groupForm.id) ? groupForm.id : uniqueId(groupForm.name, groupIds, 'options');
      groupIds.push(groupId);

      const optionIds: string[] = [];
      const options = groupForm.options
        .filter((o) => o.name.trim())
        .map((optionForm) => {
          const prevOption = prevGroup?.options.find((o) => o.id === optionForm.id);
          const id =
            optionForm.id && !optionIds.includes(optionForm.id)
              ? optionForm.id
              : uniqueId(optionForm.name, optionIds, 'option');
          optionIds.push(id);
          const option = {
            id,
            name: optionForm.name.trim(),
            ingredients: parseOptionIngredientsText(optionForm.ingredientsText, prevOption?.ingredients),
            steps: parseOptionStepsText(optionForm.stepsText, prevOption?.steps),
            ...(optionForm.note.trim() ? { note: optionForm.note.trim() } : {}),
          };
          return { option, isDefault: optionForm.isDefault };
        });

      let defaultOptionIds = options.filter((o) => o.isDefault).map((o) => o.option.id);
      if (groupForm.kind === 'pickOne') defaultOptionIds = defaultOptionIds.slice(0, 1);

      return {
        id: groupId,
        name: groupForm.name.trim(),
        kind: groupForm.kind,
        defaultOptionIds,
        options: options.map((o) => o.option),
      };
    });
}

function numberText(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

type NumberKey = 'servings' | 'servingsMax' | 'prepMinutes' | 'cookMinutes' | 'restMinutes' | 'totalMinutes';

function setNumber(recipe: Recipe, key: NumberKey, text: string): void {
  const value = Number(text.trim());
  if (text.trim() && Number.isFinite(value) && value > 0) recipe[key] = value;
  else delete recipe[key];
}

function setText(recipe: Recipe, key: 'yieldText' | 'description', text: string): void {
  if (text.trim()) recipe[key] = text.trim();
  else delete recipe[key];
}
