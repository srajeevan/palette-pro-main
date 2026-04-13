
import { trackStreakUpdated } from '@/services/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface EngagementState {
    lastActiveDate: string | null;
    currentStreak: number;
    longestStreak: number;
    unsavedPaletteTimestamp: string | null;

    recordActivity: () => void;
    setUnsavedPalette: () => void;
    clearUnsavedPalette: () => void;
    resetEngagement: () => void;
}

function getTodayISO(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getYesterdayISO(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export const useEngagementStore = create<EngagementState>()(
    persist(
        (set, get) => ({
            lastActiveDate: null,
            currentStreak: 0,
            longestStreak: 0,
            unsavedPaletteTimestamp: null,

            recordActivity: () => {
                const today = getTodayISO();
                const { lastActiveDate, currentStreak, longestStreak } = get();

                if (lastActiveDate === today) {
                    return; // already recorded today
                }

                let newStreak: number;

                if (lastActiveDate === getYesterdayISO()) {
                    newStreak = currentStreak + 1;
                } else {
                    newStreak = 1;
                }

                const newLongest = Math.max(newStreak, longestStreak);
                set({
                    lastActiveDate: today,
                    currentStreak: newStreak,
                    longestStreak: newLongest,
                });
                trackStreakUpdated(newStreak, newLongest);
            },

            setUnsavedPalette: () => {
                set({ unsavedPaletteTimestamp: new Date().toISOString() });
            },

            clearUnsavedPalette: () => {
                set({ unsavedPaletteTimestamp: null });
            },

            resetEngagement: () => {
                set({
                    lastActiveDate: null,
                    currentStreak: 0,
                    longestStreak: 0,
                    unsavedPaletteTimestamp: null,
                });
            },
        }),
        {
            name: 'engagement-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
