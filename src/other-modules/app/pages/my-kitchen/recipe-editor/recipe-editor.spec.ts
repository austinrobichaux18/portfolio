import { RecipeEditor } from './recipe-editor';
import { sampleRamen, setupKitchen } from '../testing/kitchen-test-setup';

describe('RecipeEditor', () => {
  beforeEach(() => localStorage.clear());

  it('saves a new recipe we already make as tested, with an optional last-made date', async () => {
    const { harness, store, router } = await setupKitchen([]);
    const editor = await harness.navigateByUrl('/new', RecipeEditor);

    editor.update({
      title: 'Smash Burgers',
      ingredientsText: '1 lb ground beef\n4 buns',
      stepsText: 'Smash.\n\nFlip.',
      frequency: 'staple',
    });
    editor['lastMade'].set('2026-10-01');
    await editor.save();

    const [saved] = (await store.loadLibrary()).recipes;
    expect(saved.id).toBe('smash-burgers');
    expect(saved.household).toMatchObject({ trust: 'tested', frequency: 'staple' });
    expect(saved.household.cookLog.map((e) => e.date)).toEqual(['2026-10-01']);
    expect(saved.ingredientGroups[0].items[0]).toMatchObject({ quantity: 1, unit: 'lb', name: 'ground beef' });
    expect(saved.stepGroups[0].steps).toEqual([{ text: 'Smash.' }, { text: 'Flip.' }]);
    expect(router.url).toBe('/r/smash-burgers');
  });

  it('saves a recipe we have not made as untested / want to try', async () => {
    const { harness, store } = await setupKitchen([]);
    const editor = await harness.navigateByUrl('/new', RecipeEditor);

    editor.update({ title: 'Paella' });
    editor['madeBefore'].set(false);
    await editor.save();

    const [saved] = (await store.loadLibrary()).recipes;
    expect(saved.household).toMatchObject({ trust: 'untested', frequency: 'want-to-try', cookLog: [] });
  });

  it('requires only a title', async () => {
    const { harness, store } = await setupKitchen([]);
    const editor = await harness.navigateByUrl('/new', RecipeEditor);

    await editor.save();

    expect((await store.loadLibrary()).recipes).toEqual([]);
    expect(editor['errorMessage']()).toContain('title');
  });

  it('gives a new recipe a unique id when the title is taken', async () => {
    const { harness, store } = await setupKitchen([sampleRamen()]);
    const editor = await harness.navigateByUrl('/new', RecipeEditor);

    editor.update({ title: 'Ramen' });
    await editor.save();

    expect((await store.loadLibrary()).recipes.map((r) => r.id)).toEqual(['ramen', 'ramen-2']);
  });

  it('fills the form from a pasted recipe', async () => {
    const { harness } = await setupKitchen([]);
    const editor = await harness.navigateByUrl('/new?paste=1', RecipeEditor);

    expect(editor['showPaste']()).toBe(true);
    editor['pasteText'].set('Tacos\nIngredients\n1 lb beef\nInstructions\n1. Brown the beef.');
    editor.applyPaste();

    expect(editor['form']()).toMatchObject({
      title: 'Tacos',
      ingredientsText: '1 lb beef',
      stepsText: 'Brown the beef.',
    });
  });

  it('keeps per-line settings when editing an existing recipe', async () => {
    const { harness, store } = await setupKitchen([sampleRamen()]);
    const editor = await harness.navigateByUrl('/r/ramen/edit', RecipeEditor);

    editor.update({ ingredientsText: editor['form']().ingredientsText + '\n1 tbsp chili oil (optional)' });
    await editor.save();

    const [saved] = (await store.loadLibrary()).recipes;
    expect(saved.ingredientGroups[0].items[0].ingredientId).toBe('noodles');
    expect(saved.ingredientGroups[0].items[1]).toMatchObject({ name: 'chili oil', optional: true });
    expect(saved.household.rating).toBe(8);
    expect(saved.optionGroups).toEqual(sampleRamen().optionGroups);
  });

  it('tracks unsaved changes and asks before leaving', async () => {
    const { harness, router } = await setupKitchen([sampleRamen()]);
    const editor = await harness.navigateByUrl('/r/ramen/edit', RecipeEditor);
    expect(editor.hasUnsavedChanges()).toBe(false);

    editor.update({ title: 'Changed' });
    expect(editor.hasUnsavedChanges()).toBe(true);

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await router.navigateByUrl('/');
    expect(confirm).toHaveBeenCalled();
    expect(router.url).toBe('/r/ramen/edit');
  });

  it('keeps only one usual choice in a pick-one option group', async () => {
    const { harness } = await setupKitchen([sampleRamen()]);
    const editor = await harness.navigateByUrl('/r/ramen/edit', RecipeEditor);

    editor.updateOption(1, 1, { isDefault: true }); // Protein: tofu

    expect(editor['form']().optionGroups[1].options.map((o) => o.isDefault)).toEqual([false, true]);
  });

  it('shows recipe checks while typing', async () => {
    const { harness } = await setupKitchen([]);
    const editor = await harness.navigateByUrl('/new', RecipeEditor);

    editor.update({ title: 'Eggs', ingredientsText: '2 eggs', stepsText: 'Melt the butter and fry the eggs.' });
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelector('.checks')?.textContent).toContain(
      "Steps mention butter but the ingredients don't list it.",
    );
  });

  it('marks an imported recipe as adapted once we change its ingredients', async () => {
    const recipe = sampleRamen();
    recipe.origin = 'imported';
    const { harness, store } = await setupKitchen([recipe]);
    const editor = await harness.navigateByUrl('/r/ramen/edit', RecipeEditor);

    editor.update({ ingredientsText: editor['form']().ingredientsText + '\n1 tsp chili oil' });
    await editor.save();

    expect((await store.loadLibrary()).recipes[0].origin).toBe('adapted');
  });

  it('refuses to edit in the read-only demo', async () => {
    const { harness, state } = await setupKitchen([]);
    await state.openDemo();
    await harness.navigateByUrl('/r/weeknight-ramen/edit', RecipeEditor);
    expect(harness.routeNativeElement!.textContent).toContain('The demo is read-only');
    expect(harness.routeNativeElement!.querySelector('form')).toBeNull();
  });

  it('offers to restore edits autosaved from an earlier visit', async () => {
    localStorage.setItem(
      'other-modules-my-kitchen:draft:Test:new',
      JSON.stringify({
        savedAt: Date.now(),
        form: { ...emptyFormLike(), title: 'Half-typed soup' },
        madeBefore: true,
        lastMade: '',
      }),
    );
    const { harness } = await setupKitchen([]);
    const editor = await harness.navigateByUrl('/new', RecipeEditor);

    expect(editor['draftToRestore']()).not.toBeNull();
    editor.restoreDraft();
    expect(editor['form']().title).toBe('Half-typed soup');
  });
});

function emptyFormLike() {
  return {
    title: '',
    ingredientsText: '',
    stepsText: '',
    optionGroups: [],
    servings: '',
    servingsMax: '',
    yieldText: '',
    prepMinutes: '',
    cookMinutes: '',
    restMinutes: '',
    totalMinutes: '',
    tags: [],
    sourceUrl: '',
    sourceSiteName: '',
    sourceAuthor: '',
    description: '',
    notes: '',
    frequency: 'regular',
    trust: 'tested',
  };
}
