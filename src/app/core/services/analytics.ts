import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { firebaseConfig } from '../firebase-config';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

    private analytics: Analytics | null = null;

    private readonly ready: Promise<void> = this.init();

    private async init(): Promise<void> {

        try {

            const supported = await isSupported();

            if (!supported) {

                return;

            }

            const app: FirebaseApp = initializeApp(firebaseConfig);

            this.analytics = getAnalytics(app);

        } catch {

            this.analytics = null;

        }

    }

    async track(eventName: string, params?: Record<string, unknown>): Promise<void> {

        await this.ready;

        if (!this.analytics) {

            return;

        }

        logEvent(this.analytics, eventName, params);

    }

}
