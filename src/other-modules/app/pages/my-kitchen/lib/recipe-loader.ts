import { FREQUENCIES, TRUST_LEVELS } from '../../../core/data/recipe-statuses';
import { UNITS } from '../../../core/data/kitchen-units';
import { CookLogEntry, PantryDeduction } from '../../../core/models/CookLogEntry';
import { Nutrition } from '../../../core/models/Nutrition';
import {
  ContentOrigin,
  HouseholdRecipeData,
  Recipe,
  RECIPE_SCHEMA_VERSION,
  RecipeFrequency,
  RecipeImage,
  RecipeOption,
  RecipeOptionGroup,
  RecipeSource,
  RecipeStep,
  RecipeTrust,
  StepGroup,
} from '../../../core/models/Recipe';
import { IngredientGroup, RecipeIngredient } from '../../../core/models/RecipeIngredient';
import { UnitCode } from '../../../core/models/UnitCode';
import { newUid } from './recipe-id';

/*
 * Every recipe.json read goes through loadRecipe(). Required fields missing → the file is skipped
 * and reported. Optional values that are invalid are dropped with a warning instead, so one bad
 * rating in a hand-edited file doesn't hide the whole recipe.
 */

export type LoadRecipeResult =
  | { ok: true; recipe: Recipe; warnings: string[]; changed: boolean }
  | { ok: false; error: string };

type Json = Record<string, unknown>;

const ORIGINS: ContentOrigin[] = ['imported', 'own', 'adapted'];
const FREQUENCY_IDS = FREQUENCIES.map((f) => f.id);
const TRUST_IDS = TRUST_LEVELS.map((t) => t.id);
const UNIT_CODES = UNITS.map((u) => u.code);

/** `folderName` is authoritative for the id: the folder is what the recipe is stored under. */
export function loadRecipe(data: unknown, folderName: string): LoadRecipeResult {
  if (!isObject(data)) return { ok: false, error: 'recipe.json is not a JSON object.' };

  const schemaVersion = data['schemaVersion'] ?? 1;
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return { ok: false, error: 'schemaVersion is not a positive integer.' };
  }
  if (schemaVersion > RECIPE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Made by a newer version of My Kitchen (schema ${schemaVersion}). Update the site and reload.`,
    };
  }

  const title = str(data['title']);
  if (!title) return { ok: false, error: 'Missing title.' };

  const warnings: string[] = [];
  let changed = false;

  let uid = str(data['uid']);
  if (!uid) {
    uid = newUid();
    changed = true;
  }
  if (data['id'] !== undefined && data['id'] !== folderName) {
    warnings.push(`id "${String(data['id'])}" didn't match its folder; using "${folderName}".`);
    changed = true;
  }

  const now = new Date().toISOString();
  const recipe: Recipe = {
    schemaVersion: RECIPE_SCHEMA_VERSION,
    id: folderName,
    uid,
    origin: oneOf(data['origin'], ORIGINS) ?? 'own',
    title,
    ingredientGroups: arr(data['ingredientGroups']).flatMap((g, i) =>
      toIngredientGroup(g, `ingredient group ${i + 1}`, warnings),
    ),
    stepGroups: arr(data['stepGroups']).flatMap((g, i) => toStepGroup(g, `step group ${i + 1}`, warnings)),
    optionGroups: toOptionGroups(data['optionGroups'], warnings),
    tags: uniqueStrings(arr(data['tags']).map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))),
    images: arr(data['images']).flatMap((img, i) => toImage(img, i, warnings)),
    household: toHousehold(data['household'], warnings),
    createdAt: str(data['createdAt']) ?? now,
    updatedAt: str(data['updatedAt']) ?? now,
  };

  const parentId = str(data['parentId']);
  if (parentId) recipe.parentId = parentId;
  const description = str(data['description']);
  if (description) recipe.description = description;
  const source = toSource(data['source']);
  if (source) recipe.source = source;
  const yieldText = str(data['yieldText']);
  if (yieldText) recipe.yieldText = yieldText;
  for (const key of ['servings', 'servingsMax', 'prepMinutes', 'cookMinutes', 'restMinutes', 'totalMinutes'] as const) {
    const value = data[key];
    if (value === undefined) continue;
    if (isPositiveNumber(value)) recipe[key] = value;
    else warnings.push(`Ignored invalid ${key}.`);
  }
  const nutrition = toNutrition(data['sourceNutrition']);
  if (nutrition) recipe.sourceNutrition = nutrition;

  const covers = recipe.images.filter((img) => img.isCover);
  if (covers.length > 1) covers.slice(1).forEach((img) => delete img.isCover);

  return { ok: true, recipe, warnings, changed };
}

