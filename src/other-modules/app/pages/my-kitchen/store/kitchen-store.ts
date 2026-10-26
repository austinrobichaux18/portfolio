import { Recipe } from '../../../core/models/Recipe';

export interface RecipeLoadError {
  /** Folder (recipe id) that couldn't be loaded. */
  folder: string;
  message: string;
}

export interface KitchenLibrary {
  recipes: Recipe[];
  errors: RecipeLoadError[];
  /** Folder names in use by something other than a loaded recipe (grouping or broken folders), so new ids avoid them. */
  takenNames?: string[];
}

/**
 * Everything the pages read or write goes through this, so a cloud backend can replace the local
 * folder later without touching the pages. Recipes now; pantry (v2), catalog and plans later.
 */
export interface KitchenStore {
  /** Shown in the UI: the folder name, or "Demo". */
  readonly label: string;
  readonly readOnly: boolean;
  loadLibrary(): Promise<KitchenLibrary>;
  saveRecipe(recipe: Recipe): Promise<void>;
  /** Moves the recipe to _trash/ rather than deleting it. */
  deleteRecipe(id: string): Promise<void>;
  writeImage(recipeId: string, fileName: string, data: Blob): Promise<void>;
  readImage(recipeId: string, fileName: string): Promise<Blob | null>;
  /** Moves the image to _trash/ rather than deleting it. */
  deleteImage(recipeId: string, fileName: string): Promise<void>;
}

/** Recipe ids double as folder names: no path separators, and "_"/"." prefixes are reserved. */
export function assertSafeName(name: string): void {
  if (!name || /[\\/]/.test(name) || name.startsWith('_') || name.startsWith('.') || name === '..') {
    throw new Error(`Invalid recipe or file name: "${name}"`);
  }
}

/** Local timestamp for trash folder names, e.g. "20261012-183005". */
export function trashStamp(date: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-` +
    `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

export function sortRecipes(recipes: Recipe[]): Recipe[] {
  return [...recipes].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}
