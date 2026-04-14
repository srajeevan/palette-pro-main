import PostHog from 'posthog-react-native';

// ── PostHog Configuration ──
// Set these in your environment or replace directly
const POSTHOG_API_KEY = 'phc_xQYGnRZW5PYfiWWSCJdF9Xg46pG3GX3RgmUz5PNrZip3';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let posthog: PostHog | null = null;

export async function initAnalytics(): Promise<void> {
    if (POSTHOG_API_KEY === 'YOUR_POSTHOG_API_KEY') {
        console.log('[Analytics] PostHog API key not set — skipping init');
        return;
    }

    try {
        posthog = new PostHog(POSTHOG_API_KEY, {
            host: POSTHOG_HOST,
            enableSessionReplay: false,
        });
        await posthog.ready();
        console.log('[Analytics] PostHog initialized');
    } catch (e) {
        console.log('[Analytics] PostHog init failed:', e);
    }
}

// ── Identity ──

export function identifyUser(userId: string, properties?: Record<string, any>) {
    posthog?.identify(userId, properties);
}

export function setUserProperties(properties: Record<string, any>) {
    posthog?.capture('$set', { $set: properties });
}

export function resetAnalytics() {
    posthog?.reset();
}

// ── Core Event Tracker ──

export function trackEvent(event: string, properties?: Record<string, any>) {
    posthog?.capture(event, properties);
}

// ── Onboarding Events ──

export function trackOnboardingStep(step: string, properties?: Record<string, any>) {
    trackEvent('onboarding_step_viewed', { step, ...properties });
}

export function trackOnboardingCompleted(properties?: Record<string, any>) {
    trackEvent('onboarding_completed', properties);
}

export function trackGoalSelected(goal: string) {
    trackEvent('onboarding_goal_selected', { goal });
}

export function trackPainPointsSelected(painPoints: string[]) {
    trackEvent('onboarding_pain_points_selected', {
        pain_points: painPoints,
        count: painPoints.length,
    });
}

export function trackUseCaseSelected(useCases: string[]) {
    trackEvent('onboarding_use_case_selected', {
        use_cases: useCases,
        count: useCases.length,
    });
}

// ── Paywall Events ──

export function trackPaywallViewed(source: string) {
    trackEvent('paywall_viewed', { source });
}

export function trackPaywallDismissed(source: string) {
    trackEvent('paywall_dismissed', { source });
}

export function trackPaywallPurchased(source: string, plan: string) {
    trackEvent('paywall_purchased', { source, plan });
}

export function trackPaywallPlanSelected(plan: string) {
    trackEvent('paywall_plan_selected', { plan });
}

// ── Core Feature Events ──

export function trackPaletteGenerated(colorCount: number) {
    trackEvent('palette_generated', { color_count: colorCount });
}

export function trackPaletteSaved() {
    trackEvent('palette_saved');
}

export function trackRecipeViewed(remaining: number) {
    trackEvent('recipe_viewed', { remaining });
}

export function trackRecipeLimitHit() {
    trackEvent('recipe_daily_limit_hit');
}

// ── Engagement Events ──

export function trackStreakUpdated(currentStreak: number, longestStreak: number) {
    trackEvent('streak_updated', { current_streak: currentStreak, longest_streak: longestStreak });
}

// ── Screen Tracking ──

export function trackScreenView(screen: string) {
    posthog?.screen(screen);
}
