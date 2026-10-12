import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PythonForCsharp } from './python-for-csharp';

describe('PythonForCsharp', () => {
  let fixture: ComponentFixture<PythonForCsharp>;
  let component: PythonForCsharp;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PythonForCsharp],
    }).compileComponents();

    fixture = TestBed.createComponent(PythonForCsharp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts in list view', () => {
    expect(component.viewState()).toBe('list');
  });

  it('opens a lesson by id', () => {
    component.openLesson('type-system');
    expect(component.viewState()).toBe('lesson');
    expect(component.selectedLesson()?.id).toBe('type-system');
  });

  it('starts quiz with answers initialized to null', () => {
    component.openLesson('type-system');
    component.startQuiz();
    expect(component.viewState()).toBe('quiz');
    const lesson = component.selectedLesson()!;
    expect(component.quizAnswers().length).toBe(lesson.quiz.length);
    expect(component.quizAnswers().every((a) => a === null)).toBe(true);
  });

  it('records selected answers', () => {
    component.openLesson('collections');
    component.startQuiz();
    component.selectAnswer(0, 2);
    expect(component.quizAnswers()[0]).toBe(2);
  });

  it('allAnswered is false until every question has an answer', () => {
    component.openLesson('type-system');
    component.startQuiz();
    expect(component.allAnswered()).toBe(false);
    const lesson = component.selectedLesson()!;
    lesson.quiz.forEach((_, i) => component.selectAnswer(i, 0));
    expect(component.allAnswered()).toBe(true);
  });

  it('calculates score correctly after submit', () => {
    component.openLesson('type-system');
    component.startQuiz();
    const lesson = component.selectedLesson()!;
    lesson.quiz.forEach((q, i) => component.selectAnswer(i, q.correctIndex));
    component.submitQuiz();
    expect(component.quizScore()).toBe(lesson.quiz.length);
  });

  it('back to list resets selected lesson', () => {
    component.openLesson('type-system');
    component.backToList();
    expect(component.viewState()).toBe('list');
    expect(component.selectedLessonId()).toBeNull();
  });
});
