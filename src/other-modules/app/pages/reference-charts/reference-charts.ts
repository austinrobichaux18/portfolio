import { DatePipe, NgTemplateOutlet } from '@angular/common';
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
import { ReferenceSessionMissedCard, ReferenceSessionSummary } from '../../core/models/ReferenceSessionSummary';
import { ReferenceCardStatsMap } from '../../core/models/ReferenceCardStats';
import {
  loadCardStats,
  loadHistory,
  loadSelectedTableIds,
  mergeSessionIntoStats,
  saveCardStats,
  saveHistory,
  saveSelectedTableIds,
} from './reference-charts-storage';

interface Flashcard {
  id: string;
  tableId: string;
  categoryId: string;
  categoryLabel: string;
  tableTitle: string;
  front: ReferenceCellValue;
  backColumns: { label: ReferenceCellValue; value: ReferenceCellValue }[];
}

type ViewMode = 'reference' | 'practice';
type PracticeState = 'idle' | 'active' | 'finished';
type TileBadge = 'mastered' | 'struggling' | null;

const MIN_ATTEMPTS_FOR_RETENTION = 3;
// A flat cutoff naturally gives the right shape over time: with just 1 attempt, a single
// miss is a 100% miss rate (clears the bar immediately), but as attempts accumulate,
// sustained improvement drags the rate below the cutoff and the card drops off the list.
const STRUGGLING_THRESHOLD_PERCENT = 90;
// Mirrors the miss-rate cutoff above, but gated by a minimum sample size — a single lucky
// guess shouldn't earn the "mastered" mark the way a single miss earns "struggling".
const MASTERED_THRESHOLD_PERCENT = 90;

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
      table.rows.forEach((row, rowIndex) => {
        cards.push({
          id: `${table.id}::${rowIndex}`,
          tableId: table.id,
          categoryId: category.id,
          categoryLabel: category.label,
          tableTitle: table.title,
          front: row[table.practiceFrontKey!],
          backColumns: backColumnDefs
            .filter((c) => {
              const value = row[c.key];
              return isSegments(value) ? value.length > 0 : !!value;
            })
            .map((c) => ({ label: c.label, value: row[c.key] })),
        });
      });
    }
  }
  return cards;
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const FLASHCARDS: Flashcard[] = buildFlashcards(REFERENCE_CATEGORIES);
const FLASHCARDS_BY_ID = new Map(FLASHCARDS.map((f) => [f.id, f]));
const PRACTICEABLE_TABLE_IDS = new Set(FLASHCARDS.map((f) => f.tableId));

function resolveMissedCards(
  entries: ReferenceSessionMissedCard[],
): { card: Flashcard; missCount: number }[] {
  const resolved: { card: Flashcard; missCount: number }[] = [];
  for (const entry of entries) {
    const card = FLASHCARDS_BY_ID.get(entry.cardId);
    if (card) resolved.push({ card, missCount: entry.missCount });
  }
  return resolved.sort((a, b) => b.missCount - a.missCount);
}

@Component({
  selector: 'app-reference-charts',
  imports: [NgTemplateOutlet, DatePipe],
  templateUrl: './reference-charts.html',
  styleUrl: './reference-charts.scss',
})
export class ReferenceCharts {
  readonly categories = REFERENCE_CATEGORIES;

  readonly totalPracticeableCount = PRACTICEABLE_TABLE_IDS.size;

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

  /**
   * While browsing, mnemonics render right after their designated anchor table. While searching,
   * a filtered-out anchor table would otherwise hide the mnemonics entirely, so they always move
   * to the end instead — see showMnemonicsAtEnd.
   */
  showMnemonicsAfterTable(category: ReferenceCategory, table: ReferenceTable): boolean {
    return !this.isSearching() && table.id === category.mnemonicsAfterTableId;
  }

  showMnemonicsAtEnd(category: ReferenceCategory): boolean {
    if (!category.mnemonics?.length) return false;
    return this.isSearching() || !category.mnemonicsAfterTableId;
  }

  // ---- Practice-set selection ----

  selectedTableIds = signal<Set<string>>(
    new Set(loadSelectedTableIds().filter((id) => PRACTICEABLE_TABLE_IDS.has(id))),
  );

