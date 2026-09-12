import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AnalyticsService } from '../../../../app/core/services/analytics';
import { QuizQuestion } from '../../core/models/QuizQuestion';
import { QuizAttempt } from '../../core/models/QuizAttempt';
import { SampleQuiz } from '../../core/models/SampleQuiz';
import { sampleQuizzes } from '../../core/data/sample-quizzes';
import {
  clearLastFolderHandle,
  loadLastFolderHandle,
  saveLastFolderHandle,
} from './quiz-folder-store';

type AnswerKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

const REQUIRED_OPTION_KEYS: AnswerKey[] = ['a', 'b', 'c', 'd'];
const OPTIONAL_OPTION_KEYS: AnswerKey[] = ['e', 'f', 'g', 'h'];
const ALL_OPTION_KEYS: AnswerKey[] = [...REQUIRED_OPTION_KEYS, ...OPTIONAL_OPTION_KEYS];

type QuizViewState =
  | 'unsupported'
  | 'idle'
  | 'sample-list'
  | 'loading-folder'
  | 'quiz-list'
  | 'taking-quiz'
  | 'results';

const SCORES_FILE_NAME = 'quiz-scores.json';

function isValidQuizQuestion(item: unknown): item is QuizQuestion {
  if (typeof item !== 'object' || item === null) return false;
  const q = item as Record<string, unknown>;
  if (typeof q['question'] !== 'string') return false;
  if (typeof q['explanation'] !== 'string') return false;

  const opts = q['options'];
  if (typeof opts !== 'object' || opts === null) return false;
  const o = opts as Record<string, unknown>;

  if (!REQUIRED_OPTION_KEYS.every((k) => typeof o[k] === 'string')) return false;
  if (!OPTIONAL_OPTION_KEYS.every((k) => o[k] === undefined || typeof o[k] === 'string')) {
    return false;
  }

  const presentKeys = ALL_OPTION_KEYS.filter((k) => typeof o[k] === 'string');
  return presentKeys.includes(q['correctAnswer'] as AnswerKey);
}

function isValidQuizQuestionArray(data: unknown): data is QuizQuestion[] {
  return Array.isArray(data) && data.length > 0 && data.every(isValidQuizQuestion);
}

