import { Recipe, RecipeImage } from '../../../core/models/Recipe';
import { uniqueId } from '../lib/recipe-id';
import { parseRecipeJson, recipeFromImported } from '../lib/recipe-json';
import { isImageLink, loadRecipe, LoadRecipeResult, serializeRecipe } from '../lib/recipe-loader';
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
 * Loose `<name>.json` files in either place (e.g. saved AI-format replies) are converted into a
 * recipe folder next to them on load, and the original file is moved to _trash/.
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
    const looseFiles: LooseFile[] = [];
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

    const rootEntries = await listEntries(this.root);
    for (const name of rootEntries.jsonFiles) looseFiles.push({ parent: this.root, name, path: name });
    for (const [name, dir] of rootEntries.dirs) {
      if (await hasFile(dir, RECIPE_FILE)) {
        await loadInto(this.root, dir, name, name);
        continue;
      }
      takenNames.push(name);
      const group = await listEntries(dir);
      if (group.dirs.length === 0 && group.jsonFiles.length === 0) {
        errors.push({ folder: name, message: 'No recipe.json in this folder.' });
        continue;
      }
      // A grouping folder: only one level deep, so its subfolders must be recipes.
      for (const [childName, child] of group.dirs) {
        await loadInto(dir, child, childName, `${name}/${childName}`);
      }
      for (const file of group.jsonFiles) looseFiles.push({ parent: dir, name: file, path: `${name}/${file}` });
    }

    // After the scan, so converted recipes get ids that don't clash with any existing folder.
    for (const file of looseFiles) {
      const taken = [...found.keys(), ...takenNames];
      const result = await this.convertLooseFile(file, taken);
      if (!result.ok) {
        errors.push({ folder: file.path, message: result.error });
        continue;
      }
      found.set(result.recipe.id, file.path);
      recipes.push(result.recipe);
    }

    return { recipes: sortRecipes(recipes), errors, takenNames };
  }

  /**
   * Turns `parent/name.json` into `parent/<id>/recipe.json`, then moves the original to _trash/.
   * Photos it lists in `images` are moved from beside it into the new folder (web links stay links);
   * missing ones are dropped. They're resized later, the first time they're shown.
   */
  private async convertLooseFile(
    file: LooseFile,
    taken: string[],
  ): Promise<{ ok: true; recipe: Recipe } | { ok: false; error: string }> {
    const original = await (await file.parent.getFileHandle(file.name)).getFile();
    const baseName = file.name.replace(/\.json$/i, '');
    const id = uniqueId(baseName, taken);
    const text = await original.text();

    let recipe: Recipe;
    const data = tryParse(text);
    if (isObject(data) && ('ingredientGroups' in data || 'schemaVersion' in data)) {
      // Already in recipe.json format, just not in its own folder.
      const result = loadRecipe(data, id);
      if (!result.ok) return result;
      recipe = result.recipe;
    } else {
      const result = parseRecipeJson(text);
      if (!result) return { ok: false, error: 'Not a recipe: the file is not valid JSON.' };
      if (!result.ok) return result;
      recipe = recipeFromImported(id, result.recipe, baseName);
    }

    const dir = await file.parent.getDirectoryHandle(id, { create: true });
    recipe.images = await moveImages(recipe.images, file.parent, dir);
    if (recipe.images.length && !recipe.images.some((img) => img.isCover)) recipe.images[0].isCover = true;
    await writeText(dir, RECIPE_FILE, serializeRecipe(recipe));
    this.parents.set(id, file.parent);
    // Copy first, delete second: if the copy fails, nothing is lost.
    const trash = await this.root.getDirectoryHandle(TRASH_DIR, { create: true });
    await writeBlob(trash, `${trashStamp()}-${file.name}`, original);
    await file.parent.removeEntry(file.name);
    return { ok: true, recipe };
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

interface LooseFile {
  parent: FileSystemDirectoryHandle;
  name: string;
  /** Shown in load errors, e.g. "Desserts/brownies.json". */
  path: string;
}

/** Non-reserved subfolders and loose .json files: "_trash", ".git", "_pantry.json" etc. are skipped. */
async function listEntries(
  dir: FileSystemDirectoryHandle,
): Promise<{ dirs: [string, FileSystemDirectoryHandle][]; jsonFiles: string[] }> {
  const dirs: [string, FileSystemDirectoryHandle][] = [];
  const jsonFiles: string[] = [];
  for await (const [name, handle] of dir.entries()) {
    if (name.startsWith('_') || name.startsWith('.')) continue;
    if (handle.kind === 'directory') dirs.push([name, handle as FileSystemDirectoryHandle]);
    else if (/\.json$/i.test(name) && name !== RECIPE_FILE) jsonFiles.push(name);
  }
  return { dirs, jsonFiles };
}

/** Moves each listed image that exists in `from` into `to`; keeps those plus web links. */
async function moveImages(images: RecipeImage[], from: FileSystemDirectoryHandle, to: FileSystemDirectoryHandle) {
  const moved: RecipeImage[] = [];
  for (const image of images) {
    if (isImageLink(image.file)) {
      moved.push({ ...image, thumb: image.file });
      continue;
    }
    try {
      assertSafeName(image.file);
      const file = await (await from.getFileHandle(image.file)).getFile();
      // Copy first, delete second: if the copy fails, nothing is lost.
      await writeBlob(to, image.file, file);
      await from.removeEntry(image.file);
      moved.push({ ...image, thumb: image.file });
    } catch {
      // Not there (or not a plain name): leave it out rather than show a broken photo.
    }
  }
  return moved;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
