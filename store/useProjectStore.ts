import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ImageDimensions {
    width: number;
    height: number;
}

import { SaveType } from '@/services/paletteService';

interface ProjectState {
    // Existing Image State
    imageUri: string | null;
    imageDimensions: ImageDimensions | null;
    isUploading: boolean;
    setImage: (uri: string, dimensions: ImageDimensions) => void;
    setImageUri: (uri: string) => void;
    setUploading: (loading: boolean) => void;
    resetProject: () => void;

    // Palette Data
    pickedColors: string[];
    generatedPalette: string[];
    colorCount: number;
    isPaletteDirty: boolean;
    isFromSavedPalette: boolean;

    // Restored save state (set when opening a saved item from Home)
    restoredEffects: Record<string, any> | null;
    restoredSaveType: SaveType | null;

    addPickedColor: (color: string) => void;
    removePickedColor: (color: string) => void;
    setGeneratedPalette: (colors: string[], dirty?: boolean) => void;
    setColorCount: (count: number) => void;
    markPaletteSaved: () => void;
    markPaletteClean: () => void;
    clearRestoredEffects: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            imageUri: null,
            imageDimensions: null,
            isUploading: false,
            setImage: (uri, dimensions) => set({ imageUri: uri, imageDimensions: dimensions, isFromSavedPalette: false }),
            setImageUri: (uri) => set({ imageUri: uri }),
            setUploading: (loading) => set({ isUploading: loading }),
            resetProject: () => set({
                imageUri: null,
                imageDimensions: null,
                isUploading: false,
                pickedColors: [],
                generatedPalette: [],
                isPaletteDirty: false,
                isFromSavedPalette: false,
                restoredEffects: null,
                restoredSaveType: null,
            }),

            pickedColors: [],
            generatedPalette: [],
            colorCount: 6,
            isPaletteDirty: false,
            isFromSavedPalette: false,

            restoredEffects: null,
            restoredSaveType: null,
            clearRestoredEffects: () => set({ restoredEffects: null, restoredSaveType: null }),

            addPickedColor: (color) => set((state) => ({ pickedColors: [...state.pickedColors, color] })),
            removePickedColor: (color) => set((state) => ({ pickedColors: state.pickedColors.filter(c => c !== color) })),
            setGeneratedPalette: (colors, dirty = false) => {
                console.log('🏪 Store - setGeneratedPalette called with:', colors);
                console.log('🏪 Store - setGeneratedPalette colors.length:', colors.length);
                set(dirty ? { generatedPalette: colors, isPaletteDirty: true } : { generatedPalette: colors });
            },
            setColorCount: (count) => set({ colorCount: count }),
            markPaletteSaved: () => set({ isPaletteDirty: false, isFromSavedPalette: true }),
            markPaletteClean: () => set({ isPaletteDirty: false }),
        }),
        {
            name: 'palette-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ colorCount: state.colorCount }),
        }
    )
);
