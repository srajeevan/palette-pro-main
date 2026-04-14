import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingState {
    hasCompletedOnboarding: boolean;
    identityAnswer: string | null;
    selectedUseCase: string | null;
    painPoints: string[];
    firstPaletteGenerated: boolean;

    setIdentityAnswer: (answer: string) => void;
    setSelectedUseCase: (useCase: string) => void;
    setPainPoints: (points: string[]) => void;
    completeOnboarding: () => void;
    setFirstPaletteGenerated: () => void;
    resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,
            identityAnswer: null,
            selectedUseCase: null,
            painPoints: [],
            firstPaletteGenerated: false,

            setIdentityAnswer: (answer) => set({ identityAnswer: answer }),
            setSelectedUseCase: (useCase) => set({ selectedUseCase: useCase }),
            setPainPoints: (points) => set({ painPoints: points }),
            completeOnboarding: () => set({ hasCompletedOnboarding: true }),
            setFirstPaletteGenerated: () => set({ firstPaletteGenerated: true }),
            resetOnboarding: () => set({
                hasCompletedOnboarding: false,
                identityAnswer: null,
                selectedUseCase: null,
                painPoints: [],
                firstPaletteGenerated: false,
            }),
        }),
        {
            name: 'onboarding-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
