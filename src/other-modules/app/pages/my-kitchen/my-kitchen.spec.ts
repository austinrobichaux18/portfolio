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

  it('shows the open library once a store is ready', async () => {
    await TestBed.inject(KitchenStateService).useStore(new InMemoryKitchenStore([], 'MyRecipes'));
    const fixture = TestBed.createComponent(MyKitchen);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('MyRecipes');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
