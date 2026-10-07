import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReferenceCharts } from './reference-charts';

describe('ReferenceCharts', () => {
  let component: ReferenceCharts;
  let fixture: ComponentFixture<ReferenceCharts>;

  beforeEach(async () => {
    localStorage.clear();
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

  it('matches a table title and includes all of that table\'s rows', () => {
    fixture.detectChanges();
    component.search.set('days of the week');
    const matched = component.filteredCategories().flatMap((c) => c.tables);
    const table = matched.find((t) => t.title === 'Days of the Week');
    expect(table).toBeTruthy();
    expect(table!.rows.length).toBe(7);
  });

  it('matches a category label and includes every table in that category', () => {
    fixture.detectChanges();
    component.search.set('time expressions');
    const category = component
      .filteredCategories()
      .find((c) => c.label === 'Time Expressions');
    const fullCategory = component.categories.find((c) => c.label === 'Time Expressions')!;
    expect(category).toBeTruthy();
    expect(category!.tables.length).toBe(fullCategory.tables.length);
  });

  it('shows no categories when nothing matches the search', () => {
    fixture.detectChanges();
    component.search.set('definitely not a real term');
    expect(component.filteredCategories().length).toBe(0);
    expect(component.resultCount()).toBe(0);
  });

  describe('practice-set selection', () => {
    it('starts with nothing selected', () => {
      fixture.detectChanges();
      expect(component.selectedCountTotal()).toBe(0);
      expect(component.practiceDeck().length).toBe(0);
    });

    it('toggles a single table in and out of the practice set', () => {
      fixture.detectChanges();
      const table = component.categories[0].tables.find((t) => t.practiceFrontKey)!;
      expect(component.isTableSelected(table.id)).toBe(false);

      component.toggleTable(table.id);
      expect(component.isTableSelected(table.id)).toBe(true);
      expect(component.selectedCountTotal()).toBe(1);

      component.toggleTable(table.id);
      expect(component.isTableSelected(table.id)).toBe(false);
      expect(component.selectedCountTotal()).toBe(0);
    });

    it('selects and clears every practiceable table for a whole category', () => {
      fixture.detectChanges();
      const category = component.categories.find(
        (c) => c.tables.filter((t) => t.practiceFrontKey).length > 0,
      )!;
      const total = component.practiceableCountForCategory(category);

      component.selectAllForCategory(category);
      expect(component.selectedCountForCategory(category)).toBe(total);

      component.clearForCategory(category);
      expect(component.selectedCountForCategory(category)).toBe(0);
    });

    it('selects and clears every practiceable table on the page', () => {
      fixture.detectChanges();
      component.selectAllGlobal();
      expect(component.selectedCountTotal()).toBe(component.totalPracticeableCount);
      expect(component.practiceDeck().length).toBeGreaterThan(component.totalPracticeableCount);

      component.clearGlobal();
      expect(component.selectedCountTotal()).toBe(0);
      expect(component.practiceDeck().length).toBe(0);
    });

    it('toggles via a whole-tile click, but not when the click follows a text selection', () => {
      fixture.detectChanges();
      const table = component.categories[0].tables.find((t) => t.practiceFrontKey)!;

      component.onTileClick(new MouseEvent('click'), table.id);
      expect(component.isTableSelected(table.id)).toBe(true);

      const selection = { toString: () => 'some selected text' } as unknown as Selection;
      const originalGetSelection = window.getSelection;
      window.getSelection = () => selection;
      try {
        component.onTileClick(new MouseEvent('click'), table.id);
      } finally {
        window.getSelection = originalGetSelection;
      }
      expect(component.isTableSelected(table.id)).toBe(true);
    });

    it('toggles via Enter/Space on the tile, ignoring other keys', () => {
      fixture.detectChanges();
      const table = component.categories[0].tables.find((t) => t.practiceFrontKey)!;

      component.onTileKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), table.id);
      expect(component.isTableSelected(table.id)).toBe(false);

      component.onTileKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), table.id);
      expect(component.isTableSelected(table.id)).toBe(true);

      component.onTileKeydown(new KeyboardEvent('keydown', { key: ' ' }), table.id);
      expect(component.isTableSelected(table.id)).toBe(false);
    });

    it('persists selection across component instances via storage', () => {
      fixture.detectChanges();
      const table = component.categories[0].tables.find((t) => t.practiceFrontKey)!;
      component.toggleTable(table.id);

      const fixture2 = TestBed.createComponent(ReferenceCharts);
      const component2 = fixture2.componentInstance;
      expect(component2.isTableSelected(table.id)).toBe(true);
    });
  });

  describe('practice session', () => {
    it('shows an idle state when switching to Practice with nothing selected', () => {
      fixture.detectChanges();
      component.setViewMode('practice');
      expect(component.practiceState()).toBe('idle');
      expect(component.currentCard()).toBeNull();
    });

    it('builds a shuffled deck covering only the selected tables', () => {
      fixture.detectChanges();
      component.selectAllGlobal();
      component.setViewMode('practice');
      expect(component.practiceState()).toBe('active');
      expect(component.sessionDeck().length).toBe(component.practiceDeck().length);
      expect(component.currentCard()).toBeTruthy();
    });

    it('tracks knew/missed counts and finishes after the last card', () => {
      fixture.detectChanges();
      component.selectAllGlobal();
      component.startPractice();
      component.sessionDeck.set([component.practiceDeck()[0]]);
      component.currentCardIndex.set(0);

      component.revealAnswer();
      expect(component.revealed()).toBe(true);

      component.markKnew();
      expect(component.knewCount()).toBe(1);
      expect(component.practiceState()).toBe('finished');
    });

    it('reveals the answer on spacebar', () => {
      fixture.detectChanges();
      component.selectAllGlobal();
      component.setViewMode('practice');
      expect(component.revealed()).toBe(false);

      component.onPracticeKeyDown(new KeyboardEvent('keydown', { key: ' ' }));
      expect(component.revealed()).toBe(true);
    });

    it('marks missed on 1 and knew on 3, only once revealed', () => {
      fixture.detectChanges();
      component.selectAllGlobal();
      component.setViewMode('practice');
      const deck = component.practiceDeck();
      component.sessionDeck.set([deck[0], deck[1]]);
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

    it('records a completed session to history with mastery stats', () => {
      fixture.detectChanges();
      component.selectAllGlobal();
      component.startPractice();
      const deck = component.practiceDeck();
      component.sessionDeck.set([deck[0]]);
      component.currentCardIndex.set(0);

      component.revealAnswer();
      component.markKnew();

      expect(component.history().length).toBe(1);
      const entry = component.history()[0];
      expect(entry.totalAttempts).toBe(1);
      expect(entry.correctAttempts).toBe(1);
      expect(component.tileBadgeFor(deck[0].id)).toBe(null);
    });

    it('marks a card struggling after a run of misses', () => {
      fixture.detectChanges();
      component.selectAllGlobal();
      const card = component.practiceDeck()[0];

      for (let i = 0; i < 3; i++) {
        component.startPractice();
        component.sessionDeck.set([card]);
        component.currentCardIndex.set(0);
        component.revealAnswer();
        component.markMissed();
      }

      expect(component.tileBadgeFor(card.id)).toBe('struggling');
    });
  });
});
