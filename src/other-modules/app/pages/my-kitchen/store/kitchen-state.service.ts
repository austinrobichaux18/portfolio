import { computed, Injectable, signal } from '@angular/core';
import { ContentOrigin, HouseholdRecipeData, Recipe, RecipeImage } from '../../../core/models/Recipe';
import { FULL_IMAGE_MAX_EDGE, resizeImage, THUMB_IMAGE_MAX_EDGE } from '../lib/image-resize';
import { newImageBaseName, uniqueId } from '../lib/recipe-id';
import { isImageLink, newRecipe } from '../lib/recipe-loader';
import { createDemoStore } from './demo-library';
import { FolderKitchenStore } from './folder-kitchen-store';
import { clearLastFolderHandle, loadLastFolderHandle, saveLastFolderHandle } from './kitchen-folder-handle';
import { KitchenStore, RecipeLoadError, sortRecipes } from './kitchen-store';

export type KitchenStatus = 'idle' | 'loading' | 'ready';

/** A photo resized and ready to write, kept in memory until the recipe is saved. */
export interface PreparedImage {
  image: RecipeImage;
  full: Blob;
  thumb: Blob;
}

/** Shared by the My Kitchen child routes: the open library and everything loaded from it. */
@Injectable()
export class KitchenStateService {
  readonly supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  readonly status = signal<KitchenStatus>('idle');
  readonly store = signal<KitchenStore | null>(null);
  readonly recipes = signal<Recipe[]>([]);
  readonly loadErrors = signal<RecipeLoadError[]>([]);
  /** Folder names new recipe ids must avoid (see KitchenLibrary.takenNames). */
  private takenNames: string[] = [];
  readonly lastFolderName = signal<string | null>(null);
  readonly errorMessage = signal('');

  readonly readOnly = computed(() => this.store()?.readOnly ?? true);

  readonly allTags = computed(() =>
    [...new Set(this.recipes().flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b)),
  );

  private lastHandle: FileSystemDirectoryHandle | null = null;
  private readonly imageUrls = new Map<string, Promise<string | null>>();
  /** Recipes whose unresized photos are being resized right now, by id. */
  private readonly resizing = new Map<string, Promise<void>>();
  /** "recipeId/file" → its resized replacement, so an editor opened before the resize saves the new names. */
  private readonly resizedImages = new Map<string, RecipeImage>();
  /** "recipeId/file" of photos that couldn't be decoded; not retried until the library is reopened. */
  private readonly unreadableImages = new Set<string>();

  constructor() {
    if (this.supported) this.checkLastFolder();
  }

  recipe(id: string): Recipe | undefined {
    return this.recipes().find((r) => r.id === id);
  }

