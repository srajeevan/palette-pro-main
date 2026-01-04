import { getContrastColor, hexToRgb } from '@/utils/colorUtils';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Info, X } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';

export type MixingRecipeBottomSheetProps = {
    targetColor: string | null;
};

export const MixingRecipeBottomSheet = forwardRef<BottomSheetModal, MixingRecipeBottomSheetProps>(
    ({ targetColor }, ref) => {
        // const snapPoints = useMemo(() => ['60%'], []);
        const [mixResult, setMixResult] = useState<MixResult | null>(null);
        const [isCalculating, setIsCalculating] = useState(false);
        const progress = useSharedValue(0);

        useEffect(() => {
            if (targetColor) {
                setIsCalculating(true);
                progress.value = 0; // Reset progress
                const rgb = hexToRgb(targetColor);
                if (rgb) {
                    // Small delay to allow UI to update
                    setTimeout(() => {
                        const result = calculateMix(rgb);
                        setMixResult(result);
                        setIsCalculating(false);

                        // Animate progress bar
                        const targetPercentage = result.distance !== undefined ? Math.max(0, 100 - (result.distance / 2)) : 0;
                        progress.value = withDelay(300, withTiming(targetPercentage, { duration: 800 }));
                    }, 100);
                } else {
                    setIsCalculating(false);
                }
            }
        }, [targetColor]);

        const progressStyle = useAnimatedStyle(() => ({
            width: `${progress.value}%`,
            backgroundColor: progress.value > 90
                ? '#22c55e' // Green
                : progress.value > 80
                    ? '#eab308' // Yellow
                    : '#f97316' // Orange
        }));

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
                enableDynamicSizing={true}
                backdropComponent={renderBackdrop}
                detached={true}
                bottomInset={50}
                enablePanDownToClose={true}
                style={{ marginHorizontal: 20 }}
                backgroundStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 32,
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 4,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 10,
                }}
                handleIndicatorStyle={{
                    backgroundColor: '#E0E0E0',
                    width: 40,
                    height: 5,
                    marginTop: 12,
                }}
            >
                <BottomSheetView
                    style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6 mt-2">
                        <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#1A1A1A', textAlign: 'left' }}>
                            Mixing Recipe
                        </AppText>

                        <TouchableOpacity
                            onPress={() => (ref as any)?.current?.dismiss()}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: '#F2F2F7',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={18} color="#1A1A1A" />
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
                            <Animated.View
                                entering={FadeInDown.springify().damping(14).delay(100)}
                                className="flex-row mb-8 space-x-3"
                            >
                                {/* Target Color */}
                                <View style={{ flex: 1 }}>
                                    <View
                                        style={{
                                            backgroundColor: targetColor || '#000000',
                                            height: 120,
                                            borderRadius: 20,
                                            // Shadow
                                            shadowColor: '#000',
                                            shadowOpacity: 0.1,
                                            shadowRadius: 8,
                                            shadowOffset: { width: 0, height: 4 },
                                            elevation: 4,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <AppText
                                            style={{
                                                color: targetTextColor,
                                                fontFamily: 'Inter_700Bold',
                                                fontSize: 12,
                                                letterSpacing: 1.0,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            TARGET
                                        </AppText>
                                        <AppText
                                            style={{ color: targetTextColor, opacity: 0.8 }}
                                            className="text-xs mt-1 font-mono"
                                        >
                                            {targetColor}
                                        </AppText>
                                    </View>
                                </View>

                                {/* Mixed Color */}
                                <View style={{ flex: 1 }}>
                                    <View
                                        style={{
                                            backgroundColor: mixResult?.closestColor || '#000000',
                                            height: 120,
                                            borderRadius: 20,
                                            // Shadow
                                            shadowColor: '#000',
                                            shadowOpacity: 0.1,
                                            shadowRadius: 8,
                                            shadowOffset: { width: 0, height: 4 },
                                            elevation: 4,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <AppText
                                            style={{
                                                color: mixedTextColor,
                                                fontFamily: 'Inter_700Bold',
                                                fontSize: 12,
                                                letterSpacing: 1.0,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            MIXED
                                        </AppText>
                                        <AppText
                                            style={{ color: mixedTextColor, opacity: 0.8 }}
                                            className="text-xs mt-1 font-mono"
                                        >
                                            {mixResult?.closestColor}
                                        </AppText>
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Recipe Card */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(200)}>
                                <AppText className="text-stone-600 font-semibold mb-3">How to Mix</AppText>
                                <View
                                    style={{
                                        backgroundColor: '#FAFAFA',
                                        borderWidth: 1,
                                        borderColor: '#EFEFEF',
                                        borderRadius: 16,
                                        padding: 20,
                                        marginBottom: 16
                                    }}
                                >
                                    {/* Badge */}
                                    <View
                                        style={{
                                            backgroundColor: '#EDE0D4',
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 4,
                                            alignSelf: 'flex-start',
                                            marginBottom: 12
                                        }}
                                    >
                                        <AppText
                                            style={{
                                                color: '#5D4037',
                                                fontSize: 10,
                                                fontFamily: 'Inter_700Bold',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            OIL MIX
                                        </AppText>
                                    </View>

                                    {/* Recipe Text */}
                                    <AppText
                                        style={{
                                            fontFamily: 'PlayfairDisplay_400Regular',
                                            fontSize: 18,
                                            color: '#333333',
                                            lineHeight: 28
                                        }}
                                    >
                                        {mixResult?.recipe || 'No recipe available'}
                                    </AppText>
                                </View>
                            </Animated.View>

                            {/* Match Quality */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(300)} className="mb-8">
                                <View className="flex-row justify-between items-end mb-2">
                                    <AppText className="text-stone-600 font-semibold">Match Quality</AppText>
                                    <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#1A1A1A' }}>
                                        {mixResult?.distance !== undefined
                                            ? `${Math.round(Math.max(0, 100 - (mixResult.distance / 2)))}%`
                                            : 'N/A'}
                                    </AppText>
                                </View>
                                <View
                                    style={{
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#F0F0F0',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Animated.View
                                        style={[
                                            { height: '100%' },
                                            progressStyle
                                        ]}
                                    />
                                </View>

                                {/* Info Note / Disclaimer */}
                                <View
                                    style={{
                                        backgroundColor: '#F9F9F9',
                                        borderRadius: 12,
                                        padding: 12,
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                        marginTop: 24
                                    }}
                                >
                                    <Info size={14} color="#888888" style={{ marginTop: 2, marginRight: 8 }} />
                                    <AppText
                                        style={{
                                            fontFamily: 'Inter_400Regular',
                                            fontSize: 11,
                                            color: '#888888',
                                            lineHeight: 16,
                                            flex: 1
                                        }}
                                    >
                                        This recipe uses the Universal Palette. Actual results may vary based on paint brand,
                                        lighting conditions, and mixing technique. Always test on a palette first.
                                    </AppText>
                                </View>
                            </Animated.View>
                        </>
                    )}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);
