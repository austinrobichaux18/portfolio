import { Recipe } from '../../../core/models/Recipe';
import { loadRecipe, serializeRecipe } from '../lib/recipe-loader';
import {
  assertSafeName,
  KitchenLibrary,
  KitchenStore,
  RecipeLoadError,
  sortRecipes,
  trashStamp,
} from './kitchen-store';

const RECIPE_FILE = 'recipe.json';
const TRASH_DIR = '_trash';

/** One subfolder per recipe (named by its id) holding recipe.json and its images. */
export class FolderKitchenStore implements KitchenStore {
  readonly readOnly = false;

  constructor(private readonly root: FileSystemDirectoryHandle) {}

  get label(): string {
    return this.root.name;
  }

  async loadLibrary(): Promise<KitchenLibrary> {
    const recipes: Recipe[] = [];
    const errors: RecipeLoadError[] = [];

    for await (const [name, handle] of this.root.entries()) {
      // "_trash", "_pantry.json", ".git", etc. are not recipes.
      if (handle.kind !== 'directory' || name.startsWith('_') || name.startsWith('.')) continue;
      const dir = handle as FileSystemDirectoryHandle;

      let text: string;
      try {
        const file = await (await dir.getFileHandle(RECIPE_FILE)).getFile();
        text = await file.text();
      } catch {
        errors.push({ folder: name, message: 'No recipe.json in this folder.' });
        continue;
      }

      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        errors.push({ folder: name, message: 'recipe.json is not valid JSON.' });
        continue;
      }

      const result = loadRecipe(data, name);
      if (!result.ok) {
        errors.push({ folder: name, message: result.error });
        continue;
      }
      recipes.push(result.recipe);
      if (result.changed) {
        // Persist generated ids (e.g. a missing uid) so they stay stable across loads.
        await writeText(dir, RECIPE_FILE, serializeRecipe(result.recipe)).catch(() => {});
      }
    }

    return { recipes: sortRecipes(recipes), errors };
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    assertSafeName(recipe.id);
    const dir = await this.root.getDirectoryHandle(recipe.id, { create: true });
    await writeText(dir, RECIPE_FILE, serializeRecipe(recipe));
  }

  async deleteRecipe(id: string): Promise<void> {
    assertSafeName(id);
    const source = await this.root.getDirectoryHandle(id);
    const trash = await this.root.getDirectoryHandle(TRASH_DIR, { create: true });
    const target = await trash.getDirectoryHandle(`${trashStamp()}-${id}`, { create: true });
    // Copy first, delete second: if the copy fails, nothing is lost.
    await copyDirectory(source, target);
    await this.root.removeEntry(id, { recursive: true });
  }

  async writeImage(recipeId: string, fileName: string, data: Blob): Promise<void> {
    assertSafeName(recipeId);
    assertSafeName(fileName);
    const dir = await this.root.getDirectoryHandle(recipeId, { create: true });
    await writeBlob(dir, fileName, data);
  }

  async readImage(recipeId: string, fileName: string): Promise<Blob | null> {
    try {
      assertSafeName(recipeId);
      assertSafeName(fileName);
      const dir = await this.root.getDirectoryHandle(recipeId);
      return await (await dir.getFileHandle(fileName)).getFile();
    } catch {
      return null;
    }
  }

  async deleteImage(recipeId: string, fileName: string): Promise<void> {
    assertSafeName(recipeId);
    assertSafeName(fileName);
    const dir = await this.root.getDirectoryHandle(recipeId);
    let file: File;
    try {
      file = await (await dir.getFileHandle(fileName)).getFile();
    } catch {
      return; // Already gone.
    }
    const trash = await this.root.getDirectoryHandle(TRASH_DIR, { create: true });
    const target = await trash.getDirectoryHandle(`${trashStamp()}-${recipeId}`, { create: true });
    await writeBlob(target, fileName, file);
    await dir.removeEntry(fileName);
  }
}

async function writeText(dir: FileSystemDirectoryHandle, name: string, text: string): Promise<void> {
  await writeBlob(dir, name, new Blob([text], { type: 'application/json' }));
}

async function writeBlob(dir: FileSystemDirectoryHandle, name: string, data: Blob): Promise<void> {
  const handle = await dir.getFileHandle(name, { create: true });
  // createWritable writes to a temporary file and swaps it in on close, so a failed write
  // leaves the previous file intact.
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
    await writable.close();
  } catch (err) {
    await writable.abort().catch(() => {});
    throw err;
  }
}

async function copyDirectory(source: FileSystemDirectoryHandle, target: FileSystemDirectoryHandle): Promise<void> {
  for await (const [name, handle] of source.entries()) {
    if (handle.kind === 'file') {
      await writeBlob(target, name, await (handle as FileSystemFileHandle).getFile());
    } else {
      const sub = await target.getDirectoryHandle(name, { create: true });
      await copyDirectory(handle as FileSystemDirectoryHandle, sub);
    }
  }
}
