import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Quiz } from './quiz';

describe('Quiz', () => {
  let component: Quiz;
  let fixture: ComponentFixture<Quiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Quiz] }).compileComponents();
    fixture = TestBed.createComponent(Quiz);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the unsupported-browser message when the File System Access API is unavailable', () => {
    fixture.detectChanges();
    expect(component.viewState()).toBe('unsupported');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('File System Access API');
  });
});
