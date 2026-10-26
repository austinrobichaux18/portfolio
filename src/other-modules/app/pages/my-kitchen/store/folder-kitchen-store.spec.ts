import { newRecipe, serializeRecipe } from '../lib/recipe-loader';
import { FolderKitchenStore } from './folder-kitchen-store';
import { InMemoryKitchenStore } from './in-memory-kitchen-store';

/** Just enough of the File System Access API for the store, backed by maps. */
class FakeDir {
  readonly kind = 'directory';
  readonly files = new Map<string, Blob>();
  readonly dirs = new Map<string, FakeDir>();

  constructor(readonly name: string) {}

  async *entries(): AsyncGenerator<[string, unknown]> {
    for (const name of this.files.keys()) yield [name, this.fileHandle(name)];
    for (const [name, dir] of this.dirs) yield [name, dir];
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FakeDir> {
    let dir = this.dirs.get(name);
    if (!dir) {
      if (!options?.create) throw new DOMException('missing', 'NotFoundError');
      dir = new FakeDir(name);
      this.dirs.set(name, dir);
    }
    return dir;
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    if (!this.files.has(name)) {
      if (!options?.create) throw new DOMException('missing', 'NotFoundError');
      this.files.set(name, new Blob([]));
    }
    return this.fileHandle(name);
  }

  async removeEntry(name: string): Promise<void> {
    if (!this.files.delete(name) && !this.dirs.delete(name)) throw new DOMException('missing', 'NotFoundError');
  }

  private fileHandle(name: string) {
    return {
      kind: 'file' as const,
      name,
      getFile: async () => this.files.get(name)!,
      createWritable: async () => {
        const chunks: Blob[] = [];
        return {
          write: async (data: Blob) => void chunks.push(data),
          close: async () => void this.files.set(name, new Blob(chunks)),
          abort: async () => {},
        };
      },
    };
  }
}

function readText(blob: Blob): Promise<string> {
  return blob.text();
}

function makeStore(root: FakeDir): FolderKitchenStore {
  return new FolderKitchenStore(root as unknown as FileSystemDirectoryHandle);
}

describe('FolderKitchenStore', () => {
  let root: FakeDir;
  let store: FolderKitchenStore;

  beforeEach(() => {
    root = new FakeDir('MyRecipes');
    store = makeStore(root);
  });

  it('saves a recipe into a folder named by its id and loads it back', async () => {
    const recipe = newRecipe('ramen', 'Ramen');
    await store.saveRecipe(recipe);

    expect(root.dirs.get('ramen')?.files.has('recipe.json')).toBe(true);
    const library = await store.loadLibrary();
    expect(library.recipes).toEqual([recipe]);
    expect(library.errors).toEqual([]);
  });

  it('skips reserved folders and reports broken ones without failing the rest', async () => {
    await store.saveRecipe(newRecipe('good', 'Good'));
    await root.getDirectoryHandle('_trash', { create: true });
    await root.getDirectoryHandle('.git', { create: true });
    await root.getDirectoryHandle('empty', { create: true });
    const broken = await root.getDirectoryHandle('broken', { create: true });
    broken.files.set('recipe.json', new Blob(['{ not json']));
    root.files.set('_pantry.json', new Blob(['{}']));

    const library = await store.loadLibrary();

    expect(library.recipes.map((r) => r.id)).toEqual(['good']);
    expect(library.errors).toEqual([
      { folder: 'empty', message: 'No recipe.json in this folder.' },
      { folder: 'broken', message: 'recipe.json is not valid JSON.' },
    ]);
  });

  it('writes back a generated uid so it stays stable', async () => {
    const dir = await root.getDirectoryHandle('toast', { create: true });
    dir.files.set('recipe.json', new Blob([JSON.stringify({ title: 'Toast' })]));

    const first = await store.loadLibrary();
    const second = await store.loadLibrary();

    expect(first.recipes[0].uid).toBe(second.recipes[0].uid);
    expect(await readText(dir.files.get('recipe.json')!)).toContain(first.recipes[0].uid);
  });

  it('backs up recipe.json to _trash before rewriting it on load', async () => {
    const dir = await root.getDirectoryHandle('toast', { create: true });
    const original = JSON.stringify({ title: 'Toast', somethingNew: 'kept in the backup' });
    dir.files.set('recipe.json', new Blob([original]));

    await store.loadLibrary();

    const trash = root.dirs.get('_trash')!;
    const [backup] = [...trash.files.keys()];
    expect(backup).toMatch(/^\d{8}-\d{6}-toast-recipe\.json$/);
    expect(await readText(trash.files.get(backup)!)).toBe(original);
  });

  it('converts an AI-format recipe.json in a folder instead of dropping its ingredients and steps', async () => {
    const dir = await root.getDirectoryHandle('abalone-with-lettuce', { create: true });
    const ai = {
      title: "Dad's Abalone with Lettuce",
      source: { url: 'https://www.madewithlau.com/recipes/abalone-with-lettuce', siteName: 'Made With Lau' },
      servings: 4,
      tags: ['cuisine:chinese'],
      ingredients: [{ group: 'Sauce', items: ['1 tbsp oyster sauce', '2 tsp sugar'] }],
      steps: ['Blanch the lettuce.', 'Add the sauce.'],
    };
    dir.files.set('recipe.json', new Blob([JSON.stringify(ai)]));
    dir.files.set('image.jpg', new Blob(['jpg']));

    const library = await store.loadLibrary();

    expect(library.errors).toEqual([]);
    const recipe = library.recipes[0];
    expect(recipe.id).toBe('abalone-with-lettuce');
    expect(recipe.ingredientGroups[0].name).toBe('Sauce');
    expect(recipe.ingredientGroups[0].items.map((i) => i.raw)).toEqual(['1 tbsp oyster sauce', '2 tsp sugar']);
    expect(recipe.stepGroups[0].steps.map((s) => s.text)).toEqual(['Blanch the lettuce.', 'Add the sauce.']);
    expect(recipe.source?.url).toBe('https://www.madewithlau.com/recipes/abalone-with-lettuce');
    expect(recipe.images).toEqual([{ file: 'image.jpg', thumb: 'image.jpg', origin: 'own', isCover: true }]);
    // Original kept, and the second load reads the converted file the same way.
    expect([...root.dirs.get('_trash')!.files.keys()][0]).toMatch(/abalone-with-lettuce-recipe\.json$/);
    const again = await store.loadLibrary();
    expect(again.recipes[0].ingredientGroups).toEqual(recipe.ingredientGroups);
    expect(again.recipes[0].uid).toBe(recipe.uid);
  });

  it('reads recipe-scraper output (step objects, source_url) dropped into a folder', async () => {
    const dir = await root.getDirectoryHandle('bok-choy', { create: true });
    const scraped = {
      title: 'Bok Choy',
      source_url: 'https://www.madewithlau.com/recipes/bok-choy',
      prep_time: '',
      ingredients: ['1 lb bok choy', '2 cloves garlic'],
      steps: [
        { title: 'Wash', text: 'Wash the bok choy.\n\nDrain well.' },
        { title: 'Cook', text: 'Stir-fry 2 minutes.' },
      ],
    };
    dir.files.set('recipe.json', new Blob([JSON.stringify(scraped)]));

    const recipe = (await store.loadLibrary()).recipes[0];

    expect(recipe.ingredientGroups[0].items).toHaveLength(2);
    expect(recipe.stepGroups[0].steps.map((s) => s.text)).toEqual([
      'Wash the bok choy.\nDrain well.',
      'Stir-fry 2 minutes.',
    ]);
    expect(recipe.source?.url).toBe('https://www.madewithlau.com/recipes/bok-choy');
  });

  it('moves a deleted recipe and its images into _trash instead of deleting them', async () => {
    await store.saveRecipe(newRecipe('ramen', 'Ramen'));
    await store.writeImage('ramen', 'img-a.webp', new Blob(['photo']));

    await store.deleteRecipe('ramen');

    expect(root.dirs.has('ramen')).toBe(false);
    const trashed = [...root.dirs.get('_trash')!.dirs.values()];
    expect(trashed).toHaveLength(1);
    expect(trashed[0].name).toMatch(/^\d{8}-\d{6}-ramen$/);
    expect([...trashed[0].files.keys()].sort()).toEqual(['img-a.webp', 'recipe.json']);
  });

  it('moves a deleted image into _trash', async () => {
    await store.saveRecipe(newRecipe('ramen', 'Ramen'));
    await store.writeImage('ramen', 'img-a.webp', new Blob(['photo']));

    await store.deleteImage('ramen', 'img-a.webp');

    expect(root.dirs.get('ramen')!.files.has('img-a.webp')).toBe(false);
    const trashed = [...root.dirs.get('_trash')!.dirs.values()][0];
    expect(await readText(trashed.files.get('img-a.webp')!)).toBe('photo');
    expect(await store.readImage('ramen', 'img-a.webp')).toBeNull();
  });

  describe('grouping folders (one level deep)', () => {
    async function addRecipe(parent: FakeDir, id: string, title: string): Promise<FakeDir> {
      const dir = await parent.getDirectoryHandle(id, { create: true });
      dir.files.set('recipe.json', new Blob([serializeRecipe(newRecipe(id, title))]));
      return dir;
    }

    it('loads recipes from the root and from grouping folders', async () => {
      await addRecipe(root, 'toast', 'Toast');
      const desserts = await root.getDirectoryHandle('Desserts', { create: true });
      await addRecipe(desserts, 'brownies', 'Brownies');
      await desserts.getDirectoryHandle('_trash', { create: true });

      const library = await store.loadLibrary();

      expect(library.recipes.map((r) => r.id)).toEqual(['brownies', 'toast']);
      expect(library.errors).toEqual([]);
      expect(library.takenNames).toEqual(['Desserts']);
    });

    it('saves, writes images and trashes a nested recipe in place', async () => {
      const desserts = await root.getDirectoryHandle('Desserts', { create: true });
      const brownies = await addRecipe(desserts, 'brownies', 'Brownies');
      const [recipe] = (await store.loadLibrary()).recipes;

      await store.saveRecipe({ ...recipe, title: 'Fudgy Brownies' });
      await store.writeImage('brownies', 'img-a.webp', new Blob(['photo']));

      expect(root.dirs.has('brownies')).toBe(false);
      expect(await readText(brownies.files.get('recipe.json')!)).toContain('Fudgy Brownies');
      expect(await readText((await store.readImage('brownies', 'img-a.webp'))!)).toBe('photo');

      await store.deleteRecipe('brownies');
      expect(desserts.dirs.has('brownies')).toBe(false);
      const trashed = [...root.dirs.get('_trash')!.dirs.values()][0];
      expect([...trashed.files.keys()].sort()).toEqual(['img-a.webp', 'recipe.json']);
    });

    it('puts new recipes in the root', async () => {
      const desserts = await root.getDirectoryHandle('Desserts', { create: true });
      await addRecipe(desserts, 'brownies', 'Brownies');
      await store.loadLibrary();

      await store.saveRecipe(newRecipe('pie', 'Pie'));

      expect(root.dirs.get('pie')?.files.has('recipe.json')).toBe(true);
    });

    it('converts loose AI-format .json files into recipe folders and trashes the originals', async () => {
      const group = await root.getDirectoryHandle('made-with-lau', { create: true });
      const congee = {
        title: 'Chicken Congee',
        servings: 4,
        yield: '4 bowls',
        tags: ['cuisine:chinese'],
        ingredients: [{ group: 'Congee', items: ['3/4 cup jasmine rice', '8 cups water'] }],
        steps: [{ items: ['Rinse the rice.', 'Simmer 35 minutes.'] }],
      };
      group.files.set('chicken-congee.json', new Blob([JSON.stringify(congee)]));
      root.files.set('toast.json', new Blob([JSON.stringify({ title: 'Toast', ingredients: ['1 slice bread'] })]));
      await addRecipe(root, 'chicken-congee', 'Other Congee');

      const library = await store.loadLibrary();

      expect(library.errors).toEqual([]);
      const converted = library.recipes.find((r) => r.title === 'Chicken Congee')!;
      expect(converted.id).toBe('chicken-congee-2');
      expect(converted.servings).toBe(4);
      expect(converted.yieldText).toBe('4 bowls');
      expect(converted.ingredientGroups[0].name).toBe('Congee');
      expect(converted.ingredientGroups[0].items).toHaveLength(2);
      expect(converted.household.trust).toBe('untested');
      expect(group.files.has('chicken-congee.json')).toBe(false);
      expect(group.dirs.get('chicken-congee-2')!.files.has('recipe.json')).toBe(true);
      expect(root.dirs.get('toast')!.files.has('recipe.json')).toBe(true);
      expect([...root.dirs.get('_trash')!.files.keys()].map((n) => n.replace(/^\d{8}-\d{6}-/, '')).sort()).toEqual([
        'chicken-congee.json',
        'toast.json',
      ]);

      // Second load reads the converted folders like any other recipe.
      const again = await store.loadLibrary();
      expect(again.recipes.map((r) => r.id).sort()).toEqual(['chicken-congee', 'chicken-congee-2', 'toast']);
    });

    it('moves photos listed in a loose .json into the new recipe folder and keeps its source', async () => {
      const group = await root.getDirectoryHandle('made-with-lau', { create: true });
      const pie = {
        title: 'Apple Pie',
        source: { url: 'https://pies.example/apple', author: 'Lau' },
        images: ['pie.jpg', { file: 'slice.jpg', caption: 'A slice' }, 'missing.jpg', 'https://pies.example/a.jpg'],
        ingredients: ['6 apples'],
      };
      group.files.set('pie.json', new Blob([JSON.stringify(pie)]));
      group.files.set('pie.jpg', new Blob(['jpg']));
      group.files.set('slice.jpg', new Blob(['jpg2']));

      const library = await store.loadLibrary();

      expect(library.errors).toEqual([]);
      const recipe = library.recipes[0];
      expect(recipe.source).toEqual({ url: 'https://pies.example/apple', author: 'Lau' });
      expect(recipe.images).toEqual([
        { file: 'pie.jpg', thumb: 'pie.jpg', origin: 'own', isCover: true },
        { file: 'slice.jpg', thumb: 'slice.jpg', origin: 'own', caption: 'A slice' },
        { file: 'https://pies.example/a.jpg', thumb: 'https://pies.example/a.jpg', origin: 'own' },
      ]);
      const folder = group.dirs.get('pie')!;
      expect([...folder.files.keys()].sort()).toEqual(['pie.jpg', 'recipe.json', 'slice.jpg']);
      expect(group.files.has('pie.jpg')).toBe(false);
      expect(await store.readImage('pie', 'slice.jpg')).not.toBeNull();

      const again = await store.loadLibrary();
      expect(again.recipes[0].images.map((i) => i.file)).toEqual(['pie.jpg', 'slice.jpg', 'https://pies.example/a.jpg']);
    });

    it('leaves a loose .json that is not a recipe alone and reports it', async () => {
      const group = await root.getDirectoryHandle('Notes', { create: true });
      group.files.set('list.json', new Blob(['[1, 2, 3]']));

      const library = await store.loadLibrary();

      expect(library.recipes).toEqual([]);
      expect(library.errors.map((e) => e.folder)).toEqual(['Notes/list.json']);
      expect(group.files.has('list.json')).toBe(true);
    });

    it('does not go deeper than one level and reports duplicate names', async () => {
      const desserts = await root.getDirectoryHandle('Desserts', { create: true });
      const cakes = await desserts.getDirectoryHandle('Cakes', { create: true });
      await addRecipe(cakes, 'sponge', 'Sponge');
      await addRecipe(root, 'pie', 'Pie');
      const sweets = await root.getDirectoryHandle('Sweets', { create: true });
      await addRecipe(sweets, 'pie', 'Pie');

      const library = await store.loadLibrary();

      expect(library.recipes.map((r) => r.id)).toEqual(['pie']);
      expect(library.errors).toEqual([
        { folder: 'Desserts/Cakes', message: 'No recipe.json in this folder.' },
        { folder: 'Sweets/pie', message: 'Another recipe already uses the folder name "pie" (pie).' },
      ]);
    });
  });

  it('refuses ids and file names that could escape the folder or hit reserved names', async () => {
    await expect(store.saveRecipe(newRecipe('../evil', 'Evil'))).rejects.toThrow();
    await expect(store.saveRecipe(newRecipe('_trash', 'Trash'))).rejects.toThrow();
    await store.saveRecipe(newRecipe('ok', 'Ok'));
    await expect(store.writeImage('ok', '../x.webp', new Blob([]))).rejects.toThrow();
  });
});

describe('InMemoryKitchenStore', () => {
  it('behaves like the folder store for load errors and trash', async () => {
    const store = new InMemoryKitchenStore([newRecipe('a', 'A')]);
    store.setRawJson('bad', 'nope');
    const library = await store.loadLibrary();
    expect(library.recipes.map((r) => r.id)).toEqual(['a']);
    expect(library.errors[0].folder).toBe('bad');

    await store.deleteRecipe('a');
    expect(store.trash).toEqual(['a']);
  });

  it('rejects writes when read-only', async () => {
    const store = new InMemoryKitchenStore([], 'Demo', true);
    await expect(store.saveRecipe(newRecipe('a', 'A'))).rejects.toThrow('read-only');
  });

  it('round-trips through serialized JSON like the disk does', async () => {
    const recipe = newRecipe('a', 'A', { rating: 9 });
    const store = new InMemoryKitchenStore();
    await store.saveRecipe(recipe);
    expect((await store.loadLibrary()).recipes[0]).toEqual(JSON.parse(serializeRecipe(recipe)));
  });
});
