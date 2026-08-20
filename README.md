# Austin Robichaux — Portfolio

Personal portfolio built with Angular, showcasing professional experience, projects, and indie game development. Deployed with Firebase Hosting and backed by Firebase Cloud Functions, Cloudflare Turnstile bot protection, and Resend for contact form email delivery.

**Live site:** [austinrobichaux.com](https://austinrobichaux.com)

## Tech stack

- **Frontend:** Angular 22 (standalone components), TypeScript, SCSS
- **Backend:** Firebase Cloud Functions (2nd gen, TypeScript)
- **Hosting:** Firebase Hosting, with CI/CD via GitHub Actions
- **Contact form:** Cloudflare Turnstile (bot protection) + Resend (transactional email)
- **Testing:** Vitest (via the Angular CLI's unit-test builder)

## Pages

| Route         | Description                              |
| ------------- | ----------------------------------------- |
| `/`           | Home — intro, stats, and skills overview  |
| `/experience` | Professional work history                 |
| `/projects`   | Featured software and engineering projects |
| `/games`      | Indie game development projects            |
| `/resume`     | Resume viewer/download                     |
| `/contact`    | Contact form                               |

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
│  ├─ data/       # Static content (projects, experience, games, skills)
│  └─ models/     # TypeScript interfaces for that content
├─ layout/        # Navbar and footer, shared across all pages
├─ pages/         # Route-level components (one folder per page)
└─ shared/        # Reusable presentational components
```

Site content (projects, experience, games, skills) is defined as static data in `src/app/core/data/` rather than fetched from an API.

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

## Deployment

Firebase Hosting deploys are automated via GitHub Actions:

- Pushes to `master` deploy to production.
- Pull requests get a preview channel deploy.

Cloud Functions are deployed manually:

```bash
cd functions
npm run deploy
```

or from root directory,

```
firebase deploy --only functions:sendContactEmail
```
