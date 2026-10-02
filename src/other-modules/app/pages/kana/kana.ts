import { Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../../app/core/services/analytics';
import { KanaChar, KanaScript } from '../../core/models/KanaChar';
import { KanaRowGroup } from '../../core/models/KanaRowGroup';
import { KanaCharStatsMap } from '../../core/models/KanaCharStats';
import { KanaSessionSummary } from '../../core/models/KanaSessionSummary';
import { KANA_CHARS, KANA_ROW_GROUPS, charsForRow } from '../../core/data/kana-chars';
import { isExactMatch, isValidPrefix } from './kana-match';
import { pickNextChar } from './kana-selector';
import {
  downloadStatsAsJson,
  loadCharStats,
  loadHistory,
  mergeSessionIntoStats,
  saveCharStats,
  saveHistory,
} from './kana-storage';

type KanaViewState = 'setup' | 'practice' | 'paused' | 'results';

const MIN_ATTEMPTS_FOR_RETENTION = 3;
const WORST_CHARS_LIMIT = 8;
const INCORRECT_ADVANCE_DELAY_MS = 900;

interface SessionLogEntry {
  charId: string;
  correct: boolean;
  timeMs: number;
}

interface RowSection {
  label: string;
  rows: KanaRowGroup[];
}

const ROW_SECTIONS: RowSection[] = [
  { label: 'Main', rows: KANA_ROW_GROUPS.filter((r) => r.kind === 'gojuon') },
  {
    label: 'Dakuten',
    rows: KANA_ROW_GROUPS.filter((r) => r.kind === 'dakuten' || r.kind === 'handakuten'),
  },
  { label: 'Combinations', rows: KANA_ROW_GROUPS.filter((r) => r.kind === 'yoon') },
];

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(2);
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = String(s % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function elapsedMs(accumulated: number, segmentStart: number | null): number {
  return accumulated + (segmentStart !== null ? Date.now() - segmentStart : 0);
}

@Component({
  selector: 'app-kana',
  imports: [RouterLink, DatePipe],
  templateUrl: './kana.html',
  styleUrl: './kana.scss',
})
export class Kana implements OnDestroy {
  private readonly analytics = inject(AnalyticsService);

  private readonly kanaInput = viewChild<ElementRef<HTMLInputElement>>('kanaInput');

  readonly rowSections: RowSection[] = ROW_SECTIONS;

  readonly charsForRow = charsForRow;

  readonly formatSeconds = formatSeconds;

  viewState = signal<KanaViewState>('setup');

  selectedCharIds = signal<Set<string>>(new Set());

  selectedChars = computed(() => {
    const ids = this.selectedCharIds();
    return KANA_CHARS.filter((c) => ids.has(c.id));
  });

  canStart = computed(() => this.selectedChars().length > 0);

  history = signal<KanaSessionSummary[]>(loadHistory());

  historyDescending = computed(() =>
    [...this.history()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  );

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

  currentChar = signal<KanaChar | null>(null);

  inputValue = signal('');

  feedback = signal<'neutral' | 'correct' | 'incorrect'>('neutral');

  revealedRomaji = signal<string | null>(null);

  sessionAttempts = signal(0);

  sessionCorrect = signal(0);

  sessionTotalTimeMs = signal(0);

  liveAvgTimeDisplay = computed(() =>
    this.sessionAttempts() > 0
      ? formatSeconds(this.sessionTotalTimeMs() / this.sessionAttempts())
      : '0.00',
  );

  elapsedSeconds = signal(0);

  readonly elapsedDisplay = computed(() => formatClock(this.elapsedSeconds()));

  charStats = signal<KanaCharStatsMap>(loadCharStats());

  finalSummary = signal<KanaSessionSummary | null>(null);

  sessionMissedChars = signal<{ char: KanaChar; missCount: number }[]>([]);

  resultsAccuracyPercent = computed(() => {
    const summary = this.finalSummary();
    if (!summary || summary.totalAttempts === 0) return 0;
    return Math.round((summary.correctAttempts / summary.totalAttempts) * 100);
  });

  resultsTotalTimeDisplay = computed(() =>
    formatClock((this.finalSummary()?.durationMs ?? 0) / 1000),
  );

  resultsAvgTimeDisplay = computed(() => formatSeconds(this.finalSummary()?.avgTimeMsPerChar ?? 0));

  worstChars = computed(() => {
    const stats = this.charStats();
    const entries: { char: KanaChar; accuracyPercent: number; attempts: number }[] = [];
    for (const c of KANA_CHARS) {
      const stat = stats[c.id];
      if (stat && stat.attempts >= MIN_ATTEMPTS_FOR_RETENTION) {
        entries.push({
          char: c,
          accuracyPercent: Math.round((stat.correct / stat.attempts) * 100),
          attempts: stat.attempts,
        });
      }
    }
    return entries.sort((a, b) => a.accuracyPercent - b.accuracyPercent).slice(0, WORST_CHARS_LIMIT);
  });

  private sessionPool: KanaChar[] = [];

  private sessionLog: SessionLogEntry[] = [];

  private lastCharId: string | null = null;

  private sessionAccumulatedMs = 0;

  private sessionSegmentStart: number | null = null;

  private charAccumulatedMs = 0;

  private charSegmentStart: number | null = null;

  private pendingAdvanceAfterResume = false;

  private timerIntervalId: ReturnType<typeof setInterval> | null = null;

  private advanceTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.stopTimerInterval();
    this.clearPendingAdvance();
  }

  toggleChar(id: string): void {
    this.selectedCharIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isCharSelected(id: string): boolean {
    return this.selectedCharIds().has(id);
  }

  selectAllForScript(script: KanaScript): void {
    this.selectedCharIds.update((ids) => {
      const next = new Set(ids);
      for (const c of KANA_CHARS) {
        if (c.script === script) next.add(c.id);
      }
      return next;
    });
  }

  clearAllForScript(script: KanaScript): void {
    this.selectedCharIds.update((ids) => {
      const next = new Set(ids);
      for (const c of KANA_CHARS) {
        if (c.script === script) next.delete(c.id);
      }
      return next;
    });
  }

  totalForScript(script: KanaScript): number {
    return KANA_CHARS.reduce((count, c) => count + (c.script === script ? 1 : 0), 0);
  }

  selectedCountForScript(script: KanaScript): number {
    const ids = this.selectedCharIds();
    let count = 0;
    for (const c of KANA_CHARS) {
      if (c.script === script && ids.has(c.id)) count++;
    }
    return count;
  }

  categoryTotalCount(script: KanaScript, rows: KanaRowGroup[]): number {
    let count = 0;
    for (const row of rows) {
      count += charsForRow(script, row.id).length;
    }
    return count;
  }

  categorySelectedCount(script: KanaScript, rows: KanaRowGroup[]): number {
    const ids = this.selectedCharIds();
    let count = 0;
    for (const row of rows) {
      for (const c of charsForRow(script, row.id)) {
        if (ids.has(c.id)) count++;
      }
    }
    return count;
  }

  isRowFullySelected(script: KanaScript, rowId: string): boolean {
    const chars = charsForRow(script, rowId);
    return chars.length > 0 && chars.every((c) => this.selectedCharIds().has(c.id));
  }

  /** Selects the whole row, or clears it if every character in it is already selected. */
  toggleRow(script: KanaScript, rowId: string): void {
    const chars = charsForRow(script, rowId);
    const allSelected = this.isRowFullySelected(script, rowId);
    this.selectedCharIds.update((ids) => {
      const next = new Set(ids);
      for (const c of chars) {
        if (allSelected) {
          next.delete(c.id);
        } else {
          next.add(c.id);
        }
      }
      return next;
    });
  }

  selectCategory(script: KanaScript, rows: KanaRowGroup[]): void {
    this.selectedCharIds.update((ids) => {
      const next = new Set(ids);
      for (const row of rows) {
        for (const c of charsForRow(script, row.id)) next.add(c.id);
      }
      return next;
    });
  }

  clearCategory(script: KanaScript, rows: KanaRowGroup[]): void {
    this.selectedCharIds.update((ids) => {
      const next = new Set(ids);
      for (const row of rows) {
        for (const c of charsForRow(script, row.id)) next.delete(c.id);
      }
      return next;
    });
  }

  /** Loads the current weakest all-time characters as the selection — a one-click "review my mistakes" preset. */
  selectMostMissed(): void {
    this.selectedCharIds.set(new Set(this.worstChars().map((entry) => entry.char.id)));
  }

  startSession(): void {
    this.sessionPool = this.selectedChars();
    if (this.sessionPool.length === 0) return;

    this.sessionLog = [];
    this.lastCharId = null;
    this.sessionAttempts.set(0);
    this.sessionCorrect.set(0);
    this.sessionTotalTimeMs.set(0);
    this.elapsedSeconds.set(0);
    this.sessionAccumulatedMs = 0;
    this.pendingAdvanceAfterResume = false;
    this.finalSummary.set(null);
    this.sessionMissedChars.set([]);

    this.analytics.track('kana_session_started', {
      charCount: this.sessionPool.length,
    });

    this.sessionSegmentStart = Date.now();
    this.advanceToNextChar();
    this.startTimerInterval();
    this.viewState.set('practice');
  }

  onInput(value: string): void {
    if (this.viewState() !== 'practice') return;
    this.inputValue.set(value);
    const char = this.currentChar();
    if (!char) return;

    if (isExactMatch(value, char)) {
      this.recordAttempt(char, true);
      this.advanceToNextChar();
    } else if (!isValidPrefix(value, char)) {
      this.recordAttempt(char, false);
      this.feedback.set('incorrect');
      this.revealedRomaji.set(char.romaji);
      this.clearPendingAdvance();
      this.advanceTimeoutId = setTimeout(() => this.advanceToNextChar(), INCORRECT_ADVANCE_DELAY_MS);
    }
  }

  pause(): void {
    if (this.viewState() !== 'practice') return;
    this.sessionAccumulatedMs = elapsedMs(this.sessionAccumulatedMs, this.sessionSegmentStart);
    this.charAccumulatedMs = elapsedMs(this.charAccumulatedMs, this.charSegmentStart);
    this.sessionSegmentStart = null;
    this.charSegmentStart = null;
    if (this.feedback() === 'incorrect') {
      this.pendingAdvanceAfterResume = true;
    }
    this.clearPendingAdvance();
    this.stopTimerInterval();
    this.viewState.set('paused');
  }

  resume(): void {
    if (this.viewState() !== 'paused') return;
    this.sessionSegmentStart = Date.now();
    this.charSegmentStart = Date.now();
    this.startTimerInterval();
    this.viewState.set('practice');

    if (this.pendingAdvanceAfterResume) {
      this.pendingAdvanceAfterResume = false;
      this.advanceToNextChar();
    } else {
      this.focusInput();
    }
  }

  endSession(): void {
    if (this.viewState() === 'practice') {
      this.sessionAccumulatedMs = elapsedMs(this.sessionAccumulatedMs, this.sessionSegmentStart);
      this.sessionSegmentStart = null;
      this.stopTimerInterval();
      this.clearPendingAdvance();
    }

    const attempts = this.sessionAttempts();
    const summary: KanaSessionSummary = {
      timestamp: new Date().toISOString(),
      durationMs: this.sessionAccumulatedMs,
      totalAttempts: attempts,
      correctAttempts: this.sessionCorrect(),
      avgTimeMsPerChar: attempts > 0 ? this.sessionTotalTimeMs() / attempts : 0,
      charCount: this.sessionPool.length,
    };

    const mergedStats = mergeSessionIntoStats(this.charStats(), this.sessionLog);
    this.charStats.set(mergedStats);
    saveCharStats(mergedStats);

    const updatedHistory = [...this.history(), summary];
    this.history.set(updatedHistory);
    saveHistory(updatedHistory);

    this.finalSummary.set(summary);
    this.sessionMissedChars.set(this.computeSessionMissedChars());
    this.analytics.track('kana_session_completed', {
      totalAttempts: summary.totalAttempts,
      correctAttempts: summary.correctAttempts,
      durationMs: summary.durationMs,
    });
    this.viewState.set('results');
  }

  practiceAgain(): void {
    this.startSession();
  }

  backToSetup(): void {
    this.viewState.set('setup');
  }

  downloadJson(): void {
    downloadStatsAsJson(this.charStats(), this.history());
  }

  private recordAttempt(char: KanaChar, correct: boolean): void {
    const timeMs = elapsedMs(this.charAccumulatedMs, this.charSegmentStart);
    this.sessionLog.push({ charId: char.id, correct, timeMs });
    this.sessionAttempts.update((n) => n + 1);
    if (correct) this.sessionCorrect.update((n) => n + 1);
    this.sessionTotalTimeMs.update((ms) => ms + timeMs);
  }

  private computeSessionMissedChars(): { char: KanaChar; missCount: number }[] {
    const counts = new Map<string, number>();
    for (const entry of this.sessionLog) {
      if (!entry.correct) {
        counts.set(entry.charId, (counts.get(entry.charId) ?? 0) + 1);
      }
    }
    const charById = new Map(KANA_CHARS.map((c) => [c.id, c]));
    return [...counts.entries()]
      .map(([charId, missCount]) => ({ char: charById.get(charId)!, missCount }))
      .sort((a, b) => b.missCount - a.missCount);
  }

  private advanceToNextChar(): void {
    this.clearPendingAdvance();
    const next = pickNextChar(this.sessionPool, this.charStats(), this.lastCharId);
    this.lastCharId = next.id;
    this.currentChar.set(next);
    this.inputValue.set('');
    this.feedback.set('neutral');
    this.revealedRomaji.set(null);
    this.charAccumulatedMs = 0;
    this.charSegmentStart = Date.now();

    // Clear the DOM value directly, synchronously — typing fast enough can otherwise
    // fire the next keystroke's native `input` event before Angular has flushed the
    // `inputValue` signal reset into the field, leaving the old text in place.
    const inputEl = this.kanaInput()?.nativeElement;
    if (inputEl) inputEl.value = '';

    this.focusInput();
  }

  private clearPendingAdvance(): void {
    if (this.advanceTimeoutId !== null) {
      clearTimeout(this.advanceTimeoutId);
      this.advanceTimeoutId = null;
    }
  }

  private focusInput(): void {
    setTimeout(() => this.kanaInput()?.nativeElement.focus(), 0);
  }

  private startTimerInterval(): void {
    this.stopTimerInterval();
    this.timerIntervalId = setInterval(() => {
      this.elapsedSeconds.set(
        Math.floor(elapsedMs(this.sessionAccumulatedMs, this.sessionSegmentStart) / 1000),
      );
    }, 1000);
  }

  private stopTimerInterval(): void {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }
}
