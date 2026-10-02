import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../../app/core/services/analytics';
import { KanaChar, KanaScript } from '../../core/models/KanaChar';
import { KanaRowGroup } from '../../core/models/KanaRowGroup';
import { KanaCharStat, KanaCharStatsMap } from '../../core/models/KanaCharStats';
import { KanaSessionMissedChar, KanaSessionSummary } from '../../core/models/KanaSessionSummary';
import { KANA_CHARS, KANA_ROW_GROUPS, charsForRow } from '../../core/data/kana-chars';
import { isExactMatch, isValidPrefix } from './kana-match';
import { pickNextChar } from './kana-selector';
import {
  downloadSessionAsJson,
  downloadStatsAsJson,
  loadCharStats,
  loadHistory,
  loadSelectedCharIds,
  mergeCharStats,
  mergeHistory,
  mergeSessionIntoStats,
  parseImportPayload,
  saveCharStats,
  saveHistory,
  saveSelectedCharIds,
} from './kana-storage';

type KanaViewState = 'setup' | 'practice' | 'paused' | 'results';

const MIN_ATTEMPTS_FOR_RETENTION = 3;
const WORST_CHARS_LIMIT = 8;
const INCORRECT_ADVANCE_DELAY_MS = 900;
const DOUBLE_ENTER_WINDOW_MS = 400;
// A flat cutoff naturally gives the right shape over time: with just 1 attempt, a single
// miss is a 100% miss rate (clears the bar immediately), but as attempts accumulate,
// sustained improvement drags the rate below the cutoff and the kana drops off the list.
const MOST_MISSED_THRESHOLD_PERCENT = 90;
// Mirrors the miss-rate cutoff above, but gated by a minimum sample size — a single lucky
// guess shouldn't earn the "mastered" mark the way a single miss earns "struggling".
const MASTERED_THRESHOLD_PERCENT = 90;

type TileBadge = 'mastered' | 'struggling' | null;

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

function formatShortDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface TrendPoint {
  x: number;
  y: number;
  accuracyPercent: number;
  dateLabel: string;
}

interface TrendChart {
  points: TrendPoint[];
  linePath: string;
  width: number;
  height: number;
  left: number;
  right: number;
  gridLines: { y: number; label: string }[];
}

const TREND_CHART_WIDTH = 640;
const TREND_CHART_HEIGHT = 160;
const TREND_CHART_MARGIN = { top: 16, right: 16, bottom: 16, left: 34 };

/** Raw (unrounded) miss rate — used for threshold comparisons so a display-only rounding never shifts which side of a cutoff a stat falls on. */
function rawMissPercent(stat: KanaCharStat): number {
  return ((stat.attempts - stat.correct) / stat.attempts) * 100;
}

