# Austin Robichaux — Portfolio

Personal portfolio built with Angular, showcasing professional experience, projects, and indie game development. Deployed with Firebase Hosting and backed by Firebase Cloud Functions, Cloudflare Turnstile bot protection, Resend for contact form email delivery, and Firebase Analytics.

**Live site:** [austinrobichaux.com](https://austinrobichaux.com)

## Tech stack

- **Frontend:** Angular 22 (standalone components, lazy-loaded routes), TypeScript, SCSS
- **Backend:** Firebase Cloud Functions (2nd gen, TypeScript)
- **Hosting:** Firebase Hosting, with CI/CD via GitHub Actions
- **Contact form:** Cloudflare Turnstile (bot protection) + Resend (transactional email)
- **Analytics:** Firebase Analytics (GA4) — page views and key interaction events
- **Testing:** Vitest (via the Angular CLI's unit-test builder)

## Pages

| Route              | Description                                          |
| ------------------ | ----------------------------------------------------- |
| `/`                | Home — hero, metrics, capabilities, AI-assisted development, featured projects, skills, CTA |
| `/experience`      | Professional work history, with a career timeline and client-experience detail |
| `/projects`        | Featured software and engineering projects             |
| `/projects/:id`    | Individual project case study (architecture, technical challenges, deep dive, results) |
| `/games`           | Indie game development ("Indie Development")            |
| `/resume`          | Resume viewer/download                                  |
| `/contact`         | Contact form                                             |
| `/how-it-works`    | How this site itself is built and deployed (linked from the footer) |

## Getting started

### Prerequisites

- Node.js and npm
- [Firebase CLI](https://firebase.google.com/docs/cli) (for Functions/Hosting work)

### Install and run

```bash
npm install
npm start
```

The app will be available at `http://localhost:4200` and reloads automatically on source changes.

### Available scripts

| Command        | Description                                             |
| -------------- | -------------------------------------------------------- |
| `npm start`    | Runs the dev server (`ng serve`)                          |
| `npm run build`| Production build, output to `dist/portfolio/browser`      |
| `npm run watch`| Development build in watch mode                           |
| `npm test`     | Runs unit tests with Vitest                                |

## Project structure

```
src/app/
├─ core/
│  ├─ data/            # Static content (projects, experience, games, skills)
│  ├─ models/          # TypeScript interfaces for that content
│  ├─ services/        # AnalyticsService (Firebase Analytics wrapper)
│  └─ firebase-config.ts  # Public Firebase web app config (not a secret)
├─ layout/              # Navbar and footer, shared across all pages
├─ pages/               # Route-level components (one folder per page)
└─ shared/              # Reusable presentational components (project-card,
                         # stat-card, skill-chip, timeline-item, reveal-on-scroll)
```

Site content (projects, experience, games, skills) is defined as static data in `src/app/core/data/` rather than fetched from an API. When adding new content, prefer extending this pattern — a model in `core/models/` plus a data array in `core/data/` — over hardcoding values into a page template.

## Cloud Functions

`functions/` contains a single HTTPS function, `sendContactEmail`, which:

1. Verifies the Cloudflare Turnstile token submitted with the contact form.
2. Sends the message via [Resend](https://resend.com).

```bash
cd functions
npm install
npm run build
npm run serve   # run in the Firebase emulator
```

Requires two Firebase Functions secrets to be configured:

```bash
firebase functions:secrets:set TURNSTILE_SECRET
firebase functions:secrets:set RESEND_API_KEY
```

## Analytics

Firebase Analytics (GA4) is wired up via `src/app/core/services/analytics.ts`, using the config in `src/app/core/firebase-config.ts` (this is a public client-side config, not a secret — see [Firebase's docs](https://firebase.google.com/docs/projects/api-keys) on why). It tracks:

- `page_view` on every route change
- `github_click` / `linkedin_click` for any link to those profiles, and `resume_download` for the resume PDF, all via a single click-delegated listener in `app.ts` — no per-component wiring needed
- `contact_form_submit` on a successful contact form submission

The service no-ops safely if Analytics isn't supported in the current environment (e.g. `ng test`'s jsdom environment, which lacks IndexedDB), so it never breaks tests or SSR-like contexts.

## Deployment

Firebase Hosting deploys are automated via GitHub Actions:

- Pushes to `master` deploy to production.
- Pull requests get a preview channel deploy.
- Both run `npm test` before `npm run build`, so a failing test blocks deployment.

Cloud Functions are deployed manually:

```bash
cd functions
npm run deploy
```

or from root directory,

```
firebase deploy --only functions:sendContactEmail
```
