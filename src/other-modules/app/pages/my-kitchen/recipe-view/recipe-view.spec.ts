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

  it('changes status and how often right on the page', async () => {
    const { harness, store } = await setupKitchen([sampleRamen()]);
    const view = await harness.navigateByUrl('/r/ramen', RecipeView);

    await view.setTrust('ours');
    await view.setFrequency('rare');

    const household = (await store.loadLibrary()).recipes[0].household;
    expect(household.trust).toBe('ours');
    expect(household.frequency).toBe('rare');
    expect(household.rating).toBe(8); // untouched
  });

  it('deletes to trash after confirming and returns to the library', async () => {
    const { harness, store, router } = await setupKitchen([sampleRamen()]);
    const view = await harness.navigateByUrl('/r/ramen', RecipeView);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await view.deleteRecipe();

    expect(store.trash).toEqual(['ramen']);
    expect(router.url).toBe('/');
  });

  it('scales ingredients with the servings stepper', async () => {
    const recipe = sampleRamen();
    recipe.servings = 2;
    const { harness } = await setupKitchen([recipe]);
    const view = await harness.navigateByUrl('/r/ramen', RecipeView);

    view.changeServings(2); // 2 → 4 servings
    harness.detectChanges();

    const content = text(harness.routeNativeElement!);
    expect(content).toContain('4 packages ramen noodles');
    expect(content).toContain('2 eggs');
    expect(content).toContain('Scaled from 2 servings');
  });

  it('logs a cook in two clicks with servings and options prefilled', async () => {
    const recipe = sampleRamen();
    recipe.servings = 2;
    const { harness, store } = await setupKitchen([recipe]);
    await harness.navigateByUrl('/r/ramen', RecipeView);
    const el = harness.routeNativeElement!;

    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Made it')) as HTMLButtonElement).click();
    harness.detectChanges();
    (el.querySelector('app-made-it-sheet .primary') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    const [saved] = (await store.loadLibrary()).recipes;
    expect(saved.household.cookLog).toEqual([
      expect.objectContaining({ servingsMade: 2, optionIds: ['soft-egg', 'chashu'] }),
    ]);
    expect(el.querySelector('app-made-it-sheet')).toBeNull();
    expect(text(el)).toContain('Cook log (1)');
  });

  it('asks whether to keep an untested recipe on its first cook', async () => {
    const recipe = sampleRamen();
    recipe.household.trust = 'untested';
    recipe.household.frequency = 'want-to-try';
    const { harness, store } = await setupKitchen([recipe]);
    const view = await harness.navigateByUrl('/r/ramen', RecipeView);
    view['sheet'].set('new');
    harness.detectChanges();
    const el = harness.routeNativeElement!;

    expect(text(el)).toContain('First time making it — keep it?');
    (el.querySelector('app-made-it-sheet .primary') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    const [saved] = (await store.loadLibrary()).recipes;
    expect(saved.household).toMatchObject({ trust: 'tested', frequency: 'occasional' });
  });

  it('shows nutrition provided by the source', async () => {
    const recipe = sampleRamen();
    recipe.sourceNutrition = { calories: 520, proteinG: 28 };
    const { harness } = await setupKitchen([recipe]);
    await harness.navigateByUrl('/r/ramen', RecipeView);

    const rows = Array.from(harness.routeNativeElement!.querySelectorAll('.nutrition dl > div')).map((d) => [
      d.querySelector('dt')?.textContent,
      d.querySelector('dd')?.textContent,
    ]);
    expect(rows).toEqual([
      ['Calories', '520'],
      ['Protein', '28g'],
    ]);
  });

  it('says so when the recipe does not exist', async () => {
    const { harness } = await setupKitchen([]);
    await harness.navigateByUrl('/r/nope', RecipeView);
    expect(text(harness.routeNativeElement!)).toContain("That recipe isn't in this folder.");
  });
});
