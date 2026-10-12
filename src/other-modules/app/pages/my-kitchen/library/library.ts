import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FREQUENCIES, frequencyInfo, TRUST_LEVELS } from '../../../core/data/recipe-statuses';
import { Recipe, RecipeFrequency, RecipeTrust } from '../../../core/models/Recipe';
import { KitchenImage } from '../kitchen-image/kitchen-image';
import {
  daysBetween,
  EMPTY_FILTER,
  filterRecipes,
  isDraft,
  lastMadeDate,
  LibraryFilter,
  LibrarySort,
  sortLibrary,
} from '../lib/library-filter';
import { localDateString } from '../lib/recipe-id';
import { KitchenStateService } from '../store/kitchen-state.service';

interface TagGroup {
  prefix: string;
  tags: string[];
}

@Component({
  selector: 'app-kitchen-library',
  imports: [RouterLink, KitchenImage],
  templateUrl: './library.html',
  styleUrl: './library.scss',
})
export class Library {
  protected readonly state = inject(KitchenStateService);

  protected readonly frequencies = FREQUENCIES;
  protected readonly trustLevels = TRUST_LEVELS;
  protected readonly sortOptions: { id: LibrarySort; label: string }[] = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'rating', label: 'Rating' },
    { id: 'last-made', label: 'Last made' },
    { id: 'newest', label: 'Newest' },
    { id: 'title', label: 'A–Z' },
  ];

  protected readonly filter = signal<LibraryFilter>({ ...EMPTY_FILTER });
  protected readonly sort = signal<LibrarySort>('recommended');
  protected readonly showFilters = signal(false);

  protected readonly visibleRecipes = computed(() =>
    sortLibrary(filterRecipes(this.state.recipes(), this.filter()), this.sort()),
  );

  protected readonly activeFilterCount = computed(() => {
    const f = this.filter();
    return f.tags.length + (f.frequency ? 1 : 0) + (f.trust ? 1 : 0) + (f.minRating ? 1 : 0);
  });

  /** Tags grouped by prefix ("cuisine:…", "meal:…"); unprefixed tags go under "other". */
  protected readonly tagGroups = computed<TagGroup[]>(() => {
    const groups = new Map<string, string[]>();
    for (const tag of this.state.allTags()) {
      const prefix = tag.includes(':') ? tag.split(':')[0] : 'other';
      groups.set(prefix, [...(groups.get(prefix) ?? []), tag]);
    }
    return [...groups.entries()].map(([prefix, tags]) => ({ prefix, tags }));
  });

  private readonly today = localDateString();

  setQuery(query: string): void {
    this.filter.update((f) => ({ ...f, query }));
  }

  toggleTag(tag: string): void {
    this.filter.update((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  setFrequency(frequency: string): void {
    this.filter.update((f) => ({ ...f, frequency: frequency as RecipeFrequency | '' }));
  }

  setTrust(trust: string): void {
    this.filter.update((f) => ({ ...f, trust: trust as RecipeTrust | '' }));
  }

  setMinRating(value: string): void {
    this.filter.update((f) => ({ ...f, minRating: Number(value) || 0 }));
  }

  setSort(sort: string): void {
    this.sort.set(sort as LibrarySort);
  }

  clearFilters(): void {
    this.filter.update((f) => ({ ...EMPTY_FILTER, query: f.query }));
  }

  cover(recipe: Recipe): string | undefined {
    const image = recipe.images.find((i) => i.isCover) ?? recipe.images[0];
    return image?.thumb;
  }

  frequencyLabel(recipe: Recipe): string {
    return frequencyInfo(recipe.household.frequency).label;
  }

  isDraft(recipe: Recipe): boolean {
    return isDraft(recipe);
  }

  tagLabel(tag: string): string {
    return tag.includes(':') ? tag.split(':').slice(1).join(':') : tag;
  }

  lastMadeLabel(recipe: Recipe): string {
    const date = lastMadeDate(recipe);
    if (!date) return '';
    const days = daysBetween(date, this.today);
    if (days <= 0) return 'Made today';
    if (days === 1) return 'Made yesterday';
    return `Made ${days} days ago`;
  }
}
