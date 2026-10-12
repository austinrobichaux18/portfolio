import { SAMPLE_RECIPES } from '../../../core/data/sample-recipes';
import { checkRecipe } from '../lib/recipe-checks';
import { loadRecipe, serializeRecipe } from '../lib/recipe-loader';
import { suggest } from '../lib/suggestions';
import { buildSampleRecipe, createDemoStore } from './demo-library';

const TODAY = new Date(2026, 9, 12);

describe('demo library', () => {
  it('has unique ids and at least one recipe with options', () => {
    const ids = SAMPLE_RECIPES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SAMPLE_RECIPES.some((s) => s.options?.some((g) => g.kind === 'pickOne'))).toBe(true);
    expect(SAMPLE_RECIPES.some((s) => s.options?.some((g) => g.kind === 'pickAny'))).toBe(true);
  });

  it.each(SAMPLE_RECIPES.map((s) => [s.id, s] as const))('%s loads cleanly and passes recipe checks', (_id, sample) => {
    const recipe = buildSampleRecipe(sample, TODAY);
    const result = loadRecipe(JSON.parse(serializeRecipe(recipe)), recipe.id);

    expect(result.ok && result.warnings).toEqual([]);
    expect(checkRecipe(recipe).filter((c) => c.level === 'warning')).toEqual([]);
    // Every ingredient line should parse to a name.
    const items = [...recipe.ingredientGroups.flatMap((g) => g.items), ...recipe.optionGroups.flatMap((g) => g.options.flatMap((o) => o.ingredients))];
    expect(items.filter((i) => !i.name).map((i) => i.raw)).toEqual([]);
  });

  it('dates cook logs relative to today so suggestions look current', () => {
    const ramen = buildSampleRecipe(SAMPLE_RECIPES[0], TODAY);
    expect(ramen.household.cookLog.map((e) => e.date)).toEqual(['2026-09-12', '2026-09-23', '2026-10-03']);

    const s = suggest(SAMPLE_RECIPES.map((sample) => buildSampleRecipe(sample, TODAY)), '2026-10-12');
    expect(s.overdue.length + s.unlogged.length + s.wantToTry.length).toBeGreaterThan(0);
  });

  it('is read-only', async () => {
    const store = createDemoStore(TODAY);
    expect(store.readOnly).toBe(true);
    expect((await store.loadLibrary()).recipes).toHaveLength(SAMPLE_RECIPES.length);
  });
});