  private updateSelectedTableIds(updater: (ids: Set<string>) => Set<string>): void {
    this.selectedTableIds.update((ids) => {
      const next = updater(ids);
      saveSelectedTableIds(next);
      return next;
    });
  }

  isTableSelected(tableId: string): boolean {
    return this.selectedTableIds().has(tableId);
  }

  toggleTable(tableId: string): void {
    this.updateSelectedTableIds((ids) => {
      const next = new Set(ids);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  }

  /** Lets the whole tile act as the click target (like Kana's tiles) without hijacking a text selection made for copying. */
  onTileClick(event: MouseEvent, tableId: string): void {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    this.toggleTable(tableId);
  }

  onTileKeydown(event: KeyboardEvent, tableId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleTable(tableId);
    }
  }

  practiceableTablesOf(category: ReferenceCategory): ReferenceTable[] {
    return category.tables.filter((t) => !!t.practiceFrontKey);
  }

  quickSelectExpanded = signal(false);

  toggleQuickSelect(): void {
    this.quickSelectExpanded.update((v) => !v);
  }

  practiceableCountForCategory(category: ReferenceCategory): number {
    return this.practiceableTablesOf(category).length;
  }

  selectedCountForCategory(category: ReferenceCategory): number {
    const ids = this.selectedTableIds();
    return this.practiceableTablesOf(category).filter((t) => ids.has(t.id)).length;
  }

  selectAllForCategory(category: ReferenceCategory): void {
    this.updateSelectedTableIds((ids) => {
      const next = new Set(ids);
      for (const t of this.practiceableTablesOf(category)) next.add(t.id);
      return next;
    });
  }

  clearForCategory(category: ReferenceCategory): void {
    this.updateSelectedTableIds((ids) => {
      const next = new Set(ids);
      for (const t of this.practiceableTablesOf(category)) next.delete(t.id);
      return next;
    });
  }

  selectedCountTotal = computed(() => this.selectedTableIds().size);

  selectAllGlobal(): void {
    this.updateSelectedTableIds(() => new Set(PRACTICEABLE_TABLE_IDS));
  }

  clearGlobal(): void {
    this.updateSelectedTableIds(() => new Set());
  }

  // ---- Mastery (green/red) ----

  cardStats = signal<ReferenceCardStatsMap>(loadCardStats());

  rowCardId(table: ReferenceTable, rowIndex: number): string {
    return `${table.id}::${rowIndex}`;
  }

  /** ○ for mastered, ✕ for struggling — matches the Kana trainer's badge convention. */
  tileBadgeFor(cardId: string): TileBadge {
    const stat = this.cardStats()[cardId];
    if (!stat || stat.attempts === 0) return null;

    const missPercent = ((stat.attempts - stat.correct) / stat.attempts) * 100;
    if (missPercent >= STRUGGLING_THRESHOLD_PERCENT) return 'struggling';

    if (stat.attempts >= MIN_ATTEMPTS_FOR_RETENTION) {
      const accuracyPercent = (stat.correct / stat.attempts) * 100;
      if (accuracyPercent >= MASTERED_THRESHOLD_PERCENT) return 'mastered';
    }

    return null;
  }

  masteredCountTotal = computed(
    () => FLASHCARDS.filter((f) => this.tileBadgeFor(f.id) === 'mastered').length,
  );

  masteredCountForCategory(category: ReferenceCategory): number {
    return FLASHCARDS.filter((f) => f.categoryId === category.id && this.tileBadgeFor(f.id) === 'mastered')
      .length;
  }

  // ---- History ----

  history = signal<ReferenceSessionSummary[]>(loadHistory());

  historyDescending = computed(() =>
    [...this.history()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  );

  expandedHistoryTimestamp = signal<string | null>(null);

  historySummary = computed(() => {
    const entries = this.history();
    if (entries.length === 0) return null;

    const totalAttempts = entries.reduce((sum, e) => sum + e.totalAttempts, 0);
    const totalCorrect = entries.reduce((sum, e) => sum + e.correctAttempts, 0);
    return {
      sessions: entries.length,
      totalAttempts,
      accuracyPercent: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    };
  });

  toggleHistoryEntry(timestamp: string): void {
    this.expandedHistoryTimestamp.update((current) => (current === timestamp ? null : timestamp));
  }

  isHistoryEntryExpanded(timestamp: string): boolean {
    return this.expandedHistoryTimestamp() === timestamp;
  }

  accuracyPercentFor(entry: ReferenceSessionSummary): number {
    return entry.totalAttempts > 0
      ? Math.round((entry.correctAttempts / entry.totalAttempts) * 100)
      : 0;
  }

  missedCardsFor(entry: ReferenceSessionSummary): { card: Flashcard; missCount: number }[] {
    return resolveMissedCards(entry.missedCards ?? []);
  }

  clearHistory(): void {
    const confirmed = confirm(
      'Clear all reference-chart practice history and mastery stats? This cannot be undone.',
    );
    if (!confirmed) return;

    this.cardStats.set({});
    this.history.set([]);
    saveCardStats({});
    saveHistory([]);
  }

  // ---- Practice session ----

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'practice' && this.practiceState() !== 'active') {
      this.startPractice();
    }
  }

