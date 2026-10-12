import { Library } from './library';
import { sampleCake, sampleRamen, setupKitchen, text } from '../testing/kitchen-test-setup';

describe('Library', () => {
  it('lists recipes with tested ones before untested', async () => {
    const { harness } = await setupKitchen([sampleCake(), sampleRamen()]);
    await harness.navigateByUrl('/', Library);

    const titles = Array.from(harness.routeNativeElement!.querySelectorAll('.recipe-card h3')).map((h) =>
      h.textContent?.trim(),
    );
    expect(titles).toEqual(['Ramen', 'Chocolate Cake']);
    expect(text(harness.routeNativeElement!)).toContain('Untested');
  });

  it('searches by ingredient, including option ingredients', async () => {
    const { harness } = await setupKitchen([sampleCake(), sampleRamen()]);
    const library = await harness.navigateByUrl('/', Library);

    library.setQuery('tofu');
    harness.detectChanges();

    const cards = harness.routeNativeElement!.querySelectorAll('.recipe-card');
    expect(cards).toHaveLength(1);
    expect(text(cards[0] as HTMLElement)).toContain('Ramen');
  });

  it('filters by tag', async () => {
    const { harness } = await setupKitchen([sampleCake(), sampleRamen()]);
    const library = await harness.navigateByUrl('/', Library);

    library.toggleTag('meal:dessert');
    harness.detectChanges();

    expect(text(harness.routeNativeElement!)).toContain('1 of 2 recipes');
  });

  it('suggests what to make and lists cooked-but-unrated recipes', async () => {
    const ramen = sampleRamen(); // staple, never logged
    const tacos = sampleRamen();
    tacos.id = 'tacos';
    tacos.title = 'Tacos';
    delete tacos.household.rating;
    tacos.household.cookLog = [{ id: 'l', date: '2020-01-01', optionIds: [] }];
    const { harness } = await setupKitchen([ramen, tacos, sampleCake()]);
    const library = await harness.navigateByUrl('/', Library);

    const groups = Array.from(harness.routeNativeElement!.querySelectorAll('.suggest-group')).map((g) => [
      g.querySelector('.label')?.textContent?.trim(),
      Array.from(g.querySelectorAll('.suggest-item > span:first-child')).map((s) => s.textContent?.trim()),
    ]);
    expect(groups).toEqual([
      ['Due again', ['Tacos']],
      ['Regulars not logged yet', ['Ramen']],
      ['Want to try', ['Chocolate Cake']],
    ]);
    const reminder = harness.routeNativeElement!.querySelector('.rate-reminder') as HTMLElement;
    expect(Array.from(reminder.querySelectorAll('.chip')).map((c) => c.textContent?.trim())).toEqual(['Tacos']);

    library.setQuery('cake');
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('.suggestions')).toBeNull();
  });

  it('shows an empty state with ways to add the first recipe', async () => {
    const { harness } = await setupKitchen([]);
    await harness.navigateByUrl('/', Library);

    const el = harness.routeNativeElement!;
    expect(text(el)).toContain('No recipes yet');
    expect(el.querySelector('a[href="/new"]')).toBeTruthy();
  });

  it('reports folders that could not be loaded', async () => {
    const { harness, store, state } = await setupKitchen([sampleRamen()]);
    store.setRawJson('broken', '{ nope');
    await state.reload();
    await harness.navigateByUrl('/', Library);

    expect(text(harness.routeNativeElement!)).toContain("1 folder couldn't be loaded");
  });
});