  async pickFolder(): Promise<void> {
    this.errorMessage.set('');
    let handle: FileSystemDirectoryHandle;
    try {
      handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'my-kitchen' });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      this.errorMessage.set('Unable to access that folder.');
      return;
    }
    this.lastHandle = handle;
    this.lastFolderName.set(handle.name);
    saveLastFolderHandle(handle).catch(() => {});
    await this.useStore(new FolderKitchenStore(handle));
  }

  async continueWithLastFolder(): Promise<void> {
    const handle = this.lastHandle;
    if (!handle) return;
    this.errorMessage.set('');
    try {
      let permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        this.errorMessage.set('Permission to access that folder was not granted.');
        return;
      }
    } catch {
      this.errorMessage.set('That folder is no longer available. Choose a folder to continue.');
      this.lastHandle = null;
      this.lastFolderName.set(null);
      clearLastFolderHandle().catch(() => {});
      return;
    }
    await this.useStore(new FolderKitchenStore(handle));
  }

  /** Read-only sample recipes, for visitors without a recipes folder (or a supported browser). */
  async openDemo(): Promise<void> {
    this.errorMessage.set('');
    await this.useStore(createDemoStore());
  }

  /** Opens any store: the picked folder, the demo, or an in-memory store in specs. */
  async useStore(store: KitchenStore): Promise<void> {
    this.revokeImageUrls();
    this.resizedImages.clear();
    this.unreadableImages.clear();
    this.store.set(store);
    this.status.set('loading');
    try {
      await this.reload();
      this.status.set('ready');
    } catch {
      this.errorMessage.set('Unable to read that folder.');
      this.store.set(null);
      this.status.set('idle');
    }
  }

  async reload(): Promise<void> {
    const store = this.requireStore();
    const library = await store.loadLibrary();
    this.recipes.set(library.recipes);
    this.loadErrors.set(library.errors);
    this.takenNames = library.takenNames ?? [];
  }

  closeLibrary(): void {
    this.revokeImageUrls();
    this.store.set(null);
    this.recipes.set([]);
    this.loadErrors.set([]);
    this.takenNames = [];
    this.status.set('idle');
  }

  /** A fresh, unsaved recipe with a unique id. */
  draftRecipe(title: string, household: Partial<HouseholdRecipeData>, origin: ContentOrigin = 'own'): Recipe {
    const id = uniqueId(title, [...this.recipes().map((r) => r.id), ...this.takenNames]);
    return newRecipe(id, title, household, origin);
  }

  /** Saves the recipe, then writes any newly added photos and moves removed ones to _trash. */
  async saveRecipe(
    recipe: Recipe,
    changes: { added?: PreparedImage[]; removed?: RecipeImage[] } = {},
  ): Promise<Recipe> {
    const store = this.requireStore();
    const saved: Recipe = { ...recipe, updatedAt: new Date().toISOString() };
    await store.saveRecipe(saved);
    for (const prepared of changes.added ?? []) {
      await store.writeImage(saved.id, prepared.image.file, prepared.full);
      if (prepared.image.thumb !== prepared.image.file) {
        await store.writeImage(saved.id, prepared.image.thumb, prepared.thumb);
      }
    }
    for (const image of changes.removed ?? []) {
      if (isImageLink(image.file)) continue;
      await store.deleteImage(saved.id, image.file).catch(() => {});
      if (image.thumb !== image.file) await store.deleteImage(saved.id, image.thumb).catch(() => {});
      this.forgetImageUrl(saved.id, image.file);
      this.forgetImageUrl(saved.id, image.thumb);
    }
    this.recipes.update((list) => sortRecipes([...list.filter((r) => r.id !== saved.id), saved]));
    return saved;
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.requireStore().deleteRecipe(id);
    this.recipes.update((list) => list.filter((r) => r.id !== id));
  }

  /** Resizes a photo into full + thumbnail versions with id-based names (not written yet). */
  async prepareImage(source: Blob, existingFiles: string[], origin: ContentOrigin = 'own'): Promise<PreparedImage> {
    const [full, thumb] = await Promise.all([
      resizeImage(source, FULL_IMAGE_MAX_EDGE),
      resizeImage(source, THUMB_IMAGE_MAX_EDGE, 0.8),
    ]);
    const base = newImageBaseName(existingFiles);
    return {
      image: { file: `${base}.${full.extension}`, thumb: `${base}.thumb.${thumb.extension}`, origin },
      full: full.blob,
      thumb: thumb.blob,
    };
  }

  /** Object URL for a stored image (or the link itself for web photos), cached until the library is closed. */
  imageUrl(recipeId: string, fileName: string): Promise<string | null> {
    if (isImageLink(fileName)) return Promise.resolve(fileName);
    const key = `${recipeId}/${fileName}`;
    let url = this.imageUrls.get(key);
    if (!url) {
      const store = this.store();
      url = store
        ? store
            .readImage(recipeId, fileName)
            .then((blob) => (blob && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : null))
            .catch(() => null)
        : Promise.resolve(null);
      this.imageUrls.set(key, url);
    }
    return url;
  }

  /** The image as it is now: its resized replacement if it was resized after `image` was read. */
  currentImage(recipeId: string, image: RecipeImage): RecipeImage {
    return this.resizedImages.get(`${recipeId}/${image.file}`) ?? image;
  }

  /**
   * Photos put in a folder by hand or from a loose .json (no thumbnail yet, `thumb === file`) are
   * resized the first time they're shown, like ones added in the editor, and the originals moved to
   * _trash/. Runs in the background; photos that can't be decoded are reported in loadErrors.
   */
  resizeNewImages(recipeId: string): Promise<void> {
    const store = this.store();
    const recipe = this.recipe(recipeId);
    if (!store || store.readOnly || !recipe?.images.some((img) => this.needsResize(recipeId, img))) {
      return Promise.resolve();
    }
    let running = this.resizing.get(recipeId);
    if (!running) {
      running = this.resizeImages(store, recipeId)
        .catch(() => {})
        .finally(() => this.resizing.delete(recipeId));
      this.resizing.set(recipeId, running);
    }
    return running;
  }

  private needsResize(recipeId: string, image: RecipeImage): boolean {
    return (
      image.thumb === image.file &&
      !isImageLink(image.file) &&
      !this.unreadableImages.has(`${recipeId}/${image.file}`)
    );
  }

  private async resizeImages(store: KitchenStore, recipeId: string): Promise<void> {
    const recipe = this.recipe(recipeId)!;
    const usedNames = recipe.images.flatMap((img) => [img.file, img.thumb]);
    const prepared = new Map<string, PreparedImage>();
    for (const image of recipe.images.filter((img) => this.needsResize(recipeId, img))) {
      const blob = await store.readImage(recipeId, image.file);
      if (!blob) continue; // Missing: the gallery shows a placeholder.
      try {
        const resized = await this.prepareImage(blob, usedNames, image.origin);
        const { file, thumb } = resized.image;
        usedNames.push(file, thumb);
        prepared.set(image.file, { ...resized, image: { ...image, file, thumb } });
      } catch {
        this.unreadableImages.add(`${recipeId}/${image.file}`);
        this.loadErrors.update((list) => [
          ...list,
          { folder: `${recipeId}/${image.file}`, message: "This photo couldn't be read. Use a JPEG, PNG or WebP." },
        ]);
      }
    }
    if (!prepared.size) return;

    // The recipe may have been saved while resizing, so swap the photos into its latest version.
    const latest = this.recipe(recipeId);
    if (!latest) return;
    const done = [...prepared.entries()].filter(([old]) => latest.images.some((img) => img.file === old));
    if (!done.length) return;
    for (const [, p] of done) {
      await store.writeImage(recipeId, p.image.file, p.full);
      await store.writeImage(recipeId, p.image.thumb, p.thumb);
    }
    const replacements = new Map(done.map(([old, p]) => [old, p.image]));
    // Housekeeping, not an edit: updatedAt stays as it was.
    const updated: Recipe = { ...latest, images: latest.images.map((img) => replacements.get(img.file) ?? img) };
    await store.saveRecipe(updated);
    for (const [old, image] of replacements) {
      this.resizedImages.set(`${recipeId}/${old}`, image);
      await store.deleteImage(recipeId, old).catch(() => {});
    }
    this.recipes.update((list) => list.map((r) => (r.id === recipeId ? updated : r)));
  }

  private forgetImageUrl(recipeId: string, fileName: string): void {
    const key = `${recipeId}/${fileName}`;
    const url = this.imageUrls.get(key);
    this.imageUrls.delete(key);
    url?.then((u) => u && URL.revokeObjectURL(u));
  }

  private revokeImageUrls(): void {
    for (const url of this.imageUrls.values()) url.then((u) => u && URL.revokeObjectURL(u));
    this.imageUrls.clear();
  }

  private requireStore(): KitchenStore {
    const store = this.store();
    if (!store) throw new Error('No library is open.');
    return store;
  }

  private async checkLastFolder(): Promise<void> {
    try {
      const handle = await loadLastFolderHandle();
      if (!handle) return;
      this.lastHandle = handle;
      this.lastFolderName.set(handle.name);
    } catch {
      // No remembered folder; the user just picks one.
    }
  }
}
