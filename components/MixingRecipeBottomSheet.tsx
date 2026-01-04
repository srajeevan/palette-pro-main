import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Palette, X } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { AppText } from './AppText';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { getContrastColor, hexToRgb } from '@/utils/colorUtils';

export type MixingRecipeBottomSheetProps = {
    targetColor: string | null;
};

export const MixingRecipeBottomSheet = forwardRef<BottomSheetModal, MixingRecipeBottomSheetProps>(
    ({ targetColor }, ref) => {
        const snapPoints = useMemo(() => ['60%'], []);
        const [mixResult, setMixResult] = useState<MixResult | null>(null);
        const [isCalculating, setIsCalculating] = useState(false);

        useEffect(() => {
            if (targetColor) {
                setIsCalculating(true);
                const rgb = hexToRgb(targetColor);
                if (rgb) {
                    // Small delay to allow UI to update
                    setTimeout(() => {
                        const result = calculateMix(rgb);
                        setMixResult(result);
                        setIsCalculating(false);
                    }, 100);
                } else {
                    setIsCalculating(false);
                }
            }
        }, [targetColor]);

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

        const targetTextColor = targetColor ? getContrastColor(targetColor) : '#000000';
        const mixedTextColor = mixResult?.closestColor ? getContrastColor(mixResult.closestColor) : '#000000';

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: '#fafaf9' }}
                handleIndicatorStyle={{ backgroundColor: '#d6d3d1' }}
            >
                <BottomSheetScrollView className="flex-1 px-6 pt-2 pb-8">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <View className="bg-orange-50 p-2 rounded-lg mr-3">
                                <Palette size={20} color="#ea580c" />
                            </View>
                            <AppText className="text-lg font-bold text-stone-800">Mixing Recipe</AppText>
                        </View>
                        <TouchableOpacity onPress={() => (ref as any)?.current?.dismiss()}>
                            <View className="bg-stone-200 p-1 rounded-full">
                                <X size={20} color="#78716c" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {isCalculating ? (
                        <View className="items-center justify-center py-12">
                            <ActivityIndicator size="large" color="#292524" />
                            <AppText className="text-stone-500 mt-4">Analyzing color...</AppText>
                        </View>
                    ) : (
                        <>
                            {/* Compare View */}
                            <AppText className="text-stone-600 font-semibold mb-3">Color Comparison</AppText>
                            <View className="flex-row mb-6 space-x-3">
                                {/* Target Color */}
                                <View className="flex-1">
                                    <View
                                        style={{ backgroundColor: targetColor || '#000000' }}
                                        className="h-32 rounded-2xl border-2 border-stone-200 items-center justify-center"
                                    >
                                        <AppText
                                            style={{ color: targetTextColor }}
                                            className="font-bold text-xs"
                                        >
                                            TARGET
                                        </AppText>
                                        <AppText
                                            style={{ color: targetTextColor }}
                                            className="text-xs mt-1 font-mono"
                                        >
                                            {targetColor}
                                        </AppText>
                                    </View>
                                    <AppText className="text-stone-500 text-xs text-center mt-2">
                                        Digital Color
                                    </AppText>
                                </View>

                                {/* Mixed Color */}
                                <View className="flex-1">
                                    <View
                                        style={{ backgroundColor: mixResult?.closestColor || '#000000' }}
                                        className="h-32 rounded-2xl border-2 border-stone-200 items-center justify-center"
                                    >
                                        <AppText
                                            style={{ color: mixedTextColor }}
                                            className="font-bold text-xs"
                                        >
                                            MIXED
                                        </AppText>
                                        <AppText
                                            style={{ color: mixedTextColor }}
                                            className="text-xs mt-1 font-mono"
                                        >
                                            {mixResult?.closestColor}
                                        </AppText>
                                    </View>
                                    <AppText className="text-stone-500 text-xs text-center mt-2">
                                        Physical Mix
                                    </AppText>
                                </View>
                            </View>

                            {/* Recipe Card */}
                            <AppText className="text-stone-600 font-semibold mb-3">How to Mix</AppText>
                            <View className="bg-white rounded-2xl border-2 border-stone-200 p-5 mb-4">
                                <View className="flex-row items-center mb-3">
                                    <View className="bg-orange-100 px-3 py-1 rounded-full">
                                        <AppText className="text-orange-700 font-bold text-xs">
                                            RECIPE
                                        </AppText>
                                    </View>
                                </View>
                                <AppText className="text-stone-800 text-lg font-bold leading-7">
                                    {mixResult?.recipe || 'No recipe available'}
                                </AppText>
                            </View>

                            {/* Match Quality */}
                            <View className="bg-stone-100 rounded-xl p-4 border border-stone-200">
                                <AppText className="text-stone-600 font-semibold mb-2">Match Quality</AppText>
                                <View className="flex-row items-center">
                                    <View className="flex-1 bg-stone-300 h-2 rounded-full overflow-hidden">
                                        <View
                                            style={{
                                                width: `${Math.max(0, 100 - (mixResult?.distance || 0) / 2)}%`,
                                                backgroundColor: (mixResult?.distance || 0) < 50 ? '#16a34a' : '#ea580c'
                                            }}
                                            className="h-full"
                                        />
                                    </View>
                                    <AppText className="text-stone-700 font-bold ml-3 text-sm">
                                        {mixResult?.distance !== undefined
                                            ? `${Math.round(Math.max(0, 100 - (mixResult.distance / 2)))}%`
                                            : 'N/A'}
                                    </AppText>
                                </View>
                                <AppText className="text-stone-500 text-xs mt-2">
                                    {(mixResult?.distance || 0) < 30
                                        ? 'Excellent match! Very close to target color.'
                                        : (mixResult?.distance || 0) < 60
                                            ? 'Good match. Suitable for most painting applications.'
                                            : 'Approximate match. Consider adjusting proportions.'}
                                </AppText>
                            </View>

                            {/* Info Note */}
                            <View className="bg-blue-50 rounded-xl p-4 border border-blue-200 mt-4">
                                <AppText className="text-blue-900 text-xs leading-5">
                                    💡 This recipe uses the Universal Palette. Actual results may vary based on paint brand,
                                    lighting conditions, and mixing technique. Always test on a palette first.
                                </AppText>
                            </View>
                        </>
                    )}
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);
