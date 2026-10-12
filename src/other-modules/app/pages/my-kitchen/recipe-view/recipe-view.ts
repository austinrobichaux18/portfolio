import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { frequencyInfo, trustInfo } from '../../../core/data/recipe-statuses';
import { Recipe, RecipeOption, RecipeOptionGroup } from '../../../core/models/Recipe';
import { KitchenImage } from '../kitchen-image/kitchen-image';
import { daysBetween, lastMadeDate } from '../lib/library-filter';
import { localDateString } from '../lib/recipe-id';
import { KitchenStateService } from '../store/kitchen-state.service';

interface SelectedOptionSection {
  group: RecipeOptionGroup;
  option: RecipeOption;
}

@Component({
  selector: 'app-kitchen-recipe-view',
  imports: [RouterLink, KitchenImage],
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

  protected readonly ratingValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  private initializedFor = '';

  constructor() {
    effect(() => {
      const recipe = this.recipe();
      if (!recipe || this.initializedFor === recipe.id) return;
      this.initializedFor = recipe.id;
      this.selected.set(
        Object.fromEntries(recipe.optionGroups.map((g) => [g.id, [...g.defaultOptionIds]])),
      );
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

  frequencyLabel(recipe: Recipe): string {
    return frequencyInfo(recipe.household.frequency).label;
  }

  trustLabel(recipe: Recipe): string {
    return trustInfo(recipe.household.trust).label;
  }

  tagLabel(tag: string): string {
    return tag.replace(':', ': ');
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
