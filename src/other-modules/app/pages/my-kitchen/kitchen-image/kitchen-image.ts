import { Component, effect, inject, input, signal } from '@angular/core';
import { KitchenStateService } from '../store/kitchen-state.service';

/** Shows an image stored in a recipe folder, or a placeholder while loading / if it's missing. */
@Component({
  selector: 'app-kitchen-image',
  template: `
    @if (url(); as src) {
      <img [src]="src" [alt]="alt()" loading="lazy" />
    } @else {
      <div class="placeholder" aria-hidden="true">{{ placeholder() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      background: #111827;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      color: #3b4656;
      font-size: 2rem;
    }
  `,
})
export class KitchenImage {
  private readonly state = inject(KitchenStateService);

  readonly recipeId = input.required<string>();
  readonly file = input<string | undefined>();
  readonly alt = input('');
  readonly placeholder = input('🍽');

  protected readonly url = signal<string | null>(null);

  constructor() {
    effect(() => {
      const recipeId = this.recipeId();
      const file = this.file();
      this.url.set(null);
      if (!file) return;
      this.state.imageUrl(recipeId, file).then((url) => {
        // Ignore a slow load for an image this component no longer shows.
        if (this.recipeId() === recipeId && this.file() === file) this.url.set(url);
        // Photos added by hand get resized once they're first seen (no-op for everything else).
        if (url) this.state.resizeNewImages(recipeId);
      });
    });
  }
}
