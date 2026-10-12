import { computed, Injectable, signal } from '@angular/core';
import { ContentOrigin, HouseholdRecipeData, Recipe, RecipeImage } from '../../../core/models/Recipe';
import { FULL_IMAGE_MAX_EDGE, resizeImage, THUMB_IMAGE_MAX_EDGE } from '../lib/image-resize';
import { newImageBaseName, uniqueId } from '../lib/recipe-id';
import { newRecipe } from '../lib/recipe-loader';
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
  readonly lastFolderName = signal<string | null>(null);
  readonly errorMessage = signal('');

  readonly readOnly = computed(() => this.store()?.readOnly ?? true);

  readonly allTags = computed(() =>
    [...new Set(this.recipes().flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b)),
  );

  private lastHandle: FileSystemDirectoryHandle | null = null;
  private readonly imageUrls = new Map<string, Promise<string | null>>();

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
  }

  closeLibrary(): void {
    this.revokeImageUrls();
    this.store.set(null);
    this.recipes.set([]);
    this.loadErrors.set([]);
    this.status.set('idle');
  }

  /** A fresh, unsaved recipe with a unique id. */
  draftRecipe(title: string, household: Partial<HouseholdRecipeData>, origin: ContentOrigin = 'own'): Recipe {
    const id = uniqueId(
      title,
      this.recipes().map((r) => r.id),
    );
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

  /** Object URL for a stored image, cached until the library is closed. */
  imageUrl(recipeId: string, fileName: string): Promise<string | null> {
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
