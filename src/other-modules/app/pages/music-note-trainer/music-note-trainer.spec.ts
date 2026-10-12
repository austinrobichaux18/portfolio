import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MusicNoteTrainer } from './music-note-trainer';

describe('MusicNoteTrainer', () => {
  let component: MusicNoteTrainer;
  let fixture: ComponentFixture<MusicNoteTrainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicNoteTrainer],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(MusicNoteTrainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts on the setup screen with Start disabled until a note is selected', () => {
    fixture.detectChanges();
    expect(component.viewState()).toBe('setup');
    expect(component.canStart()).toBe(false);

    component.toggleNote('treble:e4');
    expect(component.canStart()).toBe(true);
  });
});
