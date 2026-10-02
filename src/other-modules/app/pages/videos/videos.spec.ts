import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Videos } from './videos';

describe('Videos', () => {
  let component: Videos;
  let fixture: ComponentFixture<Videos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Videos] }).compileComponents();
    fixture = TestBed.createComponent(Videos);
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
