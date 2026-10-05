import { Component, HostListener, computed, signal } from '@angular/core';
import { GRAMMAR_CATEGORIES } from '../../core/data/grammar-points';
import { GrammarCategory, GrammarPoint } from '../../core/models/GrammarPoint';

interface Flashcard {
  categoryLabel: string;
  point: GrammarPoint;
}

type ViewMode = 'reference' | 'practice';
type PracticeState = 'active' | 'finished';

const FLASHCARDS: Flashcard[] = GRAMMAR_CATEGORIES.flatMap((category) =>
  category.points.map((point) => ({ categoryLabel: category.label, point })),
);

function shuffledIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

@Component({
  selector: 'app-grammar',
  imports: [],
  templateUrl: './grammar.html',
  styleUrl: './grammar.scss',
})
export class Grammar {
  readonly categories = GRAMMAR_CATEGORIES;

  viewMode = signal<ViewMode>('reference');

  search = signal('');

  filteredCategories = computed<GrammarCategory[]>(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) return this.categories;

    return this.categories
      .map((category) => ({
        ...category,
        points: category.points.filter(
          (p) =>
            p.term.toLowerCase().includes(query) ||
            p.summary.toLowerCase().includes(query) ||
            (p.examples ?? []).some(
              (ex) =>
                ex.japanese.toLowerCase().includes(query) ||
                (ex.translation ?? '').toLowerCase().includes(query),
            ),
        ),
      }))
      .filter((category) => category.points.length > 0);
  });

  resultCount = computed(() =>
    this.filteredCategories().reduce((sum, c) => sum + c.points.length, 0),
  );

  /** True when this point starts a new group from the one before it — used to force a line break between groups in the reference grid. */
  isGroupBreak(points: GrammarPoint[], index: number): boolean {
    if (index === 0) return false;
    const point = points[index];
    const previous = points[index - 1];
    return !!point.group && point.group !== previous.group;
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'practice' && this.deck().length === 0) {
      this.startPractice();
    }
  }

  readonly totalCards = FLASHCARDS.length;

  practiceState = signal<PracticeState>('active');

  deck = signal<number[]>([]);

  currentCardIndex = signal(0);

  revealed = signal(false);

  knewCount = signal(0);

  missedCount = signal(0);

  currentCard = computed<Flashcard | null>(() => {
    const order = this.deck();
    const i = this.currentCardIndex();
    if (i >= order.length) return null;
    return FLASHCARDS[order[i]];
  });

  progressDisplay = computed(() => `${Math.min(this.currentCardIndex() + 1, this.totalCards)} / ${this.totalCards}`);

  accuracyPercent = computed(() => {
    const total = this.knewCount() + this.missedCount();
    return total > 0 ? Math.round((this.knewCount() / total) * 100) : 0;
  });

  startPractice(): void {
    this.deck.set(shuffledIndices(FLASHCARDS.length));
    this.currentCardIndex.set(0);
    this.revealed.set(false);
    this.knewCount.set(0);
    this.missedCount.set(0);
    this.practiceState.set('active');
  }

  revealAnswer(): void {
    this.revealed.set(true);
  }

  markKnew(): void {
    this.knewCount.update((n) => n + 1);
    this.advanceCard();
  }

  markMissed(): void {
    this.missedCount.update((n) => n + 1);
    this.advanceCard();
  }

  /** Space reveals the answer; 1 marks it missed and 3 marks it knew, once revealed — hands-off-mouse practice. */
  @HostListener('document:keydown', ['$event'])
  onPracticeKeyDown(event: KeyboardEvent): void {
    if (this.viewMode() !== 'practice' || this.practiceState() !== 'active' || !this.currentCard()) {
      return;
    }

    if (!this.revealed()) {
      if (event.key === ' ') {
        event.preventDefault();
        this.revealAnswer();
      }
      return;
    }

    if (event.key === '1') {
      event.preventDefault();
      this.markMissed();
    } else if (event.key === '3') {
      event.preventDefault();
      this.markKnew();
    }
  }

  private advanceCard(): void {
    this.revealed.set(false);
    const next = this.currentCardIndex() + 1;
    if (next >= this.deck().length) {
      this.practiceState.set('finished');
    } else {
      this.currentCardIndex.set(next);
    }
  }
}
