# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal portfolio site: an Angular 22 (standalone components) single-page app deployed to Firebase Hosting at `portfolio-bce46`, with a Cloud Functions (v2) backend in `functions/` that handles the contact form (Cloudflare Turnstile verification + Resend email).

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

Firebase Hosting deploys are automated via GitHub Actions (`.github/workflows/firebase-hosting-merge.yml` on push to `master`, `firebase-hosting-pull-request.yml` for PR previews) — both run `npm ci && npm run build` then `FirebaseExtended/action-hosting-deploy`. Functions are deployed manually via the script above (not part of CI).

## Architecture

### Frontend (`src/app/`)

Standalone Angular components (no NgModules), routed via `provideRouter` in `app.config.ts`. Routes are defined in `app.routes.ts` and each maps a path directly to a page component with a per-route `title`:

- `/` → `Home`, `/experience` → `Experience`, `/projects` → `Projects`, `/games` → `Games`, `/contact` → `Contact`, `/resume` → `Resume`, wildcard redirects to `/`.

Directory layout:
- `core/models/` — plain TS interfaces (`Project`, `Experience`, `Game`, `Skill`).
- `core/data/` — static in-memory arrays of that content (`projects.ts`, `experience.ts`, `games.ts`, `skills.ts`) that pages/components import directly. There is no backend/API for site content — it's all hardcoded here. Add new content by editing these arrays and their models, not by wiring up a service.
- `core/services/` — currently empty; add data or HTTP services here if content ever moves off static arrays.
- `layout/` — `navbar` and `footer`, shared across all pages via `app.html`.
- `pages/` — one folder per route (`home`, `about`, `experience`, `projects`, `games`, `contact`, `resume`), each with `<name>.ts`, `<name>.html`, `<name>.scss`, and usually `<name>.spec.ts`.
- `shared/` — reusable presentational components (`hero`, `stat-card`, `skill-chip`, `project-card`, `section-title`, `timeline-item`, `card`, `button`).

**Naming inconsistency to be aware of**: newer components use bare filenames (`hero.ts`, `stat-card.ts`, `project-card.ts`, matching the class name with no suffix), while a few older/stub files still use the `*.component.ts` suffix (`button/button.component.ts`, `card/card.component.ts`, `timeline/timeline.component.ts`). Some of these (e.g. `button.component.ts`) are unused empty stubs left over from scaffolding — check for actual usages before building on top of them, and prefer the bare-filename convention for new components.

Styling: global SCSS partials live in `src/styles/` (`_variables.scss`, `_colors.scss`, `_typography.scss`, `_layout.scss`, `_buttons.scss`, `_cards.scss`, `_panels.scss`, `_sections.scss`, `_heroPanel.scss`, `_animations.scss`, `_others.scss`) and are aggregated in `theme.scss`, imported from `src/styles.scss`. Component-level styles live alongside each component as `<name>.scss`.

### Contact form flow (frontend ↔ functions)

`pages/contact/contact.ts` is a reactive form (`name`, `email`, `company`, `message`) gated by an `ngx-turnstile` (Cloudflare Turnstile) widget. On submit it POSTs `{ ...formValue, token }` to `functionUrl`, a hardcoded string currently set to the placeholder `'YOUR_FIREBASE_FUNCTION_URL'` — this needs to be updated to the deployed `sendContactEmail` function URL for the form to work end-to-end (known in-progress item, see recent commit "firebase turnstile resend setup wip").

`functions/src/index.ts` exports `sendContactEmail`, an `onRequest` v2 HTTPS function that:
1. Verifies the Turnstile token server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify` using the `TURNSTILE_SECRET` secret.
2. Sends the email via Resend (`RESEND_API_KEY` secret) to `austinrobichaux18+MyWebsitePortfolioForm@gmail.com`.

Both secrets are Firebase Functions params (`defineSecret`), set via `firebase functions:secrets:set`, not env vars in code.

### Testing

Tests run through the Angular CLI's `@angular/build:unit-test` builder (Vitest under the hood, jsdom environment). Spec files sit next to the component they test (`*.spec.ts`). `tsconfig.spec.json` includes `vitest/globals` types, so `describe`/`it`/`expect` are global — no explicit imports needed in specs.
