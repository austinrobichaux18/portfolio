import { Nutrition } from '../../../core/models/Nutrition';
import { Recipe, RecipeSource } from '../../../core/models/Recipe';
import { PastedRecipe } from './paste-splitter';
import { applyForm, formFromRecipe, normalizeTags, OptionGroupForm } from './recipe-form';
import { isImageRef, newRecipe } from './recipe-loader';

/** A recipe read from the AI JSON format (see core/data/ai-recipe-prompt.ts). */
export interface ImportedRecipe extends PastedRecipe {
  restMinutes?: number;
  yieldText?: string;
  description?: string;
  tags: string[];
  optionGroups: OptionGroupForm[];
  source?: RecipeSource;
  /** Photo file names (expected next to the .json file they came in) or web links; first is the cover. */
  images: ImportedImage[];
}

export interface ImportedImage {
  file: string;
  caption?: string;
}

export type RecipeJsonResult = { ok: true; recipe: ImportedRecipe } | { ok: false; error: string };

type Json = Record<string, unknown>;

const NUTRITION_KEYS = [
  'calories',
  'proteinG',
  'carbsG',
  'fatG',
  'saturatedFatG',
  'sugarG',
  'fiberG',
  'sodiumMg',
  'cholesterolMg',
] as const;

/**
 * Reads pasted text as the AI JSON format. Returns null when the text isn't JSON at all (so the
 * caller falls back to the plain-text splitter), or an error when it looks like JSON but can't be
 * used. Tolerates ```json fences and chatter around the object, and lenient shapes (plain string
 * arrays instead of groups, numbers as strings).
 */
export function parseRecipeJson(text: string): RecipeJsonResult | null {
  const candidate = extractJsonObject(text);
  if (candidate === null) return null;

  const data = parseLenient(candidate);
  if (data === undefined) {
    return { ok: false, error: "That looks like JSON but couldn't be read — check that the whole reply was copied." };
  }
  if (!isObject(data)) return { ok: false, error: 'Expected a JSON object with a recipe in it.' };

  const ingredientsText = groupsToText(data['ingredients'], '\n', '\n');
  const stepsText = groupsToText(data['steps'], '\n\n', '\n\n', cleanStep);
  if (!str(data['title']) && !ingredientsText && !stepsText) {
    return { ok: false, error: 'The JSON has no title, ingredients or steps.' };
  }

  const recipe: ImportedRecipe = {
    ingredientsText,
    stepsText,
    notesText: str(data['notes']) ?? '',
    tags: arr(data['tags']).flatMap((t) => (typeof t === 'string' && t.trim() ? [t] : [])),
    optionGroups: toOptionGroups(data['options']),
    images: toImages(data['images'] ?? data['photos']),
  };
  const title = str(data['title']);
  if (title) recipe.title = title;
  const description = str(data['description']);
  if (description) recipe.description = description;
  const yieldText = str(data['yield']) ?? str(data['yieldText']);
  if (yieldText) recipe.yieldText = yieldText;
  for (const key of ['servings', 'prepMinutes', 'cookMinutes', 'restMinutes', 'totalMinutes'] as const) {
    const value = num(data[key]);
    if (value !== undefined) recipe[key] = value;
  }
  const nutrition = toNutrition(data['nutritionPerServing'] ?? data['nutrition']);
  if (nutrition) recipe.nutrition = nutrition;
  const source = toSource(data['source'] ?? data['sourceUrl'] ?? data['url']);
  if (source) recipe.source = source;
  return { ok: true, recipe };
}

/**
 * A new recipe built from the AI JSON format, the same way the editor's paste box does. Not made
 * yet, so it starts as untested / want to try.
 */
export function recipeFromImported(id: string, imported: ImportedRecipe, fallbackTitle: string): Recipe {
  const base = newRecipe(id, imported.title ?? fallbackTitle, { frequency: 'want-to-try', trust: 'untested' });
  const form = formFromRecipe(base);
  const recipe = applyForm(
    {
      ...form,
      ingredientsText: imported.ingredientsText,
      stepsText: imported.stepsText,
      optionGroups: imported.optionGroups,
      tags: normalizeTags(imported.tags),
      servings: numberText(imported.servings),
      prepMinutes: numberText(imported.prepMinutes),
      cookMinutes: numberText(imported.cookMinutes),
      restMinutes: numberText(imported.restMinutes),
      totalMinutes: numberText(imported.totalMinutes),
      yieldText: imported.yieldText ?? '',
      description: imported.description ?? '',
      notes: imported.notesText,
      sourceUrl: imported.source?.url ?? '',
      sourceSiteName: imported.source?.siteName ?? '',
      sourceAuthor: imported.source?.author ?? '',
    },
    base,
  );
  if (imported.nutrition) recipe.sourceNutrition = imported.nutrition;
  recipe.images = imported.images.map((img, i) => ({
    file: img.file,
    thumb: img.file,
    origin: 'own',
    ...(img.caption ? { caption: img.caption } : {}),
    ...(i === 0 ? { isCover: true } : {}),
  }));
  return recipe;
}