function optionKeysForQuestion(question: QuizQuestion | undefined): AnswerKey[] {
  if (!question) return [];
  return ALL_OPTION_KEYS.filter((k) => question.options[k] !== undefined);
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

function isValidQuizAttempt(item: unknown): item is QuizAttempt {
  if (typeof item !== 'object' || item === null) return false;
  const a = item as Record<string, unknown>;
  return (
    typeof a['quizFileName'] === 'string' &&
    typeof a['timestamp'] === 'string' &&
    typeof a['score'] === 'number' &&
    typeof a['total'] === 'number'
  );
}

@Component({
  selector: 'app-quiz',
  imports: [DatePipe],
  templateUrl: './quiz.html',
  styleUrl: './quiz.scss',
})
export class Quiz implements OnDestroy {
  private readonly analytics = inject(AnalyticsService);

  viewState = signal<QuizViewState>('showDirectoryPicker' in window ? 'idle' : 'unsupported');

  private dirHandle: FileSystemDirectoryHandle | null = null;

  private lastFolderHandle: FileSystemDirectoryHandle | null = null;

  lastFolderName = signal<string | null>(null);

  hasFolder = signal(false);

  isSampleMode = signal(false);

  readonly sampleQuizzes = sampleQuizzes;

  quizFiles = signal<string[]>([]);

  selectedQuizFileName = signal<string | null>(null);

  private selectedFileHandle: FileSystemFileHandle | null = null;

  private allAttempts: QuizAttempt[] = [];

  pastAttemptsForSelected = signal<QuizAttempt[]>([]);

  questions = signal<QuizQuestion[]>([]);

  currentIndex = signal(0);

  answers = signal<(AnswerKey | null)[]>([]);

  immediateFeedback = signal(false);

  revealCurrent = signal(false);

  hideAnswers = signal(false);

  private answersRevealedForCurrent = signal(false);

  score = signal(0);

  errorMessage = signal('');

  saveWarning = signal('');

  resultNotice = signal('');

  private quizStartTime: number | null = null;

  private questionStartTime: number | null = null;

  private timerIntervalId: ReturnType<typeof setInterval> | null = null;

  elapsedSeconds = signal(0);

  showTimer = signal(true);

  questionTimesMs = signal<number[]>([]);

  totalTimeMs = signal(0);

  readonly elapsedDisplay = computed(() => formatDuration(this.elapsedSeconds()));

  readonly totalTimeDisplay = computed(() => formatDuration(this.totalTimeMs() / 1000));

  readonly averageTimeDisplay = computed(() => {
    const total = this.questions().length;
    return formatDuration(total ? this.totalTimeMs() / total / 1000 : 0);
  });

  readonly formatExample = JSON.stringify([sampleQuizzes[0].questions[0]], null, 2);

  readonly scorePercent = computed(() =>
    this.questions().length ? Math.round((this.score() / this.questions().length) * 100) : 0,
  );

  readonly currentOptionKeys = computed<AnswerKey[]>(() =>
    optionKeysForQuestion(this.questions()[this.currentIndex()]),
  );

  readonly showOptions = computed(() => !this.hideAnswers() || this.answersRevealedForCurrent());

  optionKeysFor(question: QuizQuestion): AnswerKey[] {
    return optionKeysForQuestion(question);
  }

  timeForQuestion(index: number): string {
    return formatDuration((this.questionTimesMs()[index] ?? 0) / 1000);
  }

  toggleTimerVisibility(): void {
    this.showTimer.update((visible) => !visible);
  }

  private recordTimeForCurrentQuestion(): void {
    if (this.questionStartTime === null) return;
    const elapsed = Date.now() - this.questionStartTime;
    const index = this.currentIndex();
    this.questionTimesMs.update((times) => {
      const next = [...times];
      next[index] = (next[index] ?? 0) + elapsed;
      return next;
    });
  }

  private startTimerInterval(): void {
    this.stopTimerInterval();
    this.timerIntervalId = setInterval(() => {
      if (this.quizStartTime === null) return;
      this.elapsedSeconds.set(Math.floor((Date.now() - this.quizStartTime) / 1000));
    }, 1000);
  }

  private stopTimerInterval(): void {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimerInterval();
  }

  constructor() {
    if (this.viewState() === 'idle') {
      this.checkLastFolder();
    }
  }

  private async checkLastFolder(): Promise<void> {
    try {
      const handle = await loadLastFolderHandle();
      if (!handle) return;
      this.lastFolderHandle = handle;
      this.lastFolderName.set(handle.name);
    } catch {
      // No remembered folder available — not an error, just skip the shortcut.
    }
  }

  showSampleQuizzes(): void {
    this.errorMessage.set('');
    this.viewState.set('sample-list');
  }

  backToIdle(): void {
    this.errorMessage.set('');
    this.viewState.set('idle');
  }

  trySample(sample: SampleQuiz): void {
    this.errorMessage.set('');
    this.isSampleMode.set(true);
    this.questions.set(sample.questions);
    this.selectedQuizFileName.set(sample.title);
    this.pastAttemptsForSelected.set([]);
    this.analytics.track('quiz_sample_started', { sampleId: sample.id });
    this.startQuiz();
  }

  downloadSample(sample: SampleQuiz): void {
    const blob = new Blob([JSON.stringify(sample.questions, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sample.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async pickFolder(): Promise<void> {
    this.errorMessage.set('');
    this.isSampleMode.set(false);

    try {
      this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      this.errorMessage.set('Unable to access that folder.');
      return;
    }

    this.hasFolder.set(true);
    this.lastFolderHandle = this.dirHandle;
    this.lastFolderName.set(this.dirHandle.name);
    saveLastFolderHandle(this.dirHandle).catch(() => {});

    this.analytics.track('quiz_folder_selected');
    await this.loadFolderContents();
  }

  async continueWithLastFolder(): Promise<void> {
    if (!this.lastFolderHandle) return;
    this.errorMessage.set('');
    this.isSampleMode.set(false);

    try {
      let permission = await this.lastFolderHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        permission = await this.lastFolderHandle.requestPermission({ mode: 'readwrite' });
      }
      if (permission !== 'granted') {
        this.errorMessage.set('Permission to access that folder was not granted.');
        return;
      }
    } catch {
      this.errorMessage.set('That folder is no longer available. Choose a folder to continue.');
      this.lastFolderHandle = null;
      this.lastFolderName.set(null);
      clearLastFolderHandle().catch(() => {});
      return;
    }

    this.dirHandle = this.lastFolderHandle;
    this.hasFolder.set(true);
    this.analytics.track('quiz_folder_selected', { remembered: true });
    await this.loadFolderContents();
  }

  private async loadFolderContents(): Promise<void> {
    this.viewState.set('loading-folder');

    try {
      await this.loadQuizFileList();
      await this.loadScores();
      this.viewState.set('quiz-list');
    } catch {
      this.errorMessage.set('Unable to read folder contents.');
      this.viewState.set('idle');
    }
  }

  private async loadQuizFileList(): Promise<void> {
    const files: string[] = [];
    for await (const [name, handle] of this.dirHandle!.entries()) {
      if (
        handle.kind === 'file' &&
        name.toLowerCase().endsWith('.json') &&
        name !== SCORES_FILE_NAME
      ) {
        files.push(name);
      }
    }
    files.sort((a, b) => a.localeCompare(b));
    this.quizFiles.set(files);
  }

  private async loadScores(): Promise<void> {
    try {
      const fileHandle = await this.dirHandle!.getFileHandle(SCORES_FILE_NAME, { create: false });
      const file = await fileHandle.getFile();
      const parsed = JSON.parse(await file.text());
      this.allAttempts = Array.isArray(parsed) ? parsed.filter(isValidQuizAttempt) : [];
    } catch {
      this.allAttempts = [];
    }
  }

  async selectQuiz(fileName: string): Promise<void> {
    this.errorMessage.set('');

    let parsed: unknown;
    try {
      this.selectedFileHandle = await this.dirHandle!.getFileHandle(fileName);
      const file = await this.selectedFileHandle.getFile();
      parsed = JSON.parse(await file.text());
    } catch {
      this.errorMessage.set(`Could not read "${fileName}" — the file may be malformed.`);
      return;
    }

    if (!isValidQuizQuestionArray(parsed)) {
      this.errorMessage.set(`"${fileName}" is not a valid quiz file.`);
      return;
    }

    this.questions.set(parsed);
    this.selectedQuizFileName.set(fileName);
    this.pastAttemptsForSelected.set(
      this.allAttempts
        .filter((a) => a.quizFileName === fileName)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    );
    this.startQuiz();
  }

  onToggleImmediateFeedback(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.immediateFeedback.set(checked);
    this.revealCurrent.set(checked && this.answers()[this.currentIndex()] !== null);
  }

  onToggleHideAnswers(event: Event): void {
    this.hideAnswers.set((event.target as HTMLInputElement).checked);
    this.answersRevealedForCurrent.set(false);
  }

  revealAnswersForCurrent(): void {
    this.answersRevealedForCurrent.set(true);
  }

  startQuiz(): void {
    this.currentIndex.set(0);
    this.answers.set(new Array(this.questions().length).fill(null));
    this.revealCurrent.set(false);
    this.immediateFeedback.set(false);
    this.hideAnswers.set(false);
    this.answersRevealedForCurrent.set(false);
    this.saveWarning.set('');
    this.resultNotice.set('');
    this.viewState.set('taking-quiz');
    this.analytics.track('quiz_started', { quizFileName: this.selectedQuizFileName() });

    this.questionTimesMs.set(new Array(this.questions().length).fill(0));
    this.totalTimeMs.set(0);
    this.elapsedSeconds.set(0);
    this.showTimer.set(true);
    this.quizStartTime = Date.now();
    this.questionStartTime = Date.now();
    this.startTimerInterval();
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (event.button === 3) {
      const state = this.viewState();
      if (state === 'taking-quiz') {
        event.preventDefault();
        this.previousQuestion();
      } else if (state === 'results') {
        event.preventDefault();
        this.backToQuizList();
      } else if (state === 'quiz-list') {
        event.preventDefault();
        this.chooseDifferentFolder();
      } else if (state === 'sample-list') {
        event.preventDefault();
        this.backToIdle();
      }
      return;
    }

    if (event.button === 4 && this.viewState() === 'taking-quiz') {
      event.preventDefault();
      this.nextQuestion();
    }
  }

  selectAnswer(choice: AnswerKey): void {
    const index = this.currentIndex();
    this.answers.update((current) => {
      const next = [...current];
      next[index] = choice;
      return next;
    });

    if (this.immediateFeedback()) {
      this.revealCurrent.set(true);
    } else if (index < this.questions().length - 1) {
      this.goToQuestion(index + 1);
    }
  }

  goToQuestion(index: number): void {
    if (index < 0 || index >= this.questions().length) return;
    this.recordTimeForCurrentQuestion();
    this.currentIndex.set(index);
    this.questionStartTime = Date.now();
    this.revealCurrent.set(this.immediateFeedback() && this.answers()[index] !== null);
    this.answersRevealedForCurrent.set(this.answers()[index] !== null);
  }

  previousQuestion(): void {
    this.goToQuestion(this.currentIndex() - 1);
  }

  nextQuestion(): void {
    this.goToQuestion(this.currentIndex() + 1);
  }

  async finishQuiz(): Promise<void> {
    this.recordTimeForCurrentQuestion();
    this.stopTimerInterval();
    if (this.quizStartTime !== null) {
      this.totalTimeMs.set(Date.now() - this.quizStartTime);
    }

    const questions = this.questions();
    const answers = this.answers();
    const finalScore = questions.filter((q, i) => answers[i] === q.correctAnswer).length;

    this.score.set(finalScore);
    this.viewState.set('results');
    this.analytics.track('quiz_completed', {
      quizFileName: this.selectedQuizFileName(),
      score: finalScore,
      total: questions.length,
    });

    if (!this.dirHandle) {
      this.resultNotice.set(
        "This was the sample quiz — your score isn't saved. Choose a folder to save your progress across attempts.",
      );
      return;
    }

    const attempt: QuizAttempt = {
      quizFileName: this.selectedQuizFileName()!,
      timestamp: new Date().toISOString(),
      score: finalScore,
      total: questions.length,
    };
    this.allAttempts.push(attempt);
    this.pastAttemptsForSelected.set(
      this.allAttempts
        .filter((a) => a.quizFileName === attempt.quizFileName)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    );

    try {
      const fileHandle = await this.dirHandle.getFileHandle(SCORES_FILE_NAME, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(this.allAttempts, null, 2));
      await writable.close();
    } catch {
      this.saveWarning.set(
        'Your score could not be saved to quiz-scores.json (permission may have been denied).',
      );
    }
  }

  backToQuizList(): void {
    this.stopTimerInterval();
    this.errorMessage.set('');
    if (this.isSampleMode()) {
      this.viewState.set('sample-list');
    } else {
      this.viewState.set(this.hasFolder() ? 'quiz-list' : 'idle');
    }
  }

  chooseDifferentFolder(): void {
    this.dirHandle = null;
    this.hasFolder.set(false);
    this.quizFiles.set([]);
    this.selectedQuizFileName.set(null);
    this.viewState.set('idle');
  }
}
