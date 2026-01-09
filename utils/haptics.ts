
import { useSettingsStore } from '@/store/useSettingsStore';
import * as Haptics from 'expo-haptics';

// Safe wrapper that checks user preference
export const safeHaptics = {
    selection: async () => {
        if (useSettingsStore.getState().hapticsEnabled) {
            try {
                await Haptics.selectionAsync();
            } catch (e) {
                // Ignore
            }
        }
    },
    impact: async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
        if (useSettingsStore.getState().hapticsEnabled) {
            try {
                await Haptics.impactAsync(style);
            } catch (e) {
                // Ignore
            }
        }
    },
    notification: async (type: Haptics.NotificationFeedbackType) => {
        if (useSettingsStore.getState().hapticsEnabled) {
            try {
                await Haptics.notificationAsync(type);
            } catch (e) {
                // Ignore
            }
        }
    }
};