/** A brand-new recipe with all defaults filled in. */
export function newRecipe(
  id: string,
  title: string,
  household: Partial<HouseholdRecipeData> = {},
  origin: ContentOrigin = 'own',
): Recipe {
  const now = new Date().toISOString();
  return {
    schemaVersion: RECIPE_SCHEMA_VERSION,
    id,
    uid: newUid(),
    origin,
    title,
    ingredientGroups: [],
    stepGroups: [],
    optionGroups: [],
    tags: [],
    images: [],
    household: { frequency: 'regular', trust: 'tested', cookLog: [], ...household },
    createdAt: now,
    updatedAt: now,
  };
}

export function serializeRecipe(recipe: Recipe): string {
  return JSON.stringify(recipe, null, 2) + '\n';
}

function toHousehold(value: unknown, warnings: string[]): HouseholdRecipeData {
  const data = isObject(value) ? value : {};
  const household: HouseholdRecipeData = {
    frequency: oneOf<RecipeFrequency>(data['frequency'], FREQUENCY_IDS) ?? 'want-to-try',
    trust: oneOf<RecipeTrust>(data['trust'], TRUST_IDS) ?? 'untested',
    cookLog: arr(data['cookLog']).flatMap((entry, i) => toCookLogEntry(entry, i, warnings)),
  };
  if (data['frequency'] !== undefined && household.frequency !== data['frequency']) {
    warnings.push('Ignored unknown frequency.');
  }
  if (data['trust'] !== undefined && household.trust !== data['trust']) {
    warnings.push('Ignored unknown trust status.');
  }
  if (data['rating'] !== undefined) {
    if (isRating(data['rating'])) household.rating = data['rating'];
    else warnings.push('Ignored rating (must be a whole number from 1 to 10).');
  }
  const favorites = uniqueStrings(arr(data['favoriteOptionIds']).filter(isString));
  if (favorites.length) household.favoriteOptionIds = favorites;
  const notes = str(data['notes']);
  if (notes) household.notes = notes;
  return household;
}

function toCookLogEntry(value: unknown, index: number, warnings: string[]): CookLogEntry[] {
  if (!isObject(value) || !isLocalDate(value['date'])) {
    warnings.push(`Skipped cook log entry ${index + 1} (needs a YYYY-MM-DD date).`);
    return [];
  }
  const entry: CookLogEntry = {
    id: str(value['id']) ?? `log-${index + 1}`,
    date: value['date'],
    // May reference options that were since deleted; that's allowed and shown as "(removed option)".
    optionIds: uniqueStrings(arr(value['optionIds']).filter(isString)),
  };
  if (isPositiveNumber(value['servingsMade'])) entry.servingsMade = value['servingsMade'];
  if (value['rating'] !== undefined) {
    if (isRating(value['rating'])) entry.rating = value['rating'];
    else warnings.push(`Ignored invalid rating on cook log entry ${index + 1}.`);
  }
  const note = str(value['note']);
  if (note) entry.note = note;
  const images = arr(value['images']).filter(isString);
  if (images.length) entry.images = images;
  const deductions = arr(value['pantryDeductions']).flatMap(toDeduction);
  if (deductions.length) entry.pantryDeductions = deductions;
  return [entry];
}

function toDeduction(value: unknown): PantryDeduction[] {
  if (!isObject(value) || !str(value['pantryItemId']) || typeof value['amount'] !== 'number') return [];
  const deduction: PantryDeduction = { pantryItemId: value['pantryItemId'] as string, amount: value['amount'] };
  const unit = oneOf<UnitCode>(value['unit'], UNIT_CODES);
  if (unit) deduction.unit = unit;
  return [deduction];
}

function toIngredientGroup(value: unknown, label: string, warnings: string[]): IngredientGroup[] {
  if (!isObject(value)) {
    warnings.push(`Skipped ${label} (not an object).`);
    return [];
  }
  const group: IngredientGroup = { items: toIngredients(value['items'], label, warnings) };
  const name = str(value['name']);
  if (name) group.name = name;
  return [group];
}

function toIngredients(value: unknown, label: string, warnings: string[]): RecipeIngredient[] {
  return arr(value).flatMap((item, i) => {
    const ingredient = toIngredient(item);
    if (!ingredient) warnings.push(`Skipped ingredient ${i + 1} in ${label} (needs "raw" text).`);
    return ingredient ? [ingredient] : [];
  });
}

function toIngredient(value: unknown): RecipeIngredient | null {
  if (!isObject(value)) return null;
  const raw = str(value['raw']);
  if (!raw) return null;
  const item: RecipeIngredient = { raw };
  if (isPositiveNumber(value['quantity'])) item.quantity = value['quantity'];
  if (isPositiveNumber(value['quantityMax'])) item.quantityMax = value['quantityMax'];
  const unit = oneOf<UnitCode>(value['unit'], UNIT_CODES);
  if (unit) item.unit = unit;
  if (isPositiveNumber(value['packageQuantity'])) item.packageQuantity = value['packageQuantity'];
  const packageUnit = oneOf<UnitCode>(value['packageUnit'], UNIT_CODES);
  if (packageUnit) item.packageUnit = packageUnit;
  for (const key of ['name', 'prep', 'ingredientId', 'recipeRef'] as const) {
    const text = str(value[key]);
    if (text) item[key] = text;
  }
  if (value['optional'] === true) item.optional = true;
  if (value['toTaste'] === true) item.toTaste = true;
  if (value['scales'] === false) item.scales = false;
  return item;
}

