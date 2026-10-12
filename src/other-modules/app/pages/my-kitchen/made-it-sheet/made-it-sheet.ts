import { Component, computed, HostListener, inject, input, OnInit, output, signal } from '@angular/core';
import { FREQUENCIES } from '../../../core/data/recipe-statuses';
import { CookLogEntry } from '../../../core/models/CookLogEntry';
import { Recipe, RecipeFrequency } from '../../../core/models/Recipe';
import { applyMadeIt, MadeItInput, optionNames } from '../lib/cook-log';
import { localDateString } from '../lib/recipe-id';
import { KitchenStateService, PreparedImage } from '../store/kitchen-state.service';

const LOW_FIRST_RATING = 4;

/**
 * "Made it": logs a cook in two clicks — date, servings and options come prefilled — with an
 * optional one-tap rating, note and photo. The first cook of an untested recipe also asks whether
 * to keep it. Also edits an existing cook log entry when `entry` is given.
 */
@Component({
  selector: 'app-made-it-sheet',
  templateUrl: './made-it-sheet.html',
  styleUrl: './made-it-sheet.scss',
})
export class MadeItSheet implements OnInit {
  private readonly state = inject(KitchenStateService);

  readonly recipe = input.required<Recipe>();
  readonly servings = input<number | undefined>(undefined);
  readonly optionIds = input<string[]>([]);
  /** Edit this entry instead of adding a new one. */
  readonly entry = input<CookLogEntry | undefined>(undefined);

  readonly closed = output<'saved' | 'cancelled'>();

  protected readonly ratingValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly keepFrequencies = FREQUENCIES.filter((f) => f.id !== 'want-to-try' && f.id !== 'retired');
  protected readonly today = localDateString();

  protected readonly date = signal(this.today);
  protected readonly servingsText = signal('');
  protected readonly rating = signal<number | undefined>(undefined);
  protected readonly note = signal('');
  protected readonly keepChoice = signal<boolean | null>(null);
  protected readonly frequency = signal<RecipeFrequency>('occasional');
  protected readonly photo = signal<PreparedImage | null>(null);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly isEdit = computed(() => !!this.entry());
  protected readonly isFirstCook = computed(() => !this.entry() && this.recipe().household.trust === 'untested');
  protected readonly entryOptionIds = computed(() => this.entry()?.optionIds ?? this.optionIds());
  protected readonly optionLabels = computed(() => optionNames(this.recipe(), this.entryOptionIds()));

  /** A low first rating defaults to "not for us" unless the choice was made explicitly. */
  protected readonly keep = computed(() => {
    const choice = this.keepChoice();
    if (choice !== null) return choice;
    const rating = this.rating();
    return rating === undefined || rating > LOW_FIRST_RATING;
  });

  ngOnInit(): void {
    const entry = this.entry();
    if (entry) {
      this.date.set(entry.date);
      this.servingsText.set(entry.servingsMade ? String(entry.servingsMade) : '');
      this.rating.set(entry.rating);
      this.note.set(entry.note ?? '');
    } else {
      const servings = this.servings();
      this.servingsText.set(servings ? String(Math.round(servings * 100) / 100) : '');
    }
  }

  @HostListener('document:keydown.escape')
  cancel(): void {
    if (!this.saving()) this.closed.emit('cancelled');
  }

  toggleRating(value: number): void {
    this.rating.set(this.rating() === value ? undefined : value);
  }

  async onPhotoChosen(inputEl: HTMLInputElement): Promise<void> {
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    try {
      const recipe = this.recipe();
      const existing = [
        ...recipe.images.flatMap((i) => [i.file, i.thumb]),
        ...recipe.household.cookLog.flatMap((e) => e.images ?? []),
      ];
      const prepared = await this.state.prepareImage(file, existing);
      this.clearPhoto();
      this.photo.set(prepared);
      this.photoPreview.set(URL.createObjectURL(prepared.thumb));
    } catch {
      this.errorMessage.set("Couldn't read that image.");
    }
  }

  clearPhoto(): void {
    const preview = this.photoPreview();
    if (preview) URL.revokeObjectURL(preview);
    this.photo.set(null);
    this.photoPreview.set(null);
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.date())) {
      this.errorMessage.set('Pick a date.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const entry = this.entry();
      const photo = this.photo();
      const servings = Number(this.servingsText());
      const input: MadeItInput = {
        date: this.date(),
        servingsMade: Number.isFinite(servings) && servings > 0 ? servings : undefined,
        optionIds: this.entryOptionIds(),
        rating: this.rating(),
        // Adding: the tap is our overall rating. Editing an old entry only changes that entry.
        overallRating: entry ? undefined : this.rating(),
        note: this.note(),
        images: [...(entry?.images ?? []), ...(photo ? [photo.image.file] : [])],
        firstCook: this.isFirstCook() ? { keep: this.keep(), frequency: this.frequency() } : undefined,
      };
      const updated = applyMadeIt(this.recipe(), input, entry?.id);
      await this.state.saveRecipe(updated, { added: photo ? [photo] : [] });
      this.clearPhoto();
      this.closed.emit('saved');
    } catch {
      this.errorMessage.set('Could not save. Check that the folder is still available.');
    } finally {
      this.saving.set(false);
    }
  }
}
