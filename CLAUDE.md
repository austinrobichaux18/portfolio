# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal portfolio site: an Angular 22 (standalone components) single-page app deployed to Firebase Hosting at `portfolio-bce46`, with a Cloud Functions (v2) backend in `functions/` that handles the contact form (Cloudflare Turnstile verification + Resend email). Firebase Analytics (GA4) tracks page views and key interactions client-side.

## Commands

Run from the repo root unless noted.

```bash
npm start              # ng serve — dev server at http://localhost:4200
npm run build           # ng build — production build to dist/portfolio/browser
npm run watch           # ng build --watch --configuration development
npm test                 # ng test — runs the Vitest-based Angular unit-test builder
```

- Run a single spec file: `ng test --include=**/contact.spec.ts` (or point `--include` at any glob under `src/`).
- There is no lint script configured for the Angular app itself (no ESLint/`ng lint` set up in `package.json`/`angular.json`).
- Formatting: Prettier is configured (`.prettierrc` — single quotes, 100 print width, Angular parser for `*.html`). Run via `npx prettier --write .`.

### Cloud Functions (`functions/`)

```bash
npm --prefix functions run build     # tsc -> functions/lib
npm --prefix functions run lint      # eslint --ext .js,.ts .
npm --prefix functions run serve     # build then firebase emulators:start --only functions
npm --prefix functions run shell     # build then firebase functions:shell
npm --prefix functions run deploy    # firebase deploy --only functions
```

`firebase.json` runs `lint` then `build` in `functions/` as a predeploy hook for hosting deploys — a lint or type error there blocks `firebase deploy`.

### Deploy

Firebase Hosting deploys are automated via GitHub Actions (`.github/workflows/firebase-hosting-merge.yml` on push to `master`, `firebase-hosting-pull-request.yml` for PR previews) — both run `npm ci && npm test && npm run build` then `FirebaseExtended/action-hosting-deploy`. A failing test blocks the deploy. Functions are deployed manually via the script above (not part of CI).

## Architecture

### Frontend (`src/app/`)

Standalone Angular components (no NgModules), routed via `provideRouter(routes, withViewTransitions())` in `app.config.ts` — page navigations use the browser's native View Transitions API (no `@angular/animations` dependency). Routes are defined in `app.routes.ts`; every route is **lazy-loaded** via `loadComponent: () => import(...).then(m => m.X)` rather than an eager `component:` reference, so follow that pattern when adding a new route:

- `/` → `Home`, `/experience` → `Experience`, `/projects` → `Projects`, `/projects/:id` → `ProjectDetail` (project case study, looks up the project by route param and redirects to `/projects` if not found), `/games` → `Games`, `/contact` → `Contact`, `/resume` → `Resume`, `/how-it-works` → `HowItWorks`, wildcard redirects to `/`.

