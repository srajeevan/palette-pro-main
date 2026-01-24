import AsyncStorage from '@react-native-async-storage/async-storage';

const MIXING_LIMIT_KEY_PREFIX = 'usage_mixing_';
const MAX_DAILY_MIXES = 10;

export type MixingContext = 'studio' | 'palette';

/**
 * Checks if the user has remaining free mixes for the day in the given context.
 * Returns true if allowed, false if limit reached.
 */
export const checkDailyMixingLimit = async (context: MixingContext = 'studio'): Promise<{ allowed: boolean; remaining: number }> => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `${MIXING_LIMIT_KEY_PREFIX}${context}_${today}`;

        const currentCountStr = await AsyncStorage.getItem(key);
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

        if (currentCount >= MAX_DAILY_MIXES) {
            return { allowed: false, remaining: 0 };
        }

        return { allowed: true, remaining: MAX_DAILY_MIXES - currentCount };
    } catch (error) {
        console.error('Error checking mixing limit:', error);
        // Fail open if storage fails (better UX than blocking)
        return { allowed: true, remaining: 1 };
    }
};

/**
 * Increments the daily mixing count for the given context.
 * Should be called only after the user successfully views a recipe.
 */
export const incrementDailyMixingCount = async (context: MixingContext = 'studio'): Promise<number> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const key = `${MIXING_LIMIT_KEY_PREFIX}${context}_${today}`;

        const currentCountStr = await AsyncStorage.getItem(key);
        const newCount = (currentCountStr ? parseInt(currentCountStr, 10) : 0) + 1;

        await AsyncStorage.setItem(key, newCount.toString());
        return newCount;
    } catch (error) {
        console.error('Error incrementing mixing count:', error);
        return 0;
    }
};

/**
 * Debug only: Resets the daily limit for both contexts
 */
export const resetDailyMixingLimit = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const keyStudio = `${MIXING_LIMIT_KEY_PREFIX}studio_${today}`;
        const keyPalette = `${MIXING_LIMIT_KEY_PREFIX}palette_${today}`;
        await AsyncStorage.multiRemove([keyStudio, keyPalette]);
    } catch (e) {
        console.error(e);
    }
}
