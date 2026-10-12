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
import { Clef, MusicNote } from '../../core/models/MusicNote';
import { MusicNoteGroup } from '../../core/models/MusicNoteGroup';
import { MusicNoteStat, MusicNoteStatsMap } from '../../core/models/MusicNoteStats';
import { MusicSessionMissedNote, MusicSessionSummary } from '../../core/models/MusicSessionSummary';
import { MUSIC_NOTES, MUSIC_NOTE_GROUPS, notesForGroup } from '../../core/data/music-notes';
import { isExactMatch, isValidPrefix } from './note-match';
import { pickNextNote } from './note-selector';
import {
  downloadStatsAsJson,
  downloadSessionAsJson,
  loadHistory,
  loadNoteStats,
  loadSelectedNoteIds,
  mergeHistory,
  mergeNoteStats,
  mergeSessionIntoStats,
  parseImportPayload,
  saveHistory,
  saveNoteStats,
  saveSelectedNoteIds,
} from './note-storage';

type MusicNoteViewState = 'setup' | 'practice' | 'paused' | 'results';

const MIN_ATTEMPTS_FOR_RETENTION = 3;
const WORST_NOTES_LIMIT = 8;
const INCORRECT_ADVANCE_DELAY_MS = 900;
const DOUBLE_ENTER_WINDOW_MS = 400;
const MOST_MISSED_THRESHOLD_PERCENT = 90;
const MASTERED_THRESHOLD_PERCENT = 90;

type TileBadge = 'mastered' | 'struggling' | null;

interface SessionLogEntry {
  noteId: string;
  correct: boolean;
  timeMs: number;
}

// SVG staff rendering constants
const STAFF_LINE_Y = [145, 125, 105, 85, 65]; // y for line 1 (bottom) → line 5 (top)
const NOTE_X = 165;
const LEDGER_HALF_WIDTH = 17;

function noteYFromPosition(staffPosition: number): number {
  return 145 - (staffPosition - 1) * 20;
}

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

interface ClefColumn {
  clef: Clef;
  label: string;
  groups: MusicNoteGroup[];
}

const CLEF_COLUMNS: ClefColumn[] = [
  {
    clef: 'treble',
    label: 'Treble Clef',
    groups: MUSIC_NOTE_GROUPS.filter((g) => g.clef === 'treble'),
  },
  {
    clef: 'bass',
    label: 'Bass Clef',
    groups: MUSIC_NOTE_GROUPS.filter((g) => g.clef === 'bass'),
  },
];

function rawMissPercent(stat: MusicNoteStat): number {
  return ((stat.attempts - stat.correct) / stat.attempts) * 100;
}

function resolveMissedNotes(
  entries: MusicSessionMissedNote[],
): { note: MusicNote; missCount: number }[] {
  const noteById = new Map(MUSIC_NOTES.map((n) => [n.id, n]));
  const resolved: { note: MusicNote; missCount: number }[] = [];
  for (const entry of entries) {
    const note = noteById.get(entry.noteId);
    if (note) resolved.push({ note, missCount: entry.missCount });
  }
  return resolved.sort((a, b) => b.missCount - a.missCount);
}

@Component({
  selector: 'app-music-note-trainer',
  imports: [RouterLink, DatePipe],
  templateUrl: './music-note-trainer.html',
  styleUrl: './music-note-trainer.scss',
})
export class MusicNoteTrainer implements OnDestroy {
  private readonly analytics = inject(AnalyticsService);

  private readonly noteInput = viewChild<ElementRef<HTMLInputElement>>('noteInput');

  readonly clefColumns: ClefColumn[] = CLEF_COLUMNS;
  readonly notesForGroup = notesForGroup;
  readonly STAFF_LINE_Y = STAFF_LINE_Y;
  readonly NOTE_X = NOTE_X;
  readonly LEDGER_HALF_WIDTH = LEDGER_HALF_WIDTH;
  readonly formatSeconds = formatSeconds;

  viewState = signal<MusicNoteViewState>('setup');

  selectedNoteIds = signal<Set<string>>(new Set(loadSelectedNoteIds()));

  selectedNotes = computed(() => {
    const ids = this.selectedNoteIds();
    return MUSIC_NOTES.filter((n) => ids.has(n.id));
  });

  canStart = computed(() => this.selectedNotes().length > 0);

  history = signal<MusicSessionSummary[]>(loadHistory());

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
        sessions.length > 1
          ? left + (i / (sessions.length - 1)) * plotWidth
          : left + plotWidth / 2;
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

