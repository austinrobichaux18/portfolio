import { NgTemplateOutlet } from '@angular/common';
import { Component, HostListener, computed, signal } from '@angular/core';
import { REFERENCE_CATEGORIES } from '../../core/data/reference-charts';
import {
  FuriganaSegment,
  ReferenceCategory,
  ReferenceCellValue,
  ReferenceTable,
  ReferenceTableColumn,
  TileSize,
} from '../../core/models/ReferenceChart';

interface Flashcard {
  categoryLabel: string;
  tableTitle: string;
  front: ReferenceCellValue;
  backColumns: { label: ReferenceCellValue; value: ReferenceCellValue }[];
}

type ViewMode = 'reference' | 'practice';
type PracticeState = 'active' | 'finished';

function isSegments(value: ReferenceCellValue): value is FuriganaSegment[] {
  return Array.isArray(value);
}

/** Flattens a cell to plain text (kanji + reading) for case-insensitive search matching. */
function cellSearchText(value: ReferenceCellValue): string {
  if (!isSegments(value)) return value;
  return value.map((s) => `${s.text} ${s.reading ?? ''}`).join(' ');
}

function buildFlashcards(categories: ReferenceCategory[]): Flashcard[] {
  const cards: Flashcard[] = [];
  for (const category of categories) {
    for (const table of category.tables) {
      if (!table.practiceFrontKey) continue;
      const backColumnDefs: ReferenceTableColumn[] = table.columns.filter(
        (c) => c.key !== table.practiceFrontKey,
      );
      for (const row of table.rows) {
        cards.push({
          categoryLabel: category.label,
          tableTitle: table.title,
          front: row[table.practiceFrontKey],
          backColumns: backColumnDefs
            .filter((c) => {
              const value = row[c.key];
              return isSegments(value) ? value.length > 0 : !!value;
            })
            .map((c) => ({ label: c.label, value: row[c.key] })),
        });
      }
    }
  }
  return cards;
}

function shuffledIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

const FLASHCARDS: Flashcard[] = buildFlashcards(REFERENCE_CATEGORIES);

@Component({
  selector: 'app-reference-charts',
  imports: [NgTemplateOutlet],
  templateUrl: './reference-charts.html',
  styleUrl: './reference-charts.scss',
})
export class ReferenceCharts {
  readonly categories = REFERENCE_CATEGORIES;

  viewMode = signal<ViewMode>('reference');

  search = signal('');

  filteredCategories = computed<ReferenceCategory[]>(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) return this.categories;

    return this.categories
      .map((category) => {
        const categoryHeaderMatches = category.label.toLowerCase().includes(query);
        return {
          ...category,
          tables: category.tables
            .map((table) => {
              const headerMatches =
                categoryHeaderMatches || table.title.toLowerCase().includes(query);
              return {
                ...table,
                rows: headerMatches
                  ? table.rows
                  : table.rows.filter((row) =>
                      Object.values(row).some((value) =>
                        cellSearchText(value).toLowerCase().includes(query),
                      ),
                    ),
              };
            })
            .filter((table: ReferenceTable) => table.rows.length > 0),
        };
      })
      .filter((category) => category.tables.length > 0);
  });

  resultCount = computed(() =>
    this.filteredCategories().reduce(
      (sum, category) => sum + category.tables.reduce((tSum, table) => tSum + table.rows.length, 0),
      0,
    ),
  );

  isSearching = computed(() => this.search().trim().length > 0);

  /** Returns the furigana segments for a cell, or null for a plain-text cell — lets the template narrow via `@if (...; as segments)`. */
  segmentsOf(value: ReferenceCellValue): FuriganaSegment[] | null {
    return isSegments(value) ? value : null;
  }

  /** CSS class for a tile's width in the chart grid — defaults to 'full' when unset. */
  tileClass(size?: TileSize): string {
    return `tile tile-${size ?? 'full'}`;
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

  progressDisplay = computed(
    () => `${Math.min(this.currentCardIndex() + 1, this.totalCards)} / ${this.totalCards}`,
  );

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
    if (
      this.viewMode() !== 'practice' ||
      this.practiceState() !== 'active' ||
      !this.currentCard()
    ) {
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
