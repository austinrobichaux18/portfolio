import { Component, HostListener, computed, signal } from '@angular/core';
import { PYTHON_LESSONS } from '../../core/data/python-lessons';
import { PYTHON_TOUR_FILES } from '../../core/data/python-tour-files';
import { PythonLesson } from '../../core/models/PythonLesson';
import { AppTourFile } from '../../core/models/AppTourFile';

type ViewState = 'list' | 'lesson' | 'quiz' | 'tour';

@Component({
  selector: 'app-python-for-csharp',
  imports: [],
  templateUrl: './python-for-csharp.html',
  styleUrl: './python-for-csharp.scss',
})
export class PythonForCsharp {
  readonly lessons = PYTHON_LESSONS;
  readonly tourFiles = PYTHON_TOUR_FILES;

  viewState = signal<ViewState>('list');
  selectedLessonId = signal<string | null>(null);
  selectedTourFileId = signal<string | null>(null);

  quizAnswers = signal<(number | null)[]>([]);
  quizSubmitted = signal(false);

  selectedLesson = computed<PythonLesson | null>(() => {
    const id = this.selectedLessonId();
    return id ? (this.lessons.find((l) => l.id === id) ?? null) : null;
  });

  selectedTourFile = computed<AppTourFile | null>(() => {
    const id = this.selectedTourFileId();
    return id ? (this.tourFiles.find((f) => f.id === id) ?? null) : null;
  });

  currentLessonIndex = computed(() => {
    const id = this.selectedLessonId();
    return id ? this.lessons.findIndex((l) => l.id === id) : -1;
  });

  prevLesson = computed<PythonLesson | null>(() => {
    const i = this.currentLessonIndex();
    return i > 0 ? this.lessons[i - 1] : null;
  });

  nextLesson = computed<PythonLesson | null>(() => {
    const i = this.currentLessonIndex();
    return i >= 0 && i < this.lessons.length - 1 ? this.lessons[i + 1] : null;
  });

  allAnswered = computed(() => this.quizAnswers().every((a) => a !== null));

  quizScore = computed(() => {
    const lesson = this.selectedLesson();
    const answers = this.quizAnswers();
    if (!lesson || !this.quizSubmitted()) return null;
    return answers.reduce<number>(
      (acc, answer, i) => acc + (answer === lesson.quiz[i].correctIndex ? 1 : 0),
      0,
    );
  });

  getLessonTitle(id: string): string {
    return this.lessons.find((l) => l.id === id)?.title ?? id;
  }

  switchToLessons(): void {
    this.viewState.set('list');
    this.selectedLessonId.set(null);
  }

  openTour(): void {
    if (!this.selectedTourFileId()) {
      this.selectedTourFileId.set(this.tourFiles[0]?.id ?? null);
    }
    this.viewState.set('tour');
  }

  selectTourFile(id: string): void {
    this.selectedTourFileId.set(id);
  }

  openLesson(id: string): void {
    this.selectedLessonId.set(id);
    this.quizAnswers.set([]);
    this.quizSubmitted.set(false);
    this.viewState.set('lesson');
  }

  startQuiz(): void {
    const lesson = this.selectedLesson();
    if (!lesson) return;
    this.quizAnswers.set(new Array(lesson.quiz.length).fill(null));
    this.quizSubmitted.set(false);
    this.viewState.set('quiz');
  }

  selectAnswer(questionIndex: number, optionIndex: number): void {
    if (this.quizSubmitted()) return;
    this.quizAnswers.update((answers) => {
      const next = [...answers];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  submitQuiz(): void {
    this.quizSubmitted.set(true);
  }

  backToLesson(): void {
    this.viewState.set('lesson');
  }

  backToList(): void {
    this.viewState.set('list');
    this.selectedLessonId.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.viewState() === 'quiz' && this.quizSubmitted() && event.key === 'Enter') {
      event.preventDefault();
      this.backToLesson();
    }
  }
}
