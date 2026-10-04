import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  private readonly router = inject(Router);

  menuOpen = false;

  // Signal (not a plain subscription) so this zoneless app's change detection
  // actually re-renders the navbar when the route crosses into /other-modules.
  isOtherModules = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.startsWith('/other-modules')),
      startWith(this.router.url.startsWith('/other-modules'))
    )
  );

}
