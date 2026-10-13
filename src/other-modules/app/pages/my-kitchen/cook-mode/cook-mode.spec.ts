import { CookMode, cookIngredients, cookSteps } from './cook-mode';
import { sampleRamen, setupKitchen, text } from '../testing/kitchen-test-setup';

describe('cook mode helpers', () => {
  it('lists base steps, then each selected option as its own section', () => {
    const steps = cookSteps(sampleRamen(), ['soft-egg']);
    expect(steps.map((s) => [s.section, s.text])).toEqual([
      [undefined, 'Boil the broth.'],
      [undefined, 'Cook the noodles.'],
      ['Soft egg · Toppings', 'Boil the egg 6½ minutes.'],
    ]);
  });

  it('scales the ingredient checklist and includes selected options only', () => {
    const items = cookIngredients(sampleRamen(), ['tofu'], 2);
    expect(items.map((i) => i.text)).toEqual(['4 packages ramen noodles', '2 blocks tofu']);
  });
});

describe('CookMode', () => {
  it('walks through steps with the keyboard and ends on "Made it"', async () => {
    const { harness } = await setupKitchen([sampleRamen()]);
    const cook = await harness.navigateByUrl('/r/ramen/cook?opts=soft-egg,chashu', CookMode);

    expect(text(harness.routeNativeElement!)).toContain('Step 1 of 3');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    harness.detectChanges();
    expect(text(harness.routeNativeElement!)).toContain('Boil the egg 6½ minutes.');

    cook.next();
    harness.detectChanges();
    expect(text(harness.routeNativeElement!)).toContain('Done!');
    expect(text(harness.routeNativeElement!)).toContain('Made it');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    harness.detectChanges();
    expect(text(harness.routeNativeElement!)).toContain('Step 3 of 3');
  });

  it('logs a cook from the end screen and returns to the recipe', async () => {
    const { harness, store, router } = await setupKitchen([sampleRamen()]);
    const cook = await harness.navigateByUrl('/r/ramen/cook?opts=tofu', CookMode);

    cook.goTo(cook['steps']().length);
    cook['showSheet'].set(true);
    harness.detectChanges();
    (harness.routeNativeElement!.querySelector('app-made-it-sheet .primary') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    const [saved] = (await store.loadLibrary()).recipes;
    expect(saved.household.cookLog.at(-1)?.optionIds).toEqual(['tofu']);
    expect(router.url).toBe('/r/ramen');
  });

  it('crosses off ingredients', async () => {
    const { harness } = await setupKitchen([sampleRamen()]);
    const cook = await harness.navigateByUrl('/r/ramen/cook', CookMode);

    const first = cook['ingredients']()[0].key;
    cook.toggleIngredient(first);
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelector('label.checked')?.textContent).toContain('2 packs ramen noodles');
  });
});
