import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appRevealOnScroll]',
  host: { class: 'reveal-on-scroll' },
})
export class RevealOnScroll implements OnInit, OnDestroy {

    private readonly el = inject(ElementRef<HTMLElement>);

    private observer?: IntersectionObserver;

    ngOnInit(): void {

        if (typeof IntersectionObserver === 'undefined') {

            this.el.nativeElement.classList.add('revealed');

            return;

        }

        this.observer = new IntersectionObserver(
            (entries) => {

                for (const entry of entries) {

                    if (entry.isIntersecting) {

                        entry.target.classList.add('revealed');

                        this.observer?.unobserve(entry.target);

                    }

                }

            },
            { threshold: 0.15 }
        );

        this.observer.observe(this.el.nativeElement);

    }

    ngOnDestroy(): void {

        this.observer?.disconnect();

    }

}
