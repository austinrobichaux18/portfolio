import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReferenceCharts } from './reference-charts';

describe('ReferenceCharts', () => {
  let component: ReferenceCharts;
  let fixture: ComponentFixture<ReferenceCharts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferenceCharts],
    }).compileComponents();
    fixture = TestBed.createComponent(ReferenceCharts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows every category with no search applied', () => {
    fixture.detectChanges();
    expect(component.filteredCategories().length).toBe(component.categories.length);
  });

  it('filters table rows by any column text', () => {
    fixture.detectChanges();
    component.search.set('monday');
    expect(component.filteredCategories().length).toBeGreaterThan(0);
    expect(component.resultCount()).toBeGreaterThan(0);
  });

  it('shows no categories when nothing matches the search', () => {
    fixture.detectChanges();
    component.search.set('definitely not a real term');
    expect(component.filteredCategories().length).toBe(0);
    expect(component.resultCount()).toBe(0);
  });

  it('starts a practice session covering every flashcard once', () => {
    fixture.detectChanges();
    component.setViewMode('practice');
    expect(component.deck().length).toBe(component.totalCards);
    expect(component.currentCard()).toBeTruthy();
  });

  it('tracks knew/missed counts and finishes after the last card', () => {
    fixture.detectChanges();
    component.setViewMode('practice');
    component.deck.set([0]);
    component.currentCardIndex.set(0);

    component.revealAnswer();
    expect(component.revealed()).toBe(true);

    component.markKnew();
    expect(component.knewCount()).toBe(1);
    expect(component.practiceState()).toBe('finished');
  });

  it('reveals the answer on spacebar', () => {
    fixture.detectChanges();
    component.setViewMode('practice');
    expect(component.revealed()).toBe(false);

    component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
    expect(component.revealed()).toBe(true);
  });

  it('marks missed on 1 and knew on 3, only once revealed', () => {
    fixture.detectChanges();
    component.setViewMode('practice');
    component.deck.set([0, 1]);
    component.currentCardIndex.set(0);

    component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: '1' }));
    expect(component.missedCount()).toBe(0);

    component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
    expect(component.revealed()).toBe(true);

    component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: '1' }));
    expect(component.missedCount()).toBe(1);
    expect(component.currentCardIndex()).toBe(1);

    component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
    component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: '3' }));
    expect(component.knewCount()).toBe(1);
    expect(component.practiceState()).toBe('finished');
  });

  it('ignores practice hotkeys while in reference mode', () => {
    fixture.detectChanges();
    expect(component.viewMode()).toBe('reference');

    component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
    expect(component.revealed()).toBe(false);
  });
});
