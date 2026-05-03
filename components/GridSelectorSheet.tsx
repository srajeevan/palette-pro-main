import { GRID_COLORS, GridPreset, STANDARD_GRIDS, useGridStore } from '@/store/useGridStore';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Grid3x3, Plus, Trash2, X } from 'lucide-react-native';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { AppText } from './AppText';

export const GridSelectorSheet = forwardRef<BottomSheetModal>((_, ref) => {
    const {
        selectedGrid,
        customGrids,
        enabled,
        gridColor,
        selectGrid,
        toggleGrid,
        addCustomGrid,
        removeCustomGrid,
        setEnabled,
        setGridColor,
    } = useGridStore();

    const [customRows, setCustomRows] = useState('');
    const [customCols, setCustomCols] = useState('');

    const snapPoints = useMemo(() => ['70%'], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const dismiss = () => (ref as any)?.current?.dismiss();

    const handleSelect = (grid: GridPreset) => {
        selectGrid(grid);
    };

    const handleAddCustom = () => {
        const r = parseInt(customRows, 10);
        const c = parseInt(customCols, 10);
        if (!r || !c || r < 1 || c < 1 || r > 20 || c > 20) {
            Alert.alert('Invalid Size', 'Enter rows and columns between 1 and 20.');
            return;
        }
        addCustomGrid(r, c);
        setCustomRows('');
        setCustomCols('');
    };

    const isSelected = (grid: GridPreset) =>
        selectedGrid?.rows === grid.rows &&
        selectedGrid?.cols === grid.cols &&
        selectedGrid?.label === grid.label;

    const allGrids = [...STANDARD_GRIDS, ...customGrids];

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: '#161618' }}
            handleIndicatorStyle={{ backgroundColor: '#3F3F46' }}
        >
            <BottomSheetScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Grid3x3 size={20} color="#A1A1AA" />
                        <AppText style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Grid Overlay</AppText>
                    </View>
                    <TouchableOpacity onPress={dismiss}>
                        <View style={{ backgroundColor: '#27272A', padding: 4, borderRadius: 999 }}>
                            <X size={20} color="#A1A1AA" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Toggle */}
                <TouchableOpacity
                    onPress={() => {
                        if (enabled) setEnabled(false);
                        else toggleGrid();
                    }}
                    style={{
                        backgroundColor: enabled ? '#1C3A1C' : '#1C1C1E',
                        borderWidth: 1,
                        borderColor: enabled ? '#22C55E' : '#28282A',
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 20,
                        alignItems: 'center',
                    }}
                >
                    <AppText style={{ color: enabled ? '#22C55E' : '#A1A1AA', fontWeight: '600', fontSize: 14 }}>
                        {enabled ? 'Grid ON' : 'Grid OFF'}
                    </AppText>
                </TouchableOpacity>

                {/* Line Color */}
                <AppText style={{ color: '#71717A', fontSize: 12, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                    LINE COLOR
                </AppText>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                    {GRID_COLORS.map((c) => (
                        <TouchableOpacity
                            key={c.value}
                            onPress={() => setGridColor(c.value)}
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                backgroundColor: c.value,
                                borderWidth: gridColor === c.value ? 3 : 1,
                                borderColor: gridColor === c.value ? '#EA580C' : 'rgba(255,255,255,0.15)',
                            }}
                        />
                    ))}
                </View>

                {/* Standard Grids */}
                <AppText style={{ color: '#71717A', fontSize: 12, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                    STANDARD
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {STANDARD_GRIDS.map((grid, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => handleSelect(grid)}
                            style={{
                                backgroundColor: isSelected(grid) ? '#EA580C' : '#1C1C1E',
                                borderWidth: 1,
                                borderColor: isSelected(grid) ? '#EA580C' : '#28282A',
                                borderRadius: 10,
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                            }}
                        >
                            <AppText style={{
                                color: isSelected(grid) ? '#FFFFFF' : '#D4D4D8',
                                fontSize: 13,
                                fontWeight: '500',
                            }}>
                                {grid.label}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom Grids */}
                {customGrids.length > 0 && (
                    <>
                        <AppText style={{ color: '#71717A', fontSize: 12, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                            CUSTOM
                        </AppText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {customGrids.map((grid, i) => (
                                <TouchableOpacity
                                    key={`c-${i}`}
                                    onPress={() => handleSelect(grid)}
                                    onLongPress={() => {
                                        Alert.alert('Remove Grid', `Delete "${grid.label}"?`, [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Delete', style: 'destructive', onPress: () => removeCustomGrid(i) },
                                        ]);
                                    }}
                                    style={{
                                        backgroundColor: isSelected(grid) ? '#EA580C' : '#1C1C1E',
                                        borderWidth: 1,
                                        borderColor: isSelected(grid) ? '#EA580C' : '#28282A',
                                        borderRadius: 10,
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <AppText style={{
                                        color: isSelected(grid) ? '#FFFFFF' : '#D4D4D8',
                                        fontSize: 13,
                                        fontWeight: '500',
                                    }}>
                                        {grid.label}
                                    </AppText>
                                    <Trash2 size={12} color={isSelected(grid) ? '#FFFFFF' : '#71717A'} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {/* Add Custom Grid */}
                <AppText style={{ color: '#71717A', fontSize: 12, fontWeight: '600', marginBottom: 10, letterSpacing: 1 }}>
                    CREATE CUSTOM
                </AppText>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 32,
                }}>
                    <TextInput
                        value={customRows}
                        onChangeText={setCustomRows}
                        placeholder="Rows"
                        placeholderTextColor="#52525B"
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                            flex: 1,
                            backgroundColor: '#1C1C1E',
                            borderWidth: 1,
                            borderColor: '#28282A',
                            borderRadius: 10,
                            padding: 12,
                            color: '#FFFFFF',
                            fontSize: 14,
                            textAlign: 'center',
                        }}
                    />
                    <AppText style={{ color: '#71717A', fontSize: 16 }}>x</AppText>
                    <TextInput
                        value={customCols}
                        onChangeText={setCustomCols}
                        placeholder="Cols"
                        placeholderTextColor="#52525B"
                        keyboardType="number-pad"
                        maxLength={2}
                        style={{
                            flex: 1,
                            backgroundColor: '#1C1C1E',
                            borderWidth: 1,
                            borderColor: '#28282A',
                            borderRadius: 10,
                            padding: 12,
                            color: '#FFFFFF',
                            fontSize: 14,
                            textAlign: 'center',
                        }}
                    />
                    <TouchableOpacity
                        onPress={handleAddCustom}
                        style={{
                            backgroundColor: '#EA580C',
                            borderRadius: 10,
                            padding: 12,
                        }}
                    >
                        <Plus size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
});
