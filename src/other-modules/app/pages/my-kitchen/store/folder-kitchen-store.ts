import { Recipe } from '../../../core/models/Recipe';
import { loadRecipe, LoadRecipeResult, serializeRecipe } from '../lib/recipe-loader';
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

/**
 * One subfolder per recipe (named by its id) holding recipe.json and its images. Recipes can sit
 * directly in the root or one level down inside a plain grouping folder (e.g. `Desserts/brownies/`).
 * New recipes are created in the root; existing ones are saved back where they were found.
 */
export class FolderKitchenStore implements KitchenStore {
  readonly readOnly = false;
  /** The directory each loaded recipe's folder lives in (root or a grouping folder), by id. */
  private readonly parents = new Map<string, FileSystemDirectoryHandle>();

  constructor(private readonly root: FileSystemDirectoryHandle) {}

  get label(): string {
    return this.root.name;
  }

  async loadLibrary(): Promise<KitchenLibrary> {
    const recipes: Recipe[] = [];
    const errors: RecipeLoadError[] = [];
    const takenNames: string[] = [];
    /** Recipe id → its folder path, to catch the same name in two grouping folders. */
    const found = new Map<string, string>();
    this.parents.clear();

    const loadInto = async (
      parent: FileSystemDirectoryHandle,
      dir: FileSystemDirectoryHandle,
      name: string,
      path: string,
    ) => {
      const result = await readRecipe(dir, name);
      if (!result.ok) {
        errors.push({ folder: path, message: result.error });
        takenNames.push(name);
        return;
      }
      const other = found.get(name);
      if (other !== undefined) {
        errors.push({ folder: path, message: `Another recipe already uses the folder name "${name}" (${other}).` });
        return;
      }
      found.set(name, path);
      this.parents.set(name, parent);
      recipes.push(result.recipe);
      if (result.changed) {
        // Persist generated ids (e.g. a missing uid) so they stay stable across loads.
        await writeText(dir, RECIPE_FILE, serializeRecipe(result.recipe)).catch(() => {});
      }
    };

    for (const [name, dir] of await subfolders(this.root)) {
      if (await hasFile(dir, RECIPE_FILE)) {
        await loadInto(this.root, dir, name, name);
        continue;
      }
      takenNames.push(name);
      const children = await subfolders(dir);
      if (children.length === 0) {
        errors.push({ folder: name, message: 'No recipe.json in this folder.' });
        continue;
      }
      // A grouping folder: only one level deep, so its subfolders must be recipes.
      for (const [childName, child] of children) {
        await loadInto(dir, child, childName, `${name}/${childName}`);
      }
    }

    return { recipes: sortRecipes(recipes), errors, takenNames };
  }

  async saveRecipe(recipe: Recipe): Promise<void> {
    assertSafeName(recipe.id);
    const dir = await this.parentOf(recipe.id).getDirectoryHandle(recipe.id, { create: true });
    await writeText(dir, RECIPE_FILE, serializeRecipe(recipe));
  }

  async deleteRecipe(id: string): Promise<void> {
    assertSafeName(id);
    const parent = this.parentOf(id);
    const source = await parent.getDirectoryHandle(id);
    const trash = await this.root.getDirectoryHandle(TRASH_DIR, { create: true });
    const target = await trash.getDirectoryHandle(`${trashStamp()}-${id}`, { create: true });
    // Copy first, delete second: if the copy fails, nothing is lost.
    await copyDirectory(source, target);
    await parent.removeEntry(id, { recursive: true });
    this.parents.delete(id);
  }

  async writeImage(recipeId: string, fileName: string, data: Blob): Promise<void> {
    assertSafeName(recipeId);
    assertSafeName(fileName);
    const dir = await this.parentOf(recipeId).getDirectoryHandle(recipeId, { create: true });
    await writeBlob(dir, fileName, data);
  }

  async readImage(recipeId: string, fileName: string): Promise<Blob | null> {
    try {
      assertSafeName(recipeId);
      assertSafeName(fileName);
      const dir = await this.parentOf(recipeId).getDirectoryHandle(recipeId);
      return await (await dir.getFileHandle(fileName)).getFile();
    } catch {
      return null;
    }
  }

  async deleteImage(recipeId: string, fileName: string): Promise<void> {
    assertSafeName(recipeId);
    assertSafeName(fileName);
    const dir = await this.parentOf(recipeId).getDirectoryHandle(recipeId);
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

  /** Where a recipe's folder lives; anything not seen by loadLibrary (i.e. new) goes in the root. */
  private parentOf(id: string): FileSystemDirectoryHandle {
    return this.parents.get(id) ?? this.root;
  }
}

/** Non-reserved subfolders: "_trash", ".git", etc. are skipped. */
async function subfolders(dir: FileSystemDirectoryHandle): Promise<[string, FileSystemDirectoryHandle][]> {
  const result: [string, FileSystemDirectoryHandle][] = [];
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== 'directory' || name.startsWith('_') || name.startsWith('.')) continue;
    result.push([name, handle as FileSystemDirectoryHandle]);
  }
  return result;
}

async function hasFile(dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

async function readRecipe(dir: FileSystemDirectoryHandle, id: string): Promise<LoadRecipeResult> {
  let text: string;
  try {
    text = await (await (await dir.getFileHandle(RECIPE_FILE)).getFile()).text();
  } catch {
    return { ok: false, error: 'No recipe.json in this folder.' };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'recipe.json is not valid JSON.' };
  }
  return loadRecipe(data, id);
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