  accuracyPercentFor(entry: MusicSessionSummary): number {
    return entry.totalAttempts > 0
      ? Math.round((entry.correctAttempts / entry.totalAttempts) * 100)
      : 0;
  }

  durationDisplayFor(entry: MusicSessionSummary): string {
    return formatClock(entry.durationMs / 1000);
  }

  missedNotesFor(entry: MusicSessionSummary): { note: MusicNote; missCount: number }[] {
    return resolveMissedNotes(entry.missedNotes ?? []);
  }

  downloadSession(entry: MusicSessionSummary): void {
    downloadSessionAsJson(entry);
  }

  importMessage = signal<{ text: string; isError: boolean } | null>(null);

  async importFromFile(file: File): Promise<void> {
    const raw = await file.text();
    const payload = parseImportPayload(raw);
    if (!payload) {
      this.importMessage.set({
        text: 'That file could not be read as Music Note stats.',
        isError: true,
      });
      return;
    }

    const previousSessionCount = this.history().length;
    const mergedStats = mergeNoteStats(this.noteStats(), payload.noteStats);
    const mergedHistory = mergeHistory(this.history(), payload.history);
    this.noteStats.set(mergedStats);
    this.history.set(mergedHistory);
    saveNoteStats(mergedStats);
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

  // ── Practice state ─────────────────────────────────────────────────────────

  currentNote = signal<MusicNote | null>(null);

  inputValue = signal('');

  feedback = signal<'neutral' | 'correct' | 'incorrect'>('neutral');

  revealedNote = signal<string | null>(null);

  hintVisible = signal(false);

  noteStats = signal<MusicNoteStatsMap>(loadNoteStats());

  finalSummary = signal<MusicSessionSummary | null>(null);

  sessionMissedNotes = signal<{ note: MusicNote; missCount: number }[]>([]);

  sessionAttempts = signal(0);

  sessionCorrect = signal(0);

  sessionTotalTimeMs = signal(0);

  elapsedSeconds = signal(0);

  readonly elapsedDisplay = computed(() => formatClock(this.elapsedSeconds()));

  liveAvgTimeDisplay = computed(() =>
    this.sessionAttempts() > 0
      ? formatSeconds(this.sessionTotalTimeMs() / this.sessionAttempts())
      : '0.00',
  );

  // ── SVG rendering helpers ──────────────────────────────────────────────────

  noteY = computed(() => {
    const note = this.currentNote();
    return note ? noteYFromPosition(note.staffPosition) : 105;
  });

  noteStemGoesUp = computed(() => {
    const note = this.currentNote();
    return !note || note.staffPosition <= 3;
  });

  noteNeedsLedgerLine = computed(() => {
    const note = this.currentNote();
    return note?.staffPosition === 0 || note?.staffPosition === 6;
  });

  currentMnemonicParts = computed<{ word: string; highlight: boolean }[]>(() => {
    const note = this.currentNote();
    if (!note) return [];
    return note.mnemonicPhrase.split(' ').map((word, i) => ({
      word,
      highlight: i === note.mnemonicWordIndex,
    }));
  });

  currentGroupLabel = computed(() => {
    const note = this.currentNote();
    if (!note) return '';
    return MUSIC_NOTE_GROUPS.find((g) => g.id === note.groupId)?.label ?? '';
  });

  // ── Results computed ───────────────────────────────────────────────────────

  resultsAccuracyPercent = computed(() => {
    const summary = this.finalSummary();
    if (!summary || summary.totalAttempts === 0) return 0;
    return Math.round((summary.correctAttempts / summary.totalAttempts) * 100);
  });

  resultsTotalTimeDisplay = computed(() =>
    formatClock((this.finalSummary()?.durationMs ?? 0) / 1000),
  );

  resultsAvgTimeDisplay = computed(() =>
    formatSeconds(this.finalSummary()?.avgTimeMsPerNote ?? 0),
  );

  worstNotes = computed(() => this.rankByMissRate(MUSIC_NOTES));

  // ── Selection management ───────────────────────────────────────────────────

  private updateSelectedNoteIds(updater: (ids: Set<string>) => Set<string>): void {
    this.selectedNoteIds.update((ids) => {
      const next = updater(ids);
      saveSelectedNoteIds(next);
      return next;
    });
  }

  toggleNote(id: string): void {
    this.updateSelectedNoteIds((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isNoteSelected(id: string): boolean {
    return this.selectedNoteIds().has(id);
  }

  isGroupFullySelected(groupId: string): boolean {
    const notes = notesForGroup(groupId);
    return notes.length > 0 && notes.every((n) => this.selectedNoteIds().has(n.id));
  }

  toggleGroup(groupId: string): void {
    const notes = notesForGroup(groupId);
    const allSelected = this.isGroupFullySelected(groupId);
    this.updateSelectedNoteIds((ids) => {
      const next = new Set(ids);
      for (const n of notes) {
        if (allSelected) {
          next.delete(n.id);
        } else {
          next.add(n.id);
        }
      }
      return next;
    });
  }

  selectAllForClef(clef: Clef): void {
    this.updateSelectedNoteIds((ids) => {
      const next = new Set(ids);
      for (const n of MUSIC_NOTES) {
        if (n.clef === clef) next.add(n.id);
      }
      return next;
    });
  }

  clearAllForClef(clef: Clef): void {
    this.updateSelectedNoteIds((ids) => {
      const next = new Set(ids);
      for (const n of MUSIC_NOTES) {
        if (n.clef === clef) next.delete(n.id);
      }
      return next;
    });
  }

  totalForClef(clef: Clef): number {
    return MUSIC_NOTES.filter((n) => n.clef === clef).length;
  }

  selectedCountForClef(clef: Clef): number {
    const ids = this.selectedNoteIds();
    return MUSIC_NOTES.filter((n) => n.clef === clef && ids.has(n.id)).length;
  }

  masteredCountForClef(clef: Clef): number {
    let count = 0;
    for (const n of MUSIC_NOTES) {
      if (n.clef === clef && this.tileBadgeFor(n.id) === 'mastered') count++;
    }
    return count;
  }

  groupSelectedCount(groupId: string): number {
    const ids = this.selectedNoteIds();
    return notesForGroup(groupId).filter((n) => ids.has(n.id)).length;
  }

  groupTotalCount(groupId: string): number {
    return notesForGroup(groupId).length;
  }

  tileBadgeFor(noteId: string): TileBadge {
    const stat = this.noteStats()[noteId];
    if (!stat || stat.attempts === 0) return null;
    if (rawMissPercent(stat) >= MOST_MISSED_THRESHOLD_PERCENT) return 'struggling';
    if (stat.attempts >= MIN_ATTEMPTS_FOR_RETENTION) {
      const accuracyPercent = (stat.correct / stat.attempts) * 100;
      if (accuracyPercent >= MASTERED_THRESHOLD_PERCENT) return 'mastered';
    }
    return null;
  }

  mostMissedNotesForClef(clef: Clef): { note: MusicNote; missPercent: number; attempts: number }[] {
    const stats = this.noteStats();
    const entries: { note: MusicNote; missPercent: number; attempts: number }[] = [];
    for (const n of MUSIC_NOTES) {
      if (n.clef !== clef) continue;
      const stat = stats[n.id];
      if (!stat || stat.attempts === 0) continue;
      if (rawMissPercent(stat) >= MOST_MISSED_THRESHOLD_PERCENT) {
        entries.push({ note: n, missPercent: Math.round(rawMissPercent(stat)), attempts: stat.attempts });
      }
    }
    return entries.sort((a, b) => b.missPercent - a.missPercent);
  }

  selectMostMissedForClef(clef: Clef): void {
    const ids = this.mostMissedNotesForClef(clef).map((e) => e.note.id);
    this.updateSelectedNoteIds((current) => {
      const next = new Set(current);
      for (const n of MUSIC_NOTES) {
        if (n.clef === clef) next.delete(n.id);
      }
      for (const id of ids) next.add(id);
      return next;
    });
  }

  private rankByMissRate(
    pool: MusicNote[],
  ): { note: MusicNote; missPercent: number; attempts: number }[] {
    const stats = this.noteStats();
    const entries: { note: MusicNote; missPercent: number; attempts: number }[] = [];
    for (const n of pool) {
      const stat = stats[n.id];
      if (stat && stat.attempts >= MIN_ATTEMPTS_FOR_RETENTION) {
        entries.push({
          note: n,
          missPercent: Math.round(rawMissPercent(stat)),
          attempts: stat.attempts,
        });
      }
    }
    return entries.sort((a, b) => b.missPercent - a.missPercent).slice(0, WORST_NOTES_LIMIT);
  }

  // ── Session management ─────────────────────────────────────────────────────

  private sessionPool: MusicNote[] = [];
  private sessionLog: SessionLogEntry[] = [];
  private lastNoteId: string | null = null;
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

  toggleHint(): void {
    if (this.viewState() !== 'practice') return;
    this.hintVisible.update((v) => !v);
  }

  startSession(): void {
    this.sessionPool = this.selectedNotes();
    if (this.sessionPool.length === 0) return;

    this.sessionLog = [];
    this.lastNoteId = null;
    this.sessionAttempts.set(0);
    this.sessionCorrect.set(0);
    this.sessionTotalTimeMs.set(0);
    this.elapsedSeconds.set(0);
    this.sessionAccumulatedMs = 0;
    this.pendingAdvanceAfterResume = false;
    this.lastEnterPressAt = 0;
    this.finalSummary.set(null);
    this.sessionMissedNotes.set([]);

    this.analytics.track('music_note_session_started', {
      noteCount: this.sessionPool.length,
    });

    this.sessionSegmentStart = Date.now();
    this.advanceToNextNote();
    this.startTimerInterval();
    this.viewState.set('practice');
  }

  onInput(value: string): void {
    if (this.viewState() !== 'practice') return;
    this.inputValue.set(value);
    const note = this.currentNote();
    if (!note) return;

    if (isExactMatch(value, note)) {
      this.recordAttempt(note, true);
      this.advanceToNextNote();
    } else if (!isValidPrefix(value, note)) {
      this.recordAttempt(note, false);
      this.feedback.set('incorrect');
      this.revealedNote.set(note.noteName);
      this.clearPendingAdvance();
      this.advanceTimeoutId = setTimeout(() => this.advanceToNextNote(), INCORRECT_ADVANCE_DELAY_MS);
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
      this.advanceToNextNote();
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
    const missedNotes = this.computeSessionMissedNotes();
    const summary: MusicSessionSummary = {
      timestamp: new Date().toISOString(),
      durationMs: this.sessionAccumulatedMs,
      totalAttempts: attempts,
      correctAttempts: this.sessionCorrect(),
      avgTimeMsPerNote: attempts > 0 ? this.sessionTotalTimeMs() / attempts : 0,
      noteCount: this.sessionPool.length,
      missedNotes,
    };

    const mergedStats = mergeSessionIntoStats(this.noteStats(), this.sessionLog);
    this.noteStats.set(mergedStats);
    saveNoteStats(mergedStats);

    if (attempts > 0) {
      const updatedHistory = [...this.history(), summary];
      this.history.set(updatedHistory);
      saveHistory(updatedHistory);
    }

    this.finalSummary.set(summary);
    this.sessionMissedNotes.set(resolveMissedNotes(missedNotes));
    this.analytics.track('music_note_session_completed', {
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

  exitPracticeToSetup(): void {
    if (this.viewState() === 'practice' || this.viewState() === 'paused') {
      this.endSession();
    }
    this.backToSetup();
  }

  downloadJson(): void {
    downloadStatsAsJson(this.noteStats(), this.history());
  }

  clearHistory(): void {
    const confirmed = confirm(
      'Clear all Music Note practice history and stats? This cannot be undone — consider downloading a backup first.',
    );
    if (!confirmed) return;

    this.noteStats.set({});
    this.history.set([]);
    saveNoteStats({});
    saveHistory([]);
    this.importMessage.set(null);
  }

  private recordAttempt(note: MusicNote, correct: boolean): void {
    const timeMs = elapsedMs(this.charAccumulatedMs, this.charSegmentStart);
    this.sessionLog.push({ noteId: note.id, correct, timeMs });
    this.sessionAttempts.update((n) => n + 1);
    if (correct) this.sessionCorrect.update((n) => n + 1);
    this.sessionTotalTimeMs.update((ms) => ms + timeMs);
  }

  private computeSessionMissedNotes(): MusicSessionMissedNote[] {
    const counts = new Map<string, number>();
    for (const entry of this.sessionLog) {
      if (!entry.correct) {
        counts.set(entry.noteId, (counts.get(entry.noteId) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([noteId, missCount]) => ({ noteId, missCount }))
      .sort((a, b) => b.missCount - a.missCount);
  }

  private advanceToNextNote(): void {
    this.clearPendingAdvance();
    const next = pickNextNote(this.sessionPool, this.noteStats(), this.lastNoteId);
    this.lastNoteId = next.id;
    this.currentNote.set(next);
    this.inputValue.set('');
    this.feedback.set('neutral');
    this.revealedNote.set(null);
    this.charAccumulatedMs = 0;
    this.charSegmentStart = Date.now();

    const inputEl = this.noteInput()?.nativeElement;
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
    setTimeout(() => this.noteInput()?.nativeElement.focus(), 0);
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
