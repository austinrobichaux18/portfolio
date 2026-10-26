import { Component, computed, effect, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AI_RECIPE_PROMPT } from '../../../core/data/ai-recipe-prompt';
import { FREQUENCIES, TAG_PREFIXES, TRUST_LEVELS } from '../../../core/data/recipe-statuses';
import { Recipe, RecipeFrequency, RecipeImage, RecipeTrust } from '../../../core/models/Recipe';
import { Nutrition } from '../../../core/models/Nutrition';
import { RecipeIngredient } from '../../../core/models/RecipeIngredient';
import { KitchenImage } from '../kitchen-image/kitchen-image';
import { formatAmount } from '../lib/format';
import { applyForm, formFromRecipe, normalizeTags, OptionForm, OptionGroupForm, RecipeForm } from '../lib/recipe-form';
import { localDateString, shortRandomId } from '../lib/recipe-id';
import { checkRecipe } from '../lib/recipe-checks';
import { newRecipe } from '../lib/recipe-loader';
import { PastedRecipe, splitPastedRecipe } from '../lib/paste-splitter';
import { parseRecipeJson } from '../lib/recipe-json';
import { parseIngredientsText } from '../lib/recipe-text';
import { KitchenStateService, PreparedImage } from '../store/kitchen-state.service';
import { HasUnsavedChanges } from '../unsaved-changes.guard';

interface EditorImage {
  image: RecipeImage;
  /** Set for photos added in this session (not written to the folder until save). */
  prepared?: PreparedImage;
  previewUrl?: string;
}

interface StoredDraft {
  savedAt: number;
  form: RecipeForm;
  madeBefore: boolean;
  lastMade: string;
}

interface PreviewLine {
  heading?: string;
  raw?: string;
  amount?: string;
  name?: string;
  prep?: string;
  flags?: string[];
  warning?: string;
}

const DRAFT_KEY_PREFIX = 'other-modules-my-kitchen:draft:';