function numberText(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

/** The JSON object in the text, ignoring ```json fences and any words before or after it. */
function extractJsonObject(text: string): string | null {
  const unfenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  // Only treat it as JSON when the object is most of the paste (not a stray brace in prose).
  const object = unfenced.slice(start, end + 1);
  return /^\s*\{\s*"/.test(object) ? object : null;
}

/** JSON.parse, retrying once with repairMarkdownMangling. Undefined when neither parses. */
function parseLenient(text: string): unknown {
  for (const attempt of [text, repairMarkdownMangling(text)]) {
    try {
      return JSON.parse(attempt);
    } catch {
      // try the next attempt
    }
  }
  return undefined;
}

/**
 * Undoes what copying a chat reply from its rendered Markdown view can do to JSON: brackets
 * escaped as "\[" and arrays rewritten as "\( … \)" (math delimiters). Outside strings, JSON never
 * uses parentheses, so they're safely turned back into brackets; text inside strings is untouched
 * apart from the escaping backslashes (which would be invalid JSON escapes anyway).
 */
function repairMarkdownMangling(text: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\' && /[()[\]{}]/.test(text[i + 1] ?? '')) continue;
    if (inString) {
      out += c;
      if (c === '\\') out += text[++i] ?? '';
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    out += c === '(' ? '[' : c === ')' ? ']' : c;
  }
  return out;
}

/** [{ group, items: [...] }] or ["line", ...] → editor text with "## Group" headings. */
function groupsToText(
  value: unknown,
  itemSeparator: string,
  groupSeparator: string,
  clean: (line: string) => string = (l) => l.trim(),
): string {
  const lines = arr(value);
  if (lines.every((l) => typeof l === 'string')) {
    return lines.map((l) => clean(l as string)).filter(Boolean).join(itemSeparator);
  }
  const blocks: string[] = [];
  for (const group of lines) {
    if (typeof group === 'string') {
      if (clean(group)) blocks.push(clean(group));
      continue;
    }
    if (!isObject(group)) continue;
    const items = arr(group['items']).flatMap((l) => (typeof l === 'string' && clean(l) ? [clean(l)] : []));
    if (!items.length) continue;
    const name = str(group['group']) ?? str(group['name']);
    // A bare "##" starts an unnamed group after a named one (otherwise it would merge into it).
    const heading = name ? `## ${name}` : blocks.length ? '##' : null;
    blocks.push([...(heading ? [heading] : []), ...items].join(itemSeparator));
  }
  return blocks.join(groupSeparator);
}

function toOptionGroups(value: unknown): OptionGroupForm[] {
  return arr(value).flatMap((group) => {
    if (!isObject(group) || !str(group['name'])) return [];
    const kind = /^one$|^pickone$/i.test(String(group['pick'] ?? group['kind'] ?? '')) ? 'pickOne' : 'pickAny';
    const options = arr(group['choices'] ?? group['options']).flatMap((choice) => {
      if (!isObject(choice) || !str(choice['name'])) return [];
      return [
        {
          name: str(choice['name'])!,
          ingredientsText: groupsToText(choice['ingredients'], '\n', '\n'),
          stepsText: groupsToText(choice['steps'], '\n\n', '\n\n', cleanStep),
          note: str(choice['note']) ?? '',
          isDefault: choice['usual'] === true || choice['default'] === true,
        },
      ];
    });
    if (!options.length) return [];
    // Pick-one groups keep a single usual choice.
    if (kind === 'pickOne') {
      let seen = false;
      for (const option of options) {
        if (option.isDefault && seen) option.isDefault = false;
        if (option.isDefault) seen = true;
      }
    }
    return [{ name: str(group['name'])!, kind, options }];
  });
}

/** A link as a plain string, or { url, siteName, author }. Only http(s) links are kept. */
function toSource(value: unknown): RecipeSource | undefined {
  const data = typeof value === 'string' ? { url: value } : isObject(value) ? value : {};
  const source: RecipeSource = {};
  const url = str(data['url']);
  if (url && /^https?:\/\//i.test(url)) source.url = url;
  const siteName = str(data['siteName']) ?? str(data['site']);
  if (siteName) source.siteName = siteName;
  const author = str(data['author']);
  if (author) source.author = author;
  return Object.keys(source).length ? source : undefined;
}

/** ["photo.jpg", "https://…/plated.jpg", { "file": "…", "caption": "…" }] — file names (no paths) or links. */
function toImages(value: unknown): ImportedImage[] {
  const seen = new Set<string>();
  return arr(value).flatMap((item) => {
    const file =
      typeof item === 'string' ? str(item) : isObject(item) ? (str(item['file']) ?? str(item['url'])) : undefined;
    if (!file || !isImageRef(file) || seen.has(file)) return [];
    seen.add(file);
    const caption = isObject(item) ? str(item['caption']) : undefined;
    return [caption ? { file, caption } : { file }];
  });
}

function toNutrition(value: unknown): Nutrition | undefined {
  if (!isObject(value)) return undefined;
  const nutrition: Nutrition = {};
  for (const key of NUTRITION_KEYS) {
    const v = num(value[key]);
    if (v !== undefined) nutrition[key] = v;
  }
  const servingSize = str(value['servingSize']);
  if (servingSize) nutrition.servingSize = servingSize;
  return Object.keys(nutrition).length ? nutrition : undefined;
}

/** Steps lose numbering ("1.", "Step 2:") and internal blank lines (which would split them). */
function cleanStep(line: string): string {
  return line
    .replace(/^\s*(?:step\s*)?\d+\s*[.):]\s*/i, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Positive numbers, also accepting "540" or "540 kcal" from chatty models. */
function num(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
