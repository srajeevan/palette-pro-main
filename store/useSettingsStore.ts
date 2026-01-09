
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
    hapticsEnabled: boolean;
    setHapticsEnabled: (enabled: boolean) => void;
    // Future: theme? currently only dark
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            hapticsEnabled: true, // Default ON
            setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
        }),
        {
            name: 'app-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