function emptyForm(): RecipeForm {
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

function emptyOption(): OptionForm {
  return { name: '', ingredientsText: '', stepsText: '', note: '', isDefault: false };
}

@Component({
  selector: 'app-kitchen-recipe-editor',
  imports: [RouterLink, KitchenImage],
  templateUrl: './recipe-editor.html',
  styleUrl: './recipe-editor.scss',
})
export class RecipeEditor implements HasUnsavedChanges, OnDestroy {
  protected readonly state = inject(KitchenStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly frequencies = FREQUENCIES;
  protected readonly trustLevels = TRUST_LEVELS;

  private readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly isNew = this.id === null;
  /** The saved recipe being edited (undefined for a new one). */
  protected readonly base: Recipe | undefined = this.id ? this.state.recipe(this.id) : undefined;
  protected readonly notFound = !this.isNew && !this.base;

  protected readonly form = signal<RecipeForm>(this.base ? formFromRecipe(this.base) : emptyForm());
  protected readonly madeBefore = signal(true);
  protected readonly lastMade = signal('');
  protected readonly images = signal<EditorImage[]>((this.base?.images ?? []).map((image) => ({ image })));
  private removedImages: RecipeImage[] = [];

  protected readonly showPaste = signal(this.isNew && this.route.snapshot.queryParamMap.has('paste'));
  protected readonly pasteText = signal('');
  protected readonly showDetails = signal(false);
  protected readonly aiPrompt = AI_RECIPE_PROMPT;
  protected readonly promptCopied = signal(false);
  protected readonly tagDraft = signal('');
  protected readonly saving = signal(false);
  protected readonly addingPhotos = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly draftToRestore = signal<StoredDraft | null>(null);
  /** Nutrition read from a pasted recipe; saved as the recipe's source nutrition. */
  protected readonly pastedNutrition = signal<Nutrition | null>(null);
  protected readonly today = localDateString();

  private readonly draftKey = `${DRAFT_KEY_PREFIX}${this.state.store()?.label ?? ''}:${this.id ?? 'new'}`;
  private initialSnapshot = '';
  private saved = false;
  private draftTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly snapshot = computed(() =>
    JSON.stringify({
      form: this.form(),
      images: this.images().map((i) => i.image),
      madeBefore: this.madeBefore(),
      lastMade: this.lastMade(),
    }),
  );

  protected readonly dirty = computed(() => this.snapshot() !== this.initialSnapshot);

  /** Live parse of the ingredient box, shown next to it so mistakes are caught while typing. */
  protected readonly preview = computed<PreviewLine[]>(() =>
    parseIngredientsText(this.form().ingredientsText, this.base?.ingredientGroups ?? []).flatMap((group) => [
      ...(group.name ? [{ heading: group.name }] : []),
      ...group.items.map((item) => this.previewLine(item)),
    ]),
  );

  private readonly previewBase: Recipe = this.base ?? newRecipe('preview', '');

  /** Warnings about the recipe as currently typed (never block saving). */
  protected readonly checks = computed(() => {
    const form = this.form();
    if (!form.ingredientsText.trim() && !form.stepsText.trim()) return [];
    return checkRecipe(applyForm(form, this.previewBase));
  });

  protected readonly tagSuggestions = computed(() => {
    const existing = this.state.allTags();
    const prefixes = TAG_PREFIXES.map((p) => `${p}:`);
    const chosen = this.form().tags;
    return [...prefixes, ...existing].filter((t) => !chosen.includes(t));
  });

  constructor() {
    this.initialSnapshot = this.snapshot();
    this.loadStoredDraft();

    // Autosave unsaved edits to this browser, so a closed tab or crash doesn't lose them.
    effect(() => {
      const snapshot = this.snapshot();
      if (snapshot === this.initialSnapshot || this.saved) return;
      clearTimeout(this.draftTimer);
      this.draftTimer = setTimeout(() => this.writeStoredDraft(), 800);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.draftTimer);
    // Leaving past the unsaved-changes prompt means the edits were discarded on purpose. With no
    // edits, keep any older stored draft so it's still offered next time.
    if (!this.saved && this.dirty()) this.removeStoredDraft();
    for (const image of this.images()) if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && this.dirty();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      this.writeStoredDraft();
      event.preventDefault();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
  }

  /** Pasting an image anywhere on the editor adds it as a photo; text pastes are left alone. */
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    event.preventDefault();
    this.addPhotos(files);
  }

  update(patch: Partial<RecipeForm>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  // --- Quick add ---------------------------------------------------------------------------------

  applyPaste(): void {
    this.errorMessage.set('');
    const json = parseRecipeJson(this.pasteText());
    if (json && !json.ok) {
      this.errorMessage.set(json.error);
      return;
    }
    const pasted: PastedRecipe = json ? json.recipe : splitPastedRecipe(this.pasteText());
    if (json?.ok) {
      const imported = json.recipe;
      this.form.update((f) => ({
        ...f,
        optionGroups: imported.optionGroups.length ? imported.optionGroups : f.optionGroups,
        tags: imported.tags.length ? normalizeTags([...f.tags, ...imported.tags]) : f.tags,
        yieldText: imported.yieldText ?? f.yieldText,
        restMinutes: imported.restMinutes ? String(imported.restMinutes) : f.restMinutes,
        description: imported.description ?? f.description,
        sourceUrl: imported.source?.url ?? f.sourceUrl,
        sourceSiteName: imported.source?.siteName ?? f.sourceSiteName,
        sourceAuthor: imported.source?.author ?? f.sourceAuthor,
      }));
    }
    this.form.update((f) => ({
      ...f,
      title: f.title.trim() ? f.title : (pasted.title ?? ''),
      ingredientsText: pasted.ingredientsText || f.ingredientsText,
      stepsText: pasted.stepsText || f.stepsText,
      notes: pasted.notesText ? [f.notes, pasted.notesText].filter(Boolean).join('\n') : f.notes,
      servings: pasted.servings ? String(pasted.servings) : f.servings,
      prepMinutes: pasted.prepMinutes ? String(pasted.prepMinutes) : f.prepMinutes,
      cookMinutes: pasted.cookMinutes ? String(pasted.cookMinutes) : f.cookMinutes,
      totalMinutes: pasted.totalMinutes ? String(pasted.totalMinutes) : f.totalMinutes,
    }));
    if (pasted.nutrition) this.pastedNutrition.set(pasted.nutrition);
    this.showPaste.set(false);
    this.pasteText.set('');
  }

  async copyAiPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.aiPrompt);
      this.promptCopied.set(true);
      setTimeout(() => this.promptCopied.set(false), 2500);
    } catch {
      // Clipboard blocked: the prompt is shown in full so it can be selected by hand.
      this.promptCopied.set(false);
    }
  }

  // --- Tags --------------------------------------------------------------------------------------

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  addTag(): void {
    const draft = this.tagDraft().trim();
    // A bare prefix ("cuisine:") from the suggestions is a starting point, not a tag.
    if (!draft || draft.endsWith(':')) return;
    this.update({ tags: normalizeTags([...this.form().tags, draft]) });
    this.tagDraft.set('');
  }

  removeTag(tag: string): void {
    this.update({ tags: this.form().tags.filter((t) => t !== tag) });
  }

  // --- Options -----------------------------------------------------------------------------------

  addOptionGroup(): void {
    this.update({
      optionGroups: [...this.form().optionGroups, { name: '', kind: 'pickAny', options: [emptyOption()] }],
    });
  }

  updateGroup(groupIndex: number, patch: Partial<OptionGroupForm>): void {
    this.update({
      optionGroups: this.form().optionGroups.map((g, i) => {
        if (i !== groupIndex) return g;
        const next = { ...g, ...patch };
        // Switching to pick-one keeps only the first default.
        if (patch.kind === 'pickOne') {
          let seen = false;
          next.options = next.options.map((o) => {
            const keep = o.isDefault && !seen;
            if (o.isDefault) seen = true;
            return { ...o, isDefault: keep };
          });
        }
        return next;
      }),
    });
  }

  removeGroup(groupIndex: number): void {
    this.update({ optionGroups: this.form().optionGroups.filter((_, i) => i !== groupIndex) });
  }

  addOption(groupIndex: number): void {
    this.updateGroup(groupIndex, { options: [...this.form().optionGroups[groupIndex].options, emptyOption()] });
  }

  updateOption(groupIndex: number, optionIndex: number, patch: Partial<OptionForm>): void {
    const group = this.form().optionGroups[groupIndex];
    const options = group.options.map((o, i) => {
      if (i === optionIndex) return { ...o, ...patch };
      // Pick-one groups have a single default: choosing one clears the others.
      if (patch.isDefault && group.kind === 'pickOne') return { ...o, isDefault: false };
      return o;
    });
    this.updateGroup(groupIndex, { options });
  }

  removeOption(groupIndex: number, optionIndex: number): void {
    const group = this.form().optionGroups[groupIndex];
    this.updateGroup(groupIndex, { options: group.options.filter((_, i) => i !== optionIndex) });
  }

  // --- Photos ------------------------------------------------------------------------------------

  onFilesChosen(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.addPhotos(files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'));
    this.addPhotos(files);
  }

  async addPhotos(files: File[]): Promise<void> {
    if (!files.length || this.state.readOnly()) return;
    this.addingPhotos.set(true);
    this.errorMessage.set('');
    try {
      for (const file of files) {
        const existing = [
          ...this.images().flatMap((i) => [i.image.file, i.image.thumb]),
          ...this.removedImages.flatMap((i) => [i.file, i.thumb]),
        ];
        const prepared = await this.state.prepareImage(file, existing);
        const isFirst = this.images().length === 0;
        if (isFirst) prepared.image.isCover = true;
        this.images.update((list) => [
          ...list,
          { image: prepared.image, prepared, previewUrl: URL.createObjectURL(prepared.thumb) },
        ]);
      }
    } catch {
      this.errorMessage.set("Couldn't read one of those images.");
    } finally {
      this.addingPhotos.set(false);
    }
  }

  setCover(index: number): void {
    this.images.update((list) =>
      list.map((item, i) => {
        const image = { ...item.image };
        if (i === index) image.isCover = true;
        else delete image.isCover;
        return { ...item, image };
      }),
    );
  }

  moveImage(index: number, delta: number): void {
    this.images.update((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  removeImage(index: number): void {
    const item = this.images()[index];
    if (!item) return;
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (!item.prepared) this.removedImages.push(item.image);
    this.images.update((list) => {
      const next = list.filter((_, i) => i !== index);
      // Keep a cover if there are photos left.
      if (item.image.isCover && next.length) {
        next[0] = { ...next[0], image: { ...next[0].image, isCover: true } };
      }
      return next;
    });
  }

  // --- Drafts ------------------------------------------------------------------------------------

  restoreDraft(): void {
    const draft = this.draftToRestore();
    if (!draft) return;
    this.form.set(draft.form);
    this.madeBefore.set(draft.madeBefore);
    this.lastMade.set(draft.lastMade);
    this.draftToRestore.set(null);
  }

  discardDraft(): void {
    this.draftToRestore.set(null);
    this.removeStoredDraft();
  }

  // --- Save --------------------------------------------------------------------------------------

  async save(): Promise<void> {
    if (this.saving() || this.notFound || this.state.readOnly()) return;
    const form = this.form();
    if (!form.title.trim()) {
      this.errorMessage.set('Give the recipe a title — that is the only thing required.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    try {
      let formToApply = form;
      let base = this.base;
      if (!base) {
        // New recipe: family recipes we already make start as tested; others as "want to try".
        const madeBefore = this.madeBefore();
        formToApply = {
          ...form,
          trust: madeBefore ? 'tested' : 'untested',
          frequency: madeBefore ? form.frequency : 'want-to-try',
        };
        base = this.state.draftRecipe(form.title.trim(), {});
      }

      const recipe = applyForm(formToApply, base);
      // Photos may have been resized (and renamed) in the background since the editor opened.
      recipe.images = this.images().map((i) => this.state.currentImage(recipe.id, i.image));
      const nutrition = this.pastedNutrition();
      if (nutrition) recipe.sourceNutrition = nutrition;
      // Our own changes to an imported recipe's ingredients or steps make it our adaptation.
      if (base.origin === 'imported') {
        const original = formFromRecipe(base);
        if (original.ingredientsText !== form.ingredientsText || original.stepsText !== form.stepsText) {
          recipe.origin = 'adapted';
        }
      }
      if (this.isNew && this.madeBefore() && this.lastMade()) {
        recipe.household.cookLog = [
          ...recipe.household.cookLog,
          {
            id: `log-${shortRandomId()}`,
            date: this.lastMade(),
            optionIds: recipe.optionGroups.flatMap((g) => g.defaultOptionIds),
            note: 'Logged when the recipe was added',
          },
        ];
      }

      const saved = await this.state.saveRecipe(recipe, {
        added: this.images().flatMap((i) => (i.prepared ? [i.prepared] : [])),
        removed: this.removedImages.map((image) => this.state.currentImage(recipe.id, image)),
      });

      this.saved = true;
      this.removeStoredDraft();
      await this.router.navigate(this.isNew ? ['../r', saved.id] : ['..'], { relativeTo: this.route });
    } catch {
      this.errorMessage.set('Could not save. Check that the folder is still available.');
    } finally {
      this.saving.set(false);
    }
  }

  // --- Helpers -----------------------------------------------------------------------------------

  tagLabel(tag: string): string {
    return tag.replace(':', ': ');
  }

  setFrequency(value: string): void {
    this.update({ frequency: value as RecipeFrequency });
  }

  setTrust(value: string): void {
    this.update({ trust: value as RecipeTrust });
  }

  private previewLine(item: RecipeIngredient): PreviewLine {
    const flags = [
      ...(item.optional ? ['optional'] : []),
      ...(item.toTaste ? ['to taste'] : []),
      ...(item.scales === false ? ['no-scale'] : []),
      ...(item.packageQuantity ? [`${formatAmount(item.packageQuantity, undefined, item.packageUnit)} pkg`] : []),
      ...(item.ingredientId ? ['linked'] : []),
    ];
    const warning = !item.name
      ? "Couldn't find an ingredient name"
      : item.quantity === undefined && !item.toTaste
        ? 'No amount'
        : undefined;
    return {
      raw: item.raw,
      amount: formatAmount(item.quantity, item.quantityMax, item.unit),
      name: item.name,
      prep: item.prep,
      flags,
      warning,
    };
  }

  private loadStoredDraft(): void {
    try {
      const text = localStorage.getItem(this.draftKey);
      if (!text) return;
      const draft = JSON.parse(text) as StoredDraft;
      if (draft?.form && JSON.stringify(draft.form) !== JSON.stringify(this.form())) {
        this.draftToRestore.set(draft);
      }
    } catch {
      // Storage unavailable or a corrupt draft; nothing to offer.
    }
  }

  private writeStoredDraft(): void {
    if (this.saved || !this.dirty()) return;
    const draft: StoredDraft = {
      savedAt: Date.now(),
      form: this.form(),
      madeBefore: this.madeBefore(),
      lastMade: this.lastMade(),
    };
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(draft));
    } catch {
      // Storage full or blocked; the unsaved-changes prompt still protects the edits.
    }
  }

  private removeStoredDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {
      // Ignore.
    }
  }
}
