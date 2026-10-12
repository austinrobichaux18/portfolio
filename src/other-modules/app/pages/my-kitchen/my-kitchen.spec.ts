import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyKitchen } from './my-kitchen';
import { InMemoryKitchenStore } from './store/in-memory-kitchen-store';
import { KitchenStateService } from './store/kitchen-state.service';

describe('MyKitchen shell', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyKitchen],
      providers: [KitchenStateService, provideRouter([])],
    });
  });

  it('explains the browser requirement when the File System Access API is missing', async () => {
    const fixture = TestBed.createComponent(MyKitchen);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('File System Access API');
  });

  it('opens the read-only demo from the unsupported-browser screen', async () => {
    const fixture = TestBed.createComponent(MyKitchen);
    await fixture.whenStable();

    const button = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Try the demo'),
    )!;
    button.click();
    await fixture.whenStable();

    const state = TestBed.inject(KitchenStateService);
    expect(state.status()).toBe('ready');
    expect(state.readOnly()).toBe(true);
    expect(state.recipes().length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('sample recipes (read-only)');
  });

  it('shows the open library once a store is ready', async () => {
    await TestBed.inject(KitchenStateService).useStore(new InMemoryKitchenStore([], 'MyRecipes'));
    const fixture = TestBed.createComponent(MyKitchen);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('MyRecipes');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
