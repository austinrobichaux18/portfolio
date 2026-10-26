import { newRecipe } from '../lib/recipe-loader';
import { InMemoryKitchenStore } from './in-memory-kitchen-store';
import { KitchenStateService, PreparedImage } from './kitchen-state.service';

function fakePrepare(state: KitchenStateService) {
  let n = 0;
  return vi.spyOn(state, 'prepareImage').mockImplementation(async (source, _existing, origin = 'own') => {
    if ((await source.text()) === 'not a photo') throw new Error('decode failed');
    n++;
    return {
      image: { file: `img-${n}.webp`, thumb: `img-${n}.thumb.webp`, origin },
      full: new Blob(['full']),
      thumb: new Blob(['thumb']),
    } satisfies PreparedImage;
  });
}

describe('KitchenStateService photo resizing', () => {
  async function setup() {
    const recipe = newRecipe('pie', 'Pie');
    recipe.updatedAt = '2026-01-01T00:00:00.000Z';
    recipe.images = [
      { file: 'pie.jpg', thumb: 'pie.jpg', origin: 'own', isCover: true, caption: 'Whole' },
      { file: 'img-old.webp', thumb: 'img-old.thumb.webp', origin: 'own' },
      { file: 'https://pies.example/slice.jpg', thumb: 'https://pies.example/slice.jpg', origin: 'imported' },
    ];
    const store = new InMemoryKitchenStore([recipe]);
    await store.writeImage('pie', 'pie.jpg', new Blob(['big photo']));
    const state = new KitchenStateService();
    await state.useStore(store);
    return { state, store, prepare: fakePrepare(state) };
  }

  it('resizes photos without a thumbnail once, keeps the rest, and trashes the original', async () => {
    const { state, store, prepare } = await setup();

    await state.resizeNewImages('pie');

    expect(prepare).toHaveBeenCalledTimes(1);
    const recipe = state.recipe('pie')!;
    expect(recipe.images).toEqual([
      { file: 'img-1.webp', thumb: 'img-1.thumb.webp', origin: 'own', isCover: true, caption: 'Whole' },
      { file: 'img-old.webp', thumb: 'img-old.thumb.webp', origin: 'own' },
      { file: 'https://pies.example/slice.jpg', thumb: 'https://pies.example/slice.jpg', origin: 'imported' },
    ]);
    expect(recipe.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(await store.readImage('pie', 'img-1.thumb.webp')).not.toBeNull();
    expect(store.trash).toEqual(['pie/pie.jpg']);
    expect((await store.loadLibrary()).recipes[0].images[0].file).toBe('img-1.webp');
    // An editor opened before the resize saves the new name.
    expect(state.currentImage('pie', { file: 'pie.jpg', thumb: 'pie.jpg', origin: 'own' }).file).toBe('img-1.webp');

    await state.resizeNewImages('pie');
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('reports a photo that cannot be decoded and does not retry it', async () => {
    const { state, store, prepare } = await setup();
    await store.writeImage('pie', 'pie.jpg', new Blob(['not a photo']));

    await state.resizeNewImages('pie');
    await state.resizeNewImages('pie');

    expect(prepare).toHaveBeenCalledTimes(1);
    expect(state.loadErrors().map((e) => e.folder)).toEqual(['pie/pie.jpg']);
    expect(state.recipe('pie')!.images[0].file).toBe('pie.jpg');
    expect(store.trash).toEqual([]);
  });

  it('serves web links as-is without touching the store', async () => {
    const { state } = await setup();
    expect(await state.imageUrl('pie', 'https://pies.example/slice.jpg')).toBe('https://pies.example/slice.jpg');
  });
});
