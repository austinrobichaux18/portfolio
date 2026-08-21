import { Component, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AnalyticsService } from './core/services/analytics';
import { FooterComponent } from './layout/footer/footer.component';
import { NavbarComponent } from './layout/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  private readonly router = inject(Router);

  private readonly analytics = inject(AnalyticsService);

  constructor() {

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {

        this.analytics.track('page_view', {
          page_path: event.urlAfterRedirects,
        });

      });

  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    const anchor = (event.target as HTMLElement)?.closest?.('a');

    const href = anchor?.getAttribute('href');

    if (!href) {

      return;

    }

    if (href.includes('github.com/austinrobichaux18')) {

      this.analytics.track('github_click', { link_url: href });

    } else if (href.includes('linkedin.com/in/austin-robichaux')) {

      this.analytics.track('linkedin_click', { link_url: href });

    } else if (href.endsWith('.pdf')) {

      this.analytics.track('resume_download', { link_url: href });

    }

  }

}
