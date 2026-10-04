import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearningResources } from './learning-resources';

describe('LearningResources', () => {
  let component: LearningResources;
  let fixture: ComponentFixture<LearningResources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningResources],
    }).compileComponents();
    fixture = TestBed.createComponent(LearningResources);
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

  it('filters resources by title or note text', () => {
    fixture.detectChanges();
    component.search.set('jisho');
    expect(component.filteredCategories().length).toBe(1);
    expect(component.filteredCategories()[0].resources[0].title).toBe('Jisho');
  });

  it('shows no categories when nothing matches the search', () => {
    fixture.detectChanges();
    component.search.set('definitely not a real resource');
    expect(component.filteredCategories().length).toBe(0);
    expect(component.resultCount()).toBe(0);
  });
});
