import { Component, HostListener, computed, signal } from '@angular/core';
import { PYTHON_LESSONS } from '../../core/data/python-lessons';
import { PythonLesson } from '../../core/models/PythonLesson';

type ViewState = 'list' | 'lesson' | 'quiz';

@Component({
  selector: 'app-python-for-csharp',
  imports: [],
  templateUrl: './python-for-csharp.html',
  styleUrl: './python-for-csharp.scss',
})
export class PythonForCsharp {
  readonly lessons = PYTHON_LESSONS;

  viewState = signal<ViewState>('list');
  selectedLessonId = signal<string | null>(null);

  quizAnswers = signal<(number | null)[]>([]);
  quizSubmitted = signal(false);

  selectedLesson = computed<PythonLesson | null>(() => {
    const id = this.selectedLessonId();
    return id ? (this.lessons.find((l) => l.id === id) ?? null) : null;
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

  openLesson(id: string): void {
    this.selectedLessonId.set(id);
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

  /** Space advances from lesson list to first lesson (convenience shortcut). */
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.viewState() === 'quiz' && this.quizSubmitted() && event.key === 'Enter') {
      event.preventDefault();
      this.backToLesson();
    }
  }
}
