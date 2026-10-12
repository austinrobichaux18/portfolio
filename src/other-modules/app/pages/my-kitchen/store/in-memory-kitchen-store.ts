import { Recipe } from '../../../core/models/Recipe';
import { loadRecipe, serializeRecipe } from '../lib/recipe-loader';
import { assertSafeName, KitchenLibrary, KitchenStore, RecipeLoadError, sortRecipes } from './kitchen-store';

interface StoredRecipe {
  /** Kept as serialized JSON so loading goes through the same loader as the folder store. */
  json: string;
  images: Map<string, Blob>;
}

/** Backs the specs (jsdom has no File System Access API) and demo mode. */
export class InMemoryKitchenStore implements KitchenStore {
  private readonly recipes = new Map<string, StoredRecipe>();

  /** What "deleted" things were moved to, for specs. */
  readonly trash: string[] = [];

  constructor(
    initial: Recipe[] = [],
    readonly label = 'Memory',
    readonly readOnly = false,
  ) {
    for (const recipe of initial) {
      this.recipes.set(recipe.id, { json: serializeRecipe(recipe), images: new Map() });
    }
  }

  /** For specs: put arbitrary text in a recipe folder's recipe.json. */
  setRawJson(folder: string, json: string): void {
    const existing = this.recipes.get(folder);
    this.recipes.set(folder, { json, images: existing?.images ?? new Map() });
  }

  async loadLibrary(): Promise<KitchenLibrary> {
    const recipes: Recipe[] = [];
    const errors: RecipeLoadError[] = [];
    for (const [folder, stored] of this.recipes) {
      let data: unknown;
      try {
        data = JSON.parse(stored.json);
      } catch {
        errors.push({ folder, message: 'recipe.json is not valid JSON.' });
        continue;
      }
      const result = loadRecipe(data, folder);
      if (!result.ok) {
        errors.push({ folder, message: result.error });
        continue;
      }
      recipes.push(result.recipe);
      if (result.changed && !this.readOnly) stored.json = serializeRecipe(result.recipe);
    }
    return { recipes: sortRecipes(recipes), errors };
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    this.assertWritable();
    assertSafeName(recipe.id);
    const existing = this.recipes.get(recipe.id);
    this.recipes.set(recipe.id, { json: serializeRecipe(recipe), images: existing?.images ?? new Map() });
  }

  async deleteRecipe(id: string): Promise<void> {
    this.assertWritable();
    if (this.recipes.delete(id)) this.trash.push(id);
  }

  async writeImage(recipeId: string, fileName: string, data: Blob): Promise<void> {
    this.assertWritable();
    assertSafeName(fileName);
    const stored = this.recipes.get(recipeId);
    if (!stored) throw new Error(`No recipe "${recipeId}"`);
    stored.images.set(fileName, data);
  }

  async readImage(recipeId: string, fileName: string): Promise<Blob | null> {
    return this.recipes.get(recipeId)?.images.get(fileName) ?? null;
  }

  async deleteImage(recipeId: string, fileName: string): Promise<void> {
    this.assertWritable();
    if (this.recipes.get(recipeId)?.images.delete(fileName)) this.trash.push(`${recipeId}/${fileName}`);
  }

  private assertWritable(): void {
    if (this.readOnly) throw new Error('This library is read-only.');
  }
}
