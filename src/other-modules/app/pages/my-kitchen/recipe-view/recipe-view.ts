import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { frequencyInfo, trustInfo } from '../../../core/data/recipe-statuses';
import { CookLogEntry } from '../../../core/models/CookLogEntry';
import { Recipe, RecipeOption, RecipeOptionGroup } from '../../../core/models/Recipe';
import { RecipeIngredient } from '../../../core/models/RecipeIngredient';
import { KitchenImage } from '../kitchen-image/kitchen-image';
import { deleteCookEntry, optionNames } from '../lib/cook-log';
import { formatQuantity } from '../lib/format';
import { daysBetween, lastMadeDate } from '../lib/library-filter';
import { localDateString } from '../lib/recipe-id';
import { scaleIngredient } from '../lib/recipe-scaler';
import { MadeItSheet } from '../made-it-sheet/made-it-sheet';
import { KitchenStateService } from '../store/kitchen-state.service';

interface SelectedOptionSection {
  group: RecipeOptionGroup;
  option: RecipeOption;
}

/** Batch multipliers offered when a recipe has no servings count. */
const BATCH_STEPS = [0.5, 1, 1.5, 2, 3, 4];

@Component({
  selector: 'app-kitchen-recipe-view',
  imports: [RouterLink, KitchenImage, MadeItSheet],
  templateUrl: './recipe-view.html',
  styleUrl: './recipe-view.scss',
})
export class RecipeView {
  protected readonly state = inject(KitchenStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  protected readonly recipe = computed(() => this.state.recipe(this.id()));

  /** Selected option ids per option group, starting from the recipe's defaults. */
  protected readonly selected = signal<Record<string, string[]>>({});
  /** Target servings (recipes with a servings count) or batch multiplier (recipes without). */
  protected readonly servings = signal(1);
  protected readonly batch = signal(1);

  protected readonly factor = computed(() => {
    const recipe = this.recipe();
    return recipe?.servings ? this.servings() / recipe.servings : this.batch();
  });

  protected readonly selectedOptionIds = computed(() => Object.values(this.selected()).flat());

  protected readonly selectedSections = computed<SelectedOptionSection[]>(() => {
    const recipe = this.recipe();
    if (!recipe) return [];
    const selected = this.selected();
    return recipe.optionGroups.flatMap((group) =>
      group.options
        .filter((option) => (selected[group.id] ?? []).includes(option.id))
        .map((option) => ({ group, option })),
    );
  });

  protected readonly cover = computed(() => {
    const recipe = this.recipe();
    return recipe ? (recipe.images.find((i) => i.isCover) ?? recipe.images[0]) : undefined;
  });

  protected readonly gallery = computed(() => {
    const recipe = this.recipe();
    const cover = this.cover();
    return recipe ? recipe.images.filter((i) => i !== cover) : [];
  });

  protected readonly times = computed(() => {
    const r = this.recipe();
    if (!r) return [];
    return [
      ['Prep', r.prepMinutes],
      ['Cook', r.cookMinutes],
      ['Rest', r.restMinutes],
      ['Total', r.totalMinutes],
    ]
      .filter(([, minutes]) => minutes)
      .map(([label, minutes]) => ({ label: label as string, text: formatMinutes(minutes as number) }));
  });

  protected readonly lastMade = computed(() => {
    const recipe = this.recipe();
    const date = recipe ? lastMadeDate(recipe) : undefined;
    if (!date) return '';
    const days = daysBetween(date, localDateString());
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago (${date})`;
  });

  /** Newest first for display. */
  protected readonly cookLog = computed(() => [...(this.recipe()?.household.cookLog ?? [])].reverse());

  protected readonly nutrition = computed(() => {
    const n = this.recipe()?.sourceNutrition;
    if (!n) return [];
    return [
      ['Calories', n.calories, ''],
      ['Protein', n.proteinG, 'g'],
      ['Carbs', n.carbsG, 'g'],
      ['Fat', n.fatG, 'g'],
      ['Saturated fat', n.saturatedFatG, 'g'],
      ['Sugar', n.sugarG, 'g'],
      ['Fiber', n.fiberG, 'g'],
      ['Sodium', n.sodiumMg, 'mg'],
      ['Cholesterol', n.cholesterolMg, 'mg'],
    ]
      .filter(([, value]) => value !== undefined)
      .map(([label, value, unit]) => ({ label: label as string, text: `${value}${unit}` }));
  });

  protected readonly ratingValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  /** 'new' = logging a cook; an entry = editing it; null = closed. */
  protected readonly sheet = signal<'new' | CookLogEntry | null>(null);

  private initializedFor = '';

  constructor() {
    effect(() => {
      const recipe = this.recipe();
      if (!recipe || this.initializedFor === recipe.id) return;
      this.initializedFor = recipe.id;
      this.selected.set(Object.fromEntries(recipe.optionGroups.map((g) => [g.id, [...g.defaultOptionIds]])));
      this.servings.set(recipe.servings ?? 1);
      this.batch.set(1);
    });
  }

  isSelected(group: RecipeOptionGroup, option: RecipeOption): boolean {
    return (this.selected()[group.id] ?? []).includes(option.id);
  }

  toggleOption(group: RecipeOptionGroup, option: RecipeOption): void {
    this.selected.update((current) => {
      const ids = current[group.id] ?? [];
      const next =
        group.kind === 'pickOne'
          ? ids.includes(option.id)
            ? []
            : [option.id]
          : ids.includes(option.id)
            ? ids.filter((id) => id !== option.id)
            : [...ids, option.id];
      return { ...current, [group.id]: next };
    });
  }

  changeServings(delta: number): void {
    this.servings.update((s) => Math.max(1, s + delta));
  }

  changeBatch(delta: number): void {
    const index = BATCH_STEPS.indexOf(this.batch());
    const next = BATCH_STEPS[Math.min(BATCH_STEPS.length - 1, Math.max(0, index + delta))];
    this.batch.set(next);
  }

  batchLabel(): string {
    return `×${formatQuantity(this.batch())}`;
  }

  line(item: RecipeIngredient): string {
    return scaleIngredient(item, this.factor());
  }

  cookQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (Math.abs(this.factor() - 1) > 1e-9) params['x'] = String(Math.round(this.factor() * 10000) / 10000);
    const options = this.selectedOptionIds();
    if (options.length) params['opts'] = options.join(',');
    return params;
  }

  servingsMade(): number | undefined {
    const recipe = this.recipe();
    return recipe?.servings ? this.servings() : undefined;
  }

  frequencyLabel(recipe: Recipe): string {
    return frequencyInfo(recipe.household.frequency).label;
  }

  trustLabel(recipe: Recipe): string {
    return trustInfo(recipe.household.trust).label;
  }

  tagLabel(tag: string): string {
    return tag.replace(':', ': ');
  }

  entryOptions(recipe: Recipe, entry: CookLogEntry): string {
    return optionNames(recipe, entry.optionIds).join(', ');
  }

  async setRating(value: number): Promise<void> {
    const recipe = this.recipe();
    if (!recipe || this.state.readOnly() || this.saving()) return;
    const household = { ...recipe.household };
    // Clicking the current rating again clears it.
    if (household.rating === value) delete household.rating;
    else household.rating = value;
    await this.save({ ...recipe, household });
  }

  async deleteEntry(entry: CookLogEntry): Promise<void> {
    const recipe = this.recipe();
    if (!recipe || this.state.readOnly()) return;
    if (!confirm(`Delete the cook from ${entry.date}?`)) return;
    await this.save(deleteCookEntry(recipe, entry.id));
  }

  async deleteRecipe(): Promise<void> {
    const recipe = this.recipe();
    if (!recipe || this.state.readOnly()) return;
    if (!confirm(`Delete "${recipe.title}"? It will be moved to the _trash folder.`)) return;
    try {
      await this.state.deleteRecipe(recipe.id);
      await this.router.navigate(['../..'], { relativeTo: this.route });
    } catch {
      this.errorMessage.set('Could not delete the recipe.');
    }
  }

  private async save(recipe: Recipe): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      await this.state.saveRecipe(recipe);
    } catch {
      this.errorMessage.set('Could not save. Check that the folder is still available.');
    } finally {
      this.saving.set(false);
    }
  }
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