function resolveMissedChars(
  entries: KanaSessionMissedChar[],
): { char: KanaChar; missCount: number }[] {
  const charById = new Map(KANA_CHARS.map((c) => [c.id, c]));
  const resolved: { char: KanaChar; missCount: number }[] = [];
  for (const entry of entries) {
    const char = charById.get(entry.charId);
    if (char) resolved.push({ char, missCount: entry.missCount });
  }
  return resolved.sort((a, b) => b.missCount - a.missCount);
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

  selectedCharIds = signal<Set<string>>(new Set(loadSelectedCharIds()));

  selectedChars = computed(() => {
    const ids = this.selectedCharIds();
    return KANA_CHARS.filter((c) => ids.has(c.id));
  });

  canStart = computed(() => this.selectedChars().length > 0);

  history = signal<KanaSessionSummary[]>(loadHistory());

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

  hoveredTrendIndex = signal<number | null>(null);

  accuracyTrend = computed<TrendChart | null>(() => {
    const sessions = this.history();
    if (sessions.length === 0) return null;

    const { top, right, bottom, left } = TREND_CHART_MARGIN;
    const plotWidth = TREND_CHART_WIDTH - left - right;
    const plotHeight = TREND_CHART_HEIGHT - top - bottom;

    const points: TrendPoint[] = sessions.map((s, i) => {
      const accuracyPercent = this.accuracyPercentFor(s);
      const x =
        sessions.length > 1 ? left + (i / (sessions.length - 1)) * plotWidth : left + plotWidth / 2;
      const y = top + (1 - accuracyPercent / 100) * plotHeight;
      return { x, y, accuracyPercent, dateLabel: formatShortDate(s.timestamp) };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');

    const gridLines = [0, 50, 100].map((pct) => ({
      y: top + (1 - pct / 100) * plotHeight,
      label: `${pct}%`,
    }));

    return {
      points,
      linePath,
      width: TREND_CHART_WIDTH,
      height: TREND_CHART_HEIGHT,
      left,
      right,
      gridLines,
    };
  });

  hoveredTrendPoint = computed<TrendPoint | null>(() => {
    const i = this.hoveredTrendIndex();
    const trend = this.accuracyTrend();
    if (i === null || !trend) return null;
    return trend.points[i] ?? null;
  });

  toggleHistoryEntry(timestamp: string): void {
    this.expandedHistoryTimestamp.update((current) => (current === timestamp ? null : timestamp));
  }

  isHistoryEntryExpanded(timestamp: string): boolean {
    return this.expandedHistoryTimestamp() === timestamp;
  }

  accuracyPercentFor(entry: KanaSessionSummary): number {
    return entry.totalAttempts > 0
      ? Math.round((entry.correctAttempts / entry.totalAttempts) * 100)
      : 0;
  }

  durationDisplayFor(entry: KanaSessionSummary): string {
    return formatClock(entry.durationMs / 1000);
  }

  missedCharsFor(entry: KanaSessionSummary): { char: KanaChar; missCount: number }[] {
    return resolveMissedChars(entry.missedChars ?? []);
  }

  downloadSession(entry: KanaSessionSummary): void {
    downloadSessionAsJson(entry);
  }

  importMessage = signal<{ text: string; isError: boolean } | null>(null);

  async importFromFile(file: File): Promise<void> {
    const raw = await file.text();
    const payload = parseImportPayload(raw);
    if (!payload) {
      this.importMessage.set({ text: 'That file could not be read as Kana stats.', isError: true });
      return;
    }

    const previousSessionCount = this.history().length;
    const mergedStats = mergeCharStats(this.charStats(), payload.charStats);
    const mergedHistory = mergeHistory(this.history(), payload.history);
    this.charStats.set(mergedStats);
    this.history.set(mergedHistory);
    saveCharStats(mergedStats);
    saveHistory(mergedHistory);

    const newSessions = mergedHistory.length - previousSessionCount;
    this.importMessage.set({
      text: `Imported ${payload.history.length} session${payload.history.length === 1 ? '' : 's'} from the file (${newSessions} new after de-duplication).`,
      isError: false,
    });
  }

  onImportFileSelected(files: FileList | null): void {
    const file = files?.[0];
    if (file) this.importFromFile(file);
  }

  currentChar = signal<KanaChar | null>(null);

  inputValue = signal('');

  feedback = signal<'neutral' | 'correct' | 'incorrect'>('neutral');

  revealedRomaji = signal<string | null>(null);

  hintVisible = signal(false);

  autoPronounce = signal(false);

  speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  currentRowChars = computed(() => {
    const char = this.currentChar();
    return char ? charsForRow(char.script, char.rowId) : [];
  });

  currentRowLabel = computed(() => {
    const char = this.currentChar();
    if (!char) return '';
    return KANA_ROW_GROUPS.find((r) => r.id === char.rowId)?.label ?? '';
  });

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

  worstChars = computed(() => this.rankByMissRate(KANA_CHARS));

  /** Characters you're still genuinely struggling with — a sustained miss rate, not just "worst of the bunch". */
  mostMissedCharsForScript(
    script: KanaScript,
  ): { char: KanaChar; missPercent: number; attempts: number }[] {
    const stats = this.charStats();
    const entries: { char: KanaChar; missPercent: number; attempts: number }[] = [];
    for (const c of KANA_CHARS) {
      if (c.script !== script) continue;
      const stat = stats[c.id];
      if (!stat || stat.attempts === 0) continue;
      if (rawMissPercent(stat) >= MOST_MISSED_THRESHOLD_PERCENT) {
        entries.push({ char: c, missPercent: Math.round(rawMissPercent(stat)), attempts: stat.attempts });
      }
    }
    return entries.sort((a, b) => b.missPercent - a.missPercent);
  }

  private rankByMissRate(
    pool: KanaChar[],
  ): { char: KanaChar; missPercent: number; attempts: number }[] {
    const stats = this.charStats();
    const entries: { char: KanaChar; missPercent: number; attempts: number }[] = [];
    for (const c of pool) {
      const stat = stats[c.id];
      if (stat && stat.attempts >= MIN_ATTEMPTS_FOR_RETENTION) {
        entries.push({
          char: c,
          missPercent: Math.round(rawMissPercent(stat)),
          attempts: stat.attempts,
        });
      }
    }
    // Worst (most-missed) first — a longer, more alarming bar for a higher miss rate.
    return entries.sort((a, b) => b.missPercent - a.missPercent).slice(0, WORST_CHARS_LIMIT);
  }

  private sessionPool: KanaChar[] = [];

  private sessionLog: SessionLogEntry[] = [];

  private lastCharId: string | null = null;

  private sessionAccumulatedMs = 0;

  private sessionSegmentStart: number | null = null;

  private charAccumulatedMs = 0;

  private charSegmentStart: number | null = null;

  private pendingAdvanceAfterResume = false;

  private lastEnterPressAt = 0;

  private timerIntervalId: ReturnType<typeof setInterval> | null = null;

  private advanceTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.stopTimerInterval();
    this.clearPendingAdvance();
    if (this.speechSupported) speechSynthesis.cancel();
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;

    if (event.key === 'Control') {
      this.handleCtrlPress();
    } else if (event.key === 'Enter') {
      if (this.viewState() === 'practice' || this.viewState() === 'paused') {
        event.preventDefault();
        this.handleEnterPress();
      }
    } else if (event.key === 'Shift') {
      this.toggleHint();
    } else if (event.key === 'CapsLock') {
      this.toggleAutoPronounce();
    }
  }

  private handleCtrlPress(): void {
    if (this.viewState() === 'practice') {
      this.pause();
    } else if (this.viewState() === 'paused') {
      this.resume();
    }
  }

  private handleEnterPress(): void {
    const now = Date.now();
    if (now - this.lastEnterPressAt <= DOUBLE_ENTER_WINDOW_MS) {
      this.lastEnterPressAt = 0;
      this.endSession();
    } else {
      this.lastEnterPressAt = now;
    }
  }

  /** Toggles the row hint on/off, persisting across cards like Auto Pronounce — using it no longer affects scoring. */
  toggleHint(): void {
    if (this.viewState() !== 'practice') return;
    this.hintVisible.update((v) => !v);
  }

  /** Toggles reading each kana aloud as it appears — on, it also speaks the current one immediately for confirmation. */
  toggleAutoPronounce(): void {
    if (!this.currentChar()) return;
    const next = !this.autoPronounce();
    this.autoPronounce.set(next);
    if (next) this.pronounceCurrent();
  }

  pronounceCurrent(): void {
    const char = this.currentChar();
    if (char) this.speak(char.char);
  }

  private speak(text: string): void {
    if (!this.speechSupported) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    speechSynthesis.speak(utterance);
  }

  private updateSelectedCharIds(updater: (ids: Set<string>) => Set<string>): void {
    this.selectedCharIds.update((ids) => {
      const next = updater(ids);
      saveSelectedCharIds(next);
      return next;
    });
  }

  toggleChar(id: string): void {
    this.updateSelectedCharIds((ids) => {
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

  /** ○ for mastered, ✕ for struggling — the familiar maru/batsu marks, so the signal is shape, not hue. */
  tileBadgeFor(charId: string): TileBadge {
    const stat = this.charStats()[charId];
    if (!stat || stat.attempts === 0) return null;

    if (rawMissPercent(stat) >= MOST_MISSED_THRESHOLD_PERCENT) return 'struggling';

    if (stat.attempts >= MIN_ATTEMPTS_FOR_RETENTION) {
      const accuracyPercent = (stat.correct / stat.attempts) * 100;
      if (accuracyPercent >= MASTERED_THRESHOLD_PERCENT) return 'mastered';
    }

    return null;
  }

  selectAllForScript(script: KanaScript): void {
    this.updateSelectedCharIds((ids) => {
      const next = new Set(ids);
      for (const c of KANA_CHARS) {
        if (c.script === script) next.add(c.id);
      }
      return next;
    });
  }

  clearAllForScript(script: KanaScript): void {
    this.updateSelectedCharIds((ids) => {
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

  masteredCountForScript(script: KanaScript): number {
    let count = 0;
    for (const c of KANA_CHARS) {
      if (c.script === script && this.tileBadgeFor(c.id) === 'mastered') count++;
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
    this.updateSelectedCharIds((ids) => {
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
    this.updateSelectedCharIds((ids) => {
      const next = new Set(ids);
      for (const row of rows) {
        for (const c of charsForRow(script, row.id)) next.add(c.id);
      }
      return next;
    });
  }

  clearCategory(script: KanaScript, rows: KanaRowGroup[]): void {
    this.updateSelectedCharIds((ids) => {
      const next = new Set(ids);
      for (const row of rows) {
        for (const c of charsForRow(script, row.id)) next.delete(c.id);
      }
      return next;
    });
  }

  /**
   * Replaces this script's current selection with its weakest all-time characters — a
   * one-click "review my mistakes" preset scoped to just this column.
   */
  selectMostMissedForScript(script: KanaScript): void {
    const ids = this.mostMissedCharsForScript(script).map((entry) => entry.char.id);
    this.updateSelectedCharIds((current) => {
      const next = new Set(current);
      for (const c of KANA_CHARS) {
        if (c.script === script) next.delete(c.id);
      }
      for (const id of ids) next.add(id);
      return next;
    });
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
    this.lastEnterPressAt = 0;
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

  /** Space repeats the current kana's audio instead of being typed — it's never a valid romaji character anyway. */
  onRomajiKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      this.pronounceCurrent();
    }
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
    if (this.speechSupported) speechSynthesis.cancel();
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
    const missedChars = this.computeSessionMissedChars();
    const summary: KanaSessionSummary = {
      timestamp: new Date().toISOString(),
      durationMs: this.sessionAccumulatedMs,
      totalAttempts: attempts,
      correctAttempts: this.sessionCorrect(),
      avgTimeMsPerChar: attempts > 0 ? this.sessionTotalTimeMs() / attempts : 0,
      charCount: this.sessionPool.length,
      missedChars,
    };

    const mergedStats = mergeSessionIntoStats(this.charStats(), this.sessionLog);
    this.charStats.set(mergedStats);
    saveCharStats(mergedStats);

    const updatedHistory = [...this.history(), summary];
    this.history.set(updatedHistory);
    saveHistory(updatedHistory);

    this.finalSummary.set(summary);
    this.sessionMissedChars.set(resolveMissedChars(missedChars));
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

  /** The practice screen's "back to selection" shortcut — saves the in-progress session first, same as End & Save. */
  exitPracticeToSetup(): void {
    if (this.viewState() === 'practice' || this.viewState() === 'paused') {
      this.endSession();
    }
    this.backToSetup();
  }

  downloadJson(): void {
    downloadStatsAsJson(this.charStats(), this.history());
  }

  clearHistory(): void {
    const confirmed = confirm(
      'Clear all Kana practice history and character stats? This cannot be undone — consider downloading a backup first.',
    );
    if (!confirmed) return;

    this.charStats.set({});
    this.history.set([]);
    saveCharStats({});
    saveHistory([]);
    this.importMessage.set(null);
  }

  private recordAttempt(char: KanaChar, correct: boolean): void {
    const timeMs = elapsedMs(this.charAccumulatedMs, this.charSegmentStart);
    this.sessionLog.push({ charId: char.id, correct, timeMs });
    this.sessionAttempts.update((n) => n + 1);
    if (correct) this.sessionCorrect.update((n) => n + 1);
    this.sessionTotalTimeMs.update((ms) => ms + timeMs);
  }

  private computeSessionMissedChars(): KanaSessionMissedChar[] {
    const counts = new Map<string, number>();
    for (const entry of this.sessionLog) {
      if (!entry.correct) {
        counts.set(entry.charId, (counts.get(entry.charId) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([charId, missCount]) => ({ charId, missCount }))
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

    if (this.autoPronounce()) this.speak(next.char);

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
