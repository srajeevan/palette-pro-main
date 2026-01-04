import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ImageDimensions {
    width: number;
    height: number;
}

interface ProjectState {
    // Existing Image State
    imageUri: string | null;
    imageDimensions: ImageDimensions | null;
    isUploading: boolean;
    setImage: (uri: string, dimensions: ImageDimensions) => void;
    setImageUri: (uri: string) => void; // Keeping for compatibility if I used it elsewhere, but setImage covers it
    setUploading: (loading: boolean) => void;
    resetProject: () => void;

    // Palette Data
    pickedColors: string[]; // Manual picks
    generatedPalette: string[]; // Auto-generated
    colorCount: number; // Preference (3-12)

    addPickedColor: (color: string) => void;
    removePickedColor: (color: string) => void;
    setGeneratedPalette: (colors: string[]) => void;
    setColorCount: (count: number) => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            imageUri: null,
            imageDimensions: null,
            isUploading: false,
            setImage: (uri, dimensions) => set({ imageUri: uri, imageDimensions: dimensions }),
            setImageUri: (uri) => set({ imageUri: uri }),
            setUploading: (loading) => set({ isUploading: loading }),
            resetProject: () => set({
                imageUri: null,
                imageDimensions: null,
                isUploading: false,
                pickedColors: [],
                generatedPalette: []
            }),

            pickedColors: [],
            generatedPalette: [],
            colorCount: 6,

            addPickedColor: (color) => set((state) => ({ pickedColors: [...state.pickedColors, color] })),
            removePickedColor: (color) => set((state) => ({ pickedColors: state.pickedColors.filter(c => c !== color) })),
            setGeneratedPalette: (colors) => {
                console.log('🏪 Store - setGeneratedPalette called with:', colors);
                console.log('🏪 Store - setGeneratedPalette colors.length:', colors.length);
                set({ generatedPalette: colors });
            },
            setColorCount: (count) => set({ colorCount: count }),
        }),
        {
            name: 'palette-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ colorCount: state.colorCount }),
        }
    )
);