function toStepGroup(value: unknown, label: string, warnings: string[]): StepGroup[] {
  if (!isObject(value)) {
    warnings.push(`Skipped ${label} (not an object).`);
    return [];
  }
  const group: StepGroup = { steps: toSteps(value['steps'], label, warnings) };
  const name = str(value['name']);
  if (name) group.name = name;
  return [group];
}

function toSteps(value: unknown, label: string, warnings: string[]): RecipeStep[] {
  return arr(value).flatMap((step, i) => {
    // Older or hand-written files may use plain strings for steps.
    if (typeof step === 'string' && step.trim()) return [{ text: step.trim() }];
    if (!isObject(step) || !str(step['text'])) {
      warnings.push(`Skipped step ${i + 1} in ${label} (needs text).`);
      return [];
    }
    const result: RecipeStep = { text: str(step['text'])! };
    const image = str(step['image']);
    if (image) result.image = image;
    if (isPositiveNumber(step['timerMinutes'])) result.timerMinutes = step['timerMinutes'];
    return [result];
  });
}

function toOptionGroups(value: unknown, warnings: string[]): RecipeOptionGroup[] {
  const usedGroupIds = new Set<string>();
  return arr(value).flatMap((g, gi) => {
    const id = isObject(g) ? str(g['id']) : undefined;
    const name = isObject(g) ? str(g['name']) : undefined;
    if (!isObject(g) || !id || !name || usedGroupIds.has(id)) {
      warnings.push(`Skipped option group ${gi + 1} (needs a unique id and a name).`);
      return [];
    }
    usedGroupIds.add(id);
    const usedOptionIds = new Set<string>();
    const options = arr(g['options']).flatMap((o, oi): RecipeOption[] => {
      const optionId = isObject(o) ? str(o['id']) : undefined;
      const optionName = isObject(o) ? str(o['name']) : undefined;
      if (!isObject(o) || !optionId || !optionName || usedOptionIds.has(optionId)) {
        warnings.push(`Skipped option ${oi + 1} in "${name}" (needs a unique id and a name).`);
        return [];
      }
      usedOptionIds.add(optionId);
      const option: RecipeOption = {
        id: optionId,
        name: optionName,
        ingredients: toIngredients(o['ingredients'], `option "${optionName}"`, warnings),
        steps: toSteps(o['steps'], `option "${optionName}"`, warnings),
      };
      const note = str(o['note']);
      if (note) option.note = note;
      return [option];
    });
    const kind = g['kind'] === 'pickOne' ? 'pickOne' : 'pickAny';
    let defaults = uniqueStrings(arr(g['defaultOptionIds']).filter(isString)).filter((d) =>
      usedOptionIds.has(d),
    );
    if (kind === 'pickOne') defaults = defaults.slice(0, 1);
    return [{ id, name, kind, defaultOptionIds: defaults, options }];
  });
}

function toImage(value: unknown, index: number, warnings: string[]): RecipeImage[] {
  const file = isObject(value) ? str(value['file']) : undefined;
  if (!isObject(value) || !file || file.includes('/') || file.includes('\\')) {
    warnings.push(`Skipped image ${index + 1} (needs a plain file name).`);
    return [];
  }
  const thumb = str(value['thumb']);
  const image: RecipeImage = {
    file,
    thumb: thumb && !thumb.includes('/') && !thumb.includes('\\') ? thumb : file,
    origin: oneOf(value['origin'], ORIGINS) ?? 'own',
  };
  const caption = str(value['caption']);
  if (caption) image.caption = caption;
  if (value['isCover'] === true) image.isCover = true;
  return [image];
}

function toSource(value: unknown): RecipeSource | undefined {
  if (!isObject(value)) return undefined;
  const source: RecipeSource = {};
  const url = str(value['url']);
  if (url && /^https?:\/\//i.test(url)) source.url = url;
  const siteName = str(value['siteName']);
  if (siteName) source.siteName = siteName;
  const author = str(value['author']);
  if (author) source.author = author;
  return Object.keys(source).length ? source : undefined;
}

function toNutrition(value: unknown): Nutrition | undefined {
  if (!isObject(value)) return undefined;
  const nutrition: Nutrition = {};
  const servingSize = str(value['servingSize']);
  if (servingSize) nutrition.servingSize = servingSize;
  for (const key of [
    'calories',
    'proteinG',
    'carbsG',
    'fatG',
    'saturatedFatG',
    'sugarG',
    'fiberG',
    'sodiumMg',
    'cholesterolMg',
  ] as const) {
    const v = value[key];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) nutrition[key] = v;
  }
  return Object.keys(nutrition).length ? nutrition : undefined;
}

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10;
}

function isLocalDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.length > 0))];
}
