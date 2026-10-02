import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Kana } from './kana';

describe('Kana', () => {
  let component: Kana;
  let fixture: ComponentFixture<Kana>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kana],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Kana);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts on the setup screen with Start disabled until a kana is selected', () => {
    fixture.detectChanges();
    expect(component.viewState()).toBe('setup');
    expect(component.canStart()).toBe(false);

    component.toggleChar('hiragana:あ');
    expect(component.canStart()).toBe(true);
  });
});
