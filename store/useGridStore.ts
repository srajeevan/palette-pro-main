import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface GridPreset {
    label: string;
    rows: number;
    cols: number;
    isCustom?: boolean;
}

export const STANDARD_GRIDS: GridPreset[] = [
    { label: '2 x 2', rows: 2, cols: 2 },
    { label: '3 x 3', rows: 3, cols: 3 },
    { label: '4 x 4', rows: 4, cols: 4 },
    { label: '5 x 5', rows: 5, cols: 5 },
    { label: '6 x 6', rows: 6, cols: 6 },
    { label: '8 x 8', rows: 8, cols: 8 },
    { label: '2 x 3', rows: 2, cols: 3 },
    { label: '3 x 4', rows: 3, cols: 4 },
    { label: '4 x 5', rows: 4, cols: 5 },
];

export const GRID_COLORS = [
    { label: 'White', value: '#FFFFFF' },
    { label: 'Black', value: '#000000' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Orange', value: '#F97316' },
    { label: 'Yellow', value: '#EAB308' },
    { label: 'Green', value: '#22C55E' },
    { label: 'Cyan', value: '#06B6D4' },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Purple', value: '#A855F7' },
    { label: 'Pink', value: '#EC4899' },
];

interface GridState {
    enabled: boolean;
    selectedGrid: GridPreset | null;
    customGrids: GridPreset[];
    gridOpacity: number;
    gridColor: string;
    toggleGrid: () => void;
    setEnabled: (enabled: boolean) => void;
    selectGrid: (grid: GridPreset) => void;
    addCustomGrid: (rows: number, cols: number) => void;
    removeCustomGrid: (index: number) => void;
    setGridOpacity: (opacity: number) => void;
    setGridColor: (color: string) => void;
}

export const useGridStore = create<GridState>()(
    persist(
        (set) => ({
            enabled: false,
            selectedGrid: STANDARD_GRIDS[1], // 3x3 default
            customGrids: [],
            gridOpacity: 0.4,
            gridColor: '#FFFFFF',
            toggleGrid: () => set((s) => ({ enabled: !s.enabled })),
            setEnabled: (enabled) => set({ enabled }),
            selectGrid: (grid) => set({ selectedGrid: grid, enabled: true }),
            addCustomGrid: (rows, cols) =>
                set((s) => ({
                    customGrids: [
                        ...s.customGrids,
                        { label: `${rows} x ${cols}`, rows, cols, isCustom: true },
                    ],
                })),
            removeCustomGrid: (index) =>
                set((s) => ({
                    customGrids: s.customGrids.filter((_, i) => i !== index),
                })),
            setGridOpacity: (opacity) => set({ gridOpacity: opacity }),
            setGridColor: (color) => set({ gridColor: color }),
        }),
        {
            name: 'grid-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
