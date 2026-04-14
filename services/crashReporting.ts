import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = 'https://5b8f7519ec84741928de4d781fab9e88@o4511180979699712.ingest.us.sentry.io/4511214697185280';

export function initCrashReporting() {
    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 0.2,
        enableAutoSessionTracking: true,
        attachScreenshot: true,
        enableNativeCrashHandling: true,
    });
}

export function identifyCrashUser(userId: string, email?: string, isPro?: boolean) {
    Sentry.setUser({
        id: userId,
        email: email ?? undefined,
    });
    if (isPro !== undefined) {
        Sentry.setTag('plan', isPro ? 'pro' : 'free');
    }
}

export function clearCrashUser() {
    Sentry.setUser(null);
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}

export function captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, { extra: context });
}

export { Sentry };