  practiceDeck = computed<Flashcard[]>(() => {
    const ids = this.selectedTableIds();
    return FLASHCARDS.filter((f) => ids.has(f.tableId));
  });

  practiceState = signal<PracticeState>('idle');

  sessionDeck = signal<Flashcard[]>([]);

  currentCardIndex = signal(0);

  revealed = signal(false);

  knewCount = signal(0);

  missedCount = signal(0);

  private sessionLog: { cardId: string; correct: boolean }[] = [];

  currentCard = computed<Flashcard | null>(() => {
    const cards = this.sessionDeck();
    const i = this.currentCardIndex();
    return i < cards.length ? cards[i] : null;
  });

  totalCards = computed(() => this.sessionDeck().length);

  progressDisplay = computed(
    () => `${Math.min(this.currentCardIndex() + 1, this.totalCards())} / ${this.totalCards()}`,
  );

  accuracyPercent = computed(() => {
    const total = this.knewCount() + this.missedCount();
    return total > 0 ? Math.round((this.knewCount() / total) * 100) : 0;
  });

  /** Builds a fresh, shuffled session from the current table selection. Leaves the deck empty (idle state) if nothing is selected. */
  startPractice(): void {
    const pool = this.practiceDeck();
    this.sessionDeck.set(shuffled(pool));
    this.currentCardIndex.set(0);
    this.revealed.set(false);
    this.knewCount.set(0);
    this.missedCount.set(0);
    this.sessionLog = [];
    this.practiceState.set(pool.length > 0 ? 'active' : 'idle');
  }

  startPracticeAndSwitch(): void {
    this.startPractice();
    this.viewMode.set('practice');
  }

  revealAnswer(): void {
    this.revealed.set(true);
  }

  markKnew(): void {
    this.logAttempt(true);
    this.knewCount.update((n) => n + 1);
    this.advanceCard();
  }

  markMissed(): void {
    this.logAttempt(false);
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

  private logAttempt(correct: boolean): void {
    const card = this.currentCard();
    if (card) this.sessionLog.push({ cardId: card.id, correct });
  }

  private advanceCard(): void {
    this.revealed.set(false);
    const next = this.currentCardIndex() + 1;
    if (next >= this.sessionDeck().length) {
      this.finishSession();
    } else {
      this.currentCardIndex.set(next);
    }
  }

  private computeSessionMissedCards(): ReferenceSessionMissedCard[] {
    const counts = new Map<string, number>();
    for (const entry of this.sessionLog) {
      if (!entry.correct) {
        counts.set(entry.cardId, (counts.get(entry.cardId) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([cardId, missCount]) => ({ cardId, missCount }))
      .sort((a, b) => b.missCount - a.missCount);
  }

  private finishSession(): void {
    const missedCards = this.computeSessionMissedCards();
    const summary: ReferenceSessionSummary = {
      timestamp: new Date().toISOString(),
      totalAttempts: this.knewCount() + this.missedCount(),
      correctAttempts: this.knewCount(),
      cardCount: this.sessionDeck().length,
      missedCards,
    };

    const mergedStats = mergeSessionIntoStats(this.cardStats(), this.sessionLog);
    this.cardStats.set(mergedStats);
    saveCardStats(mergedStats);

    const updatedHistory = [...this.history(), summary];
    this.history.set(updatedHistory);
    saveHistory(updatedHistory);

    this.practiceState.set('finished');
  }
}
