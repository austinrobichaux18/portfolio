import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Recipe } from '../../../core/models/Recipe';
import { scaleIngredient } from '../lib/recipe-scaler';
import { MadeItSheet } from '../made-it-sheet/made-it-sheet';
import { KitchenStateService } from '../store/kitchen-state.service';

export interface CookStep {
  /** Group or option label shown above the step ("Sauce", "Soft egg · Toppings"). */
  section?: string;
  note?: string;
  text: string;
}

export interface CookIngredient {
  key: string;
  section?: string;
  text: string;
  optional?: boolean;
}

/** Base steps in order, then a section per selected option. */
export function cookSteps(recipe: Recipe, optionIds: string[]): CookStep[] {
  const base = recipe.stepGroups.flatMap((group) => group.steps.map((step) => ({ section: group.name, text: step.text })));
  const extra = recipe.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => optionIds.includes(option.id))
      .flatMap((option) =>
        option.steps.map((step, i) => ({
          section: `${option.name} · ${group.name}`,
          note: i === 0 ? option.note : undefined,
          text: step.text,
        })),
      ),
  );
  return [...base, ...extra];
}

export function cookIngredients(recipe: Recipe, optionIds: string[], factor: number): CookIngredient[] {
  const base = recipe.ingredientGroups.flatMap((group, gi) =>
    group.items.map((item, ii) => ({
      key: `b${gi}-${ii}`,
      section: group.name,
      text: scaleIngredient(item, factor),
      optional: item.optional,
    })),
  );
  const extra = recipe.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => optionIds.includes(option.id))
      .flatMap((option) =>
        option.ingredients.map((item, ii) => ({
          key: `o-${group.id}-${option.id}-${ii}`,
          section: option.name,
          text: scaleIngredient(item, factor),
          optional: item.optional,
        })),
      ),
  );
  return [...base, ...extra];
}

/** Big text, one step at a time, ingredient checklist, and the screen stays awake. */
@Component({
  selector: 'app-kitchen-cook-mode',
  imports: [RouterLink, MadeItSheet],
  templateUrl: './cook-mode.html',
  styleUrl: './cook-mode.scss',
})
export class CookMode implements OnInit, OnDestroy {
  protected readonly state = inject(KitchenStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly recipe = computed(() => this.state.recipe(this.id));

  protected readonly factor = (() => {
    const x = Number(this.route.snapshot.queryParamMap.get('x'));
    return Number.isFinite(x) && x > 0 ? x : 1;
  })();
  protected readonly optionIds = (this.route.snapshot.queryParamMap.get('opts') ?? '').split(',').filter(Boolean);

  protected readonly steps = computed(() => {
    const recipe = this.recipe();
    return recipe ? cookSteps(recipe, this.optionIds) : [];
  });
  protected readonly ingredients = computed(() => {
    const recipe = this.recipe();
    return recipe ? cookIngredients(recipe, this.optionIds, this.factor) : [];
  });

  /** Index into steps; steps.length means the "all done" screen. */
  protected readonly index = signal(0);
  protected readonly checked = signal<Set<string>>(new Set());
  protected readonly showSheet = signal(false);
  protected readonly wakeLockActive = signal(false);

  protected readonly current = computed(() => this.steps()[this.index()]);
  protected readonly done = computed(() => this.index() >= this.steps().length);

  private wakeLock: WakeLockSentinel | null = null;
  private readonly onVisibilityChange = () => {
    // The browser drops the lock when the tab is hidden; take it again on return.
    if (document.visibilityState === 'visible') this.requestWakeLock();
  };

  ngOnInit(): void {
    this.requestWakeLock();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.wakeLock?.release().catch(() => {});
    this.wakeLock = null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.showSheet()) return;
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName) && event.key === ' ') return;
    if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'Escape') {
      this.exit();
    }
  }

  next(): void {
    this.index.update((i) => Math.min(this.steps().length, i + 1));
  }

  previous(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  goTo(i: number): void {
    this.index.set(i);
  }

  toggleIngredient(key: string): void {
    this.checked.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  servingsMade(): number | undefined {
    const recipe = this.recipe();
    return recipe?.servings ? Math.round(recipe.servings * this.factor * 100) / 100 : undefined;
  }

  onSheetClosed(result: 'saved' | 'cancelled'): void {
    this.showSheet.set(false);
    if (result === 'saved') this.exit();
  }

  exit(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  private async requestWakeLock(): Promise<void> {
    try {
      if (!('wakeLock' in navigator) || this.wakeLock) return;
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLockActive.set(true);
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
        this.wakeLockActive.set(false);
      });
    } catch {
      // Not allowed (e.g. battery saver); cooking still works, the screen may just dim.
      this.wakeLockActive.set(false);
    }
  }
}
