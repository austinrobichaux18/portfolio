import { RecipeView } from './recipe-view';
import { sampleRamen, setupKitchen, text } from '../testing/kitchen-test-setup';

describe('RecipeView', () => {
  it('shows the base recipe plus the default options', async () => {
    const { harness } = await setupKitchen([sampleRamen()]);
    await harness.navigateByUrl('/r/ramen', RecipeView);

    const content = text(harness.routeNativeElement!);
    expect(content).toContain('2 packs ramen noodles');
    expect(content).toContain('1 egg');
    expect(content).toContain('Boil the egg 6½ minutes.');
    expect(content).toContain('4 slices chashu pork');
    expect(content).not.toContain('broccoli florets');
    expect(content).not.toContain('1 block tofu');
  });

  it('adds pick-any options and swaps pick-one options', async () => {
    const { harness } = await setupKitchen([sampleRamen()]);
    const view = await harness.navigateByUrl('/r/ramen', RecipeView);
    const recipe = sampleRamen();
    const [toppings, protein] = recipe.optionGroups;

    view.toggleOption(toppings, toppings.options[1]); // + broccoli
    view.toggleOption(protein, protein.options[1]); // chashu → tofu
    harness.detectChanges();

    const content = text(harness.routeNativeElement!);
    expect(content).toContain('1 egg');
    expect(content).toContain('broccoli florets');
    expect(content).toContain('1 block tofu');
    expect(content).not.toContain('chashu pork');
  });

  it('saves a rating with one click, and clicking it again clears it', async () => {
    const { harness, store } = await setupKitchen([sampleRamen()]);
    const view = await harness.navigateByUrl('/r/ramen', RecipeView);

    await view.setRating(10);
    expect((await store.loadLibrary()).recipes[0].household.rating).toBe(10);

    await view.setRating(10);
    expect((await store.loadLibrary()).recipes[0].household.rating).toBeUndefined();
  });

  it('deletes to trash after confirming and returns to the library', async () => {
    const { harness, store, router } = await setupKitchen([sampleRamen()]);
    const view = await harness.navigateByUrl('/r/ramen', RecipeView);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await view.deleteRecipe();

    expect(store.trash).toEqual(['ramen']);
    expect(router.url).toBe('/');
  });

  it('says so when the recipe does not exist', async () => {
    const { harness } = await setupKitchen([]);
    await harness.navigateByUrl('/r/nope', RecipeView);
    expect(text(harness.routeNativeElement!)).toContain("That recipe isn't in this folder.");
  });
});
