import { Component } from '@angular/core';

@Component({
  selector: 'app-how-it-works',
  imports: [],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.scss'
})
export class HowItWorks {

    architecture = [
        'Angular 22',
        'Firebase Hosting',
        'Firebase Cloud Functions',
        'Cloudflare Turnstile',
        'Resend'
    ];

    topics = [
        {
            title: 'Why Angular',
            description:
                'Angular 22 with standalone components keeps the whole site in one language, TypeScript, with strong typing and a component model suited to structured page composition: shared layout, reusable cards, and one component per route.'
        },
        {
            title: 'Why Firebase',
            description:
                'Firebase pairs static hosting with a serverless backend (Cloud Functions) and managed secrets under one platform, so the contact form\'s backend didn\'t need a separate server to provision, deploy, or maintain.'
        },
        {
            title: 'Contact Form Architecture',
            description:
                'The contact form is a reactive Angular form that POSTs to sendContactEmail, an onRequest v2 HTTPS Cloud Function that verifies the submission and sends the email, keeping every third-party API call and secret server-side, out of the browser.'
        },
        {
            title: 'Bot Protection',
            description:
                'Cloudflare Turnstile gates the contact form client-side, and the token it produces is re-verified server-side against Cloudflare\'s siteverify endpoint before any email is sent, so a spoofed or skipped client check can\'t bypass protection.'
        },
        {
            title: 'Secret Management',
            description:
                'The Turnstile secret and Resend API key are stored as Firebase Functions secret params (defineSecret), set via the Firebase CLI, never committed to the repo or embedded in client code.'
        },
        {
            title: 'CI/CD',
            description:
                'GitHub Actions builds and deploys the site automatically: a push to master deploys to production Firebase Hosting, and every pull request gets its own preview channel deploy.'
        },
        {
            title: 'Testing',
            description:
                'Unit tests run through the Angular CLI\'s Vitest-based test builder in a jsdom environment, with spec files living next to the components they test.'
        },
        {
            title: 'Deployment',
            description:
                'Firebase Hosting serves the compiled Angular build as a static SPA. Cloud Functions are deployed separately, since they change far less often than the frontend.'
        }
    ];

}
