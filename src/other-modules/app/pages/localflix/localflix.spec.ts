import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocalFlix } from './localflix';

describe('LocalFlix', () => {
  let component: LocalFlix;
  let fixture: ComponentFixture<LocalFlix>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LocalFlix] }).compileComponents();
    fixture = TestBed.createComponent(LocalFlix);
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