Directory layout:
- `core/models/` — plain TS interfaces (`Project`, `Experience`, `Game`, `Skill`).
- `core/data/` — static in-memory arrays of that content (`projects.ts`, `experience.ts`, `games.ts`, `skills.ts`) that pages/components import directly. There is no backend/API for site content — it's all hardcoded here. Add new content by editing these arrays and their models, not by wiring up a service. `projects.ts` has a companion `projects.spec.ts` data-integrity test (unique ids, non-empty title, internal `link`s point at `/projects/{id}`) — extend it if you add fields with similar invariants.
- `core/services/` — `analytics.ts` (`AnalyticsService`, see Analytics below).
- `core/firebase-config.ts` — the Firebase web app SDK config (apiKey, appId, measurementId, etc.). This is a **public, client-side config, not a secret** — Firebase API keys are safe to commit (see Firebase's own docs); it's unrelated to the actual secrets (`TURNSTILE_SECRET`, `RESEND_API_KEY`) used server-side in `functions/`.
- `layout/` — `navbar` and `footer`, shared across all pages via `app.html`. `App` (`app.ts`) wraps `<router-outlet>` in `<main class="page-container">` — that outer element is what actually applies the page-width/padding constraint site-wide; page templates also put a `page-container` class on their own root element, which is redundant (harmless, but doesn't do anything on its own).
- `pages/` — one folder per route (`home`, `experience`, `projects`, `project-detail`, `games`, `contact`, `resume`, `how-it-works`), each with `<name>.ts`, `<name>.html`, `<name>.scss`, and usually `<name>.spec.ts`.
- `shared/` — reusable presentational components: `stat-card`, `skill-chip`, `project-card`, `timeline-item`, `reveal-on-scroll` (an `appRevealOnScroll` attribute directive that fades/slides an element in via `IntersectionObserver` the first time it scrolls into view; falls back to immediately-visible if `IntersectionObserver` is unavailable).

**Priority: keep new content data-driven.** When adding new site content (or extending existing content), prefer the `core/models/` + `core/data/` pattern over hardcoding values directly in a page's `.html`/`.ts`. If new content doesn't fit an existing model, add a new interface under `core/models/` and a matching static array under `core/data/` rather than inlining it. This applies to new work going forward — do not go back and refactor or convert existing hardcoded/inline content elsewhere in the codebase into this pattern unless specifically asked to.

**Naming inconsistency to be aware of**: newer components use bare filenames (`stat-card.ts`, `project-card.ts`, matching the class name with no suffix), while `layout/navbar/navbar.component.ts` and `layout/footer/footer.component.ts` still use the older `*.component.ts` suffix — both are in active use, just an inherited naming inconsistency, not dead code. A batch of genuinely-unused scaffolding stubs (`shared/button`, `shared/card`, `shared/hero`, `shared/section-title`, `shared/timeline`, `pages/about`, and a duplicate `skill-chip.component.ts`) was removed; if you see a `*.component.ts` file with no template content or zero references anywhere, verify before assuming it's meant to be built on.

**Styling — `src/styles.scss` is the only stylesheet actually loaded** (per `angular.json`'s `styles` array). It defines its own CSS custom properties (`--bg-primary`, `--text-primary`, `--accent-orange`, `--accent-blue`, `--border`, etc.), global focus-visible/reduced-motion rules, and the animated grid/glow background. The `src/styles/` directory (`_variables.scss`, `_colors.scss`, `_typography.scss`, `_layout.scss`, `_buttons.scss`, `_cards.scss`, `_panels.scss`, `_sections.scss`, `_heroPanel.scss`, `_animations.scss`, `_others.scss`, `_container.scss`) and `theme.scss` are **not imported by anything** — dead legacy files with their own, different set of CSS variable names. Don't assume they're wired up; most components hardcode hex colors directly rather than referencing any variable system. Component-level styles live alongside each component as `<name>.scss`.

### Contact form flow (frontend ↔ functions)

`pages/contact/contact.ts` is a reactive form (`name`, `email`, `message` — kept deliberately minimal, no `company` field) gated by an `ngx-turnstile` (Cloudflare Turnstile) widget. On submit it POSTs `{ ...formValue, token }` to `functionUrl`, hardcoded to the real deployed function (`https://sendcontactemail-7vohdas4fa-uc.a.run.app`) — this is live and working end-to-end. On success it fires a `contact_form_submit` analytics event.

`functions/src/index.ts` exports `sendContactEmail`, an `onRequest` v2 HTTPS function that:
1. Verifies the Turnstile token server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify` using the `TURNSTILE_SECRET` secret.
2. Sends the email via Resend (`RESEND_API_KEY` secret) to `austinrobichaux18+MyWebsitePortfolioForm@gmail.com`. `company` is read from the request body as optional (`company ?? "Not provided"`) even though the current frontend form no longer sends it — safe either way.

Both secrets are Firebase Functions params (`defineSecret`), set via `firebase functions:secrets:set`, not env vars in code.

### Analytics

`core/services/analytics.ts` (`AnalyticsService`, `providedIn: 'root'`) wraps Firebase Analytics (GA4). It lazily calls `isSupported()` from `firebase/analytics` before initializing — this resolves `false` in `ng test`'s jsdom environment (no IndexedDB), so the service silently no-ops in tests rather than throwing. All calls go through `analytics.track(eventName, params?)`.

Wired up in `app.ts`:
- `page_view` on every `Router` `NavigationEnd`, with `page_path` set to the new URL.
- A single `document:click` `HostListener` inspects the `href` of any clicked `<a>` and fires `github_click`, `linkedin_click`, or `resume_download` based on a URL substring/suffix match — this means any current or future link to those destinations gets tracked automatically, no per-component wiring required.

`contact.ts` fires `contact_form_submit` directly in its HTTP success callback.

### Animation

`prefers-reduced-motion: reduce` is respected globally in `styles.scss` (collapses animation/transition durations to ~0, and separately disables `::view-transition-*` pseudo-elements, which the blanket `*` rule doesn't reach). Page navigation uses Angular's native View Transitions (`withViewTransitions()` in `app.config.ts`). The home page hero fades in on load via a plain CSS `@keyframes` animation; several card grids (home page capability/project cards, experience timeline items) use the `appRevealOnScroll` directive from `shared/reveal-on-scroll/` for a scroll-triggered fade-in — note that a full-page screenshot taken without actually scrolling the page will show these elements as still-hidden (`opacity: 0`), which is correct behavior, not a bug.

### SEO

`src/index.html` has meta description, canonical URL, OpenGraph + Twitter Card tags (pointing at `public/og-image.png`, a generated 1200×630 branded preview image), and a JSON-LD `Person` structured-data block (name, job title, URL, `sameAs` for LinkedIn/GitHub, `knowsAbout` skills — no private info). `public/robots.txt` and `public/sitemap.xml` list all routes. Canonical domain used throughout is `https://austinrobichaux.com` (per the resume; Firebase's default `*.web.app`/`*.firebaseapp.com` domains are not used as canonical).

### Testing

Tests run through the Angular CLI's `@angular/build:unit-test` builder (Vitest under the hood, jsdom environment). Spec files sit next to the component they test (`*.spec.ts`). `tsconfig.spec.json` includes `vitest/globals` types, so `describe`/`it`/`expect` are global — no explicit imports needed in specs. As of this writing there are 11 spec files / 19 tests, all passing.

Any component using `routerLink` (directly or via a child component) needs `provideRouter([])` in the `TestBed` `providers` array, or `TestBed.createComponent` throws `NG0201: No provider found for ActivatedRoute`. Components with a required `@Input()` (e.g. `ProjectCard.project`, `TimelineItem.item`) need that input set on the instance before `fixture.whenStable()`/`detectChanges()`, since their templates dereference it immediately. See `project-card.spec.ts` / `timeline-item.spec.ts` for the pattern, and `project-detail.spec.ts` for mocking `ActivatedRoute`/`Router` directly (via `provide: ActivatedRoute, useValue: {...}` with `convertToParamMap`) rather than using `provideRouter`.
