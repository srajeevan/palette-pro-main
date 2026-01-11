import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe import for native module (prevents crash during hot reload/missing native code)
let StoreReview: any = null;
try {
    StoreReview = require('expo-store-review');
} catch (e) {
    console.warn('⚠️ ReviewService: expo-store-review module not found. Rebuild required.');
}

const STORAGE_KEY_INTERACTIONS = 'review_interaction_count';
const STORAGE_KEY_LAST_PROMPT = 'review_last_prompt_date';
const INTERACTION_THRESHOLD = 5; // Points needed to trigger review
const COOLDOWN_DAYS = 14; // Minimum days between prompts

export const reviewService = {
    /**
     * Record a positive user interaction.
     * @param weight Points to add (e.g., Save Palette = 2, Generate = 1)
     */
    async recordInteraction(weight: number = 1) {
        if (!StoreReview) return; // Exit if native module missing

        try {
            // 1. Get current count
            const currentCountStr = await AsyncStorage.getItem(STORAGE_KEY_INTERACTIONS);
            let currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

            // 2. Add weight
            currentCount += weight;
            await AsyncStorage.setItem(STORAGE_KEY_INTERACTIONS, currentCount.toString());
            console.log(`⭐ ReviewService: Interaction recorded. New count: ${currentCount}/${INTERACTION_THRESHOLD}`);

            // 3. Check if eligible
            if (currentCount >= INTERACTION_THRESHOLD) {
                await this.checkAndPrompt();
            }
        } catch (error) {
            console.error('⭐ ReviewService Error:', error);
        }
    },

    /**
     * Internal check for eligibility and cooldowns.
     */
    async checkAndPrompt() {
        if (!StoreReview) return;

        try {
            const hasAction = await StoreReview.hasAction();
            if (!hasAction) {
                console.log('⭐ ReviewService: StoreReview not available on this device/OS.');
                return;
            }

            const lastPromptStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_PROMPT);
            const now = Date.now();

            if (lastPromptStr) {
                const lastPrompt = parseInt(lastPromptStr, 10);
                const daysSince = (now - lastPrompt) / (1000 * 60 * 60 * 24);

                if (daysSince < COOLDOWN_DAYS) {
                    console.log(`⭐ ReviewService: Cooldown active. ${Math.round(daysSince)}/${COOLDOWN_DAYS} days.`);
                    return;
                }
            }

            // --- TRIGGER PROMPT ---
            console.log('⭐ ReviewService: Triggering Review Prompt!');
            await StoreReview.requestReview();

            // Reset logic
            await AsyncStorage.setItem(STORAGE_KEY_INTERACTIONS, '0'); // Reset count
            await AsyncStorage.setItem(STORAGE_KEY_LAST_PROMPT, now.toString()); // Set new timestamp

        } catch (error) {
            console.error('⭐ ReviewService Prompt Error:', error);
        }
    }
};
