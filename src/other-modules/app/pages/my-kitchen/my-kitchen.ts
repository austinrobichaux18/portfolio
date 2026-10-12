import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { KitchenStateService } from './store/kitchen-state.service';

/** Shell for the My Kitchen child routes: folder picking first, then the routed screens. */
@Component({
  selector: 'app-my-kitchen',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './my-kitchen.html',
  styleUrl: './my-kitchen.scss',
})
export class MyKitchen {
  protected readonly state = inject(KitchenStateService);
}
