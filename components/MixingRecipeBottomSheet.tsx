import { getContrastColor, hexToRgb } from '@/utils/colorUtils';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
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
                    backgroundColor: '#1C1C1E', // Dark Card
                    borderRadius: 32,
                    borderWidth: 1,
                    borderColor: '#28282A',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                }}
                handleIndicatorStyle={{
                    backgroundColor: '#3E3E42',
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
                        <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#FFFFFF', textAlign: 'left' }}>
                            Mixing Recipe
                        </AppText>

                        <TouchableOpacity
                            onPress={() => (ref as any)?.current?.dismiss()}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: '#28282A',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {isCalculating ? (
                        <View className="items-center justify-center py-12">
                            <ActivityIndicator size="large" color="#FFFFFF" />
                            <AppText className="text-stone-400 mt-4">Analyzing color...</AppText>
                        </View>
                    ) : (
                        <>
                            {/* Compare View (Split) */}
                            <Animated.View
                                entering={FadeInDown.springify().damping(14).delay(100)}
                                className="flex-row mb-8"
                                style={{
                                    height: 80,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)'
                                }}
                            >
                                {/* Target (Left) */}
                                <View style={{ flex: 1, backgroundColor: targetColor || '#000', justifyContent: 'center', alignItems: 'center' }}>
                                    {/* Optional text or leave clean */}
                                </View>
                                {/* Mixed (Right) */}
                                <View style={{ flex: 1, backgroundColor: mixResult?.closestColor || '#000', justifyContent: 'center', alignItems: 'center' }}>

                                </View>

                                {/* Floating Badge in Center */}
                                <View
                                    style={{
                                        position: 'absolute',
                                        alignSelf: 'center',
                                        left: '50%',
                                        marginLeft: -30, // Half width
                                        backgroundColor: '#000',
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: '#333'
                                    }}
                                >
                                    <AppText style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                        {mixResult?.distance !== undefined
                                            ? `${Math.round(Math.max(0, 100 - (mixResult.distance / 2)))}%`
                                            : '--'}
                                    </AppText>
                                </View>
                            </Animated.View>

                            {/* Recipe Card */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(200)}>
                                <AppText className="text-stone-400 font-semibold mb-3 tracking-wider text-xs uppercase">Oil Mix Formula</AppText>
                                <View
                                    style={{
                                        backgroundColor: '#28282A', // L3
                                        borderWidth: 1,
                                        borderColor: '#333',
                                        borderRadius: 16,
                                        padding: 20,
                                        marginBottom: 16
                                    }}
                                >
                                    {/* Recipe Text */}
                                    <AppText
                                        style={{
                                            fontFamily: 'PlayfairDisplay_400Regular',
                                            fontSize: 20,
                                            color: '#E5E5E5',
                                            lineHeight: 30
                                        }}
                                    >
                                        {mixResult?.recipe || 'No recipe available'}
                                    </AppText>
                                </View>
                            </Animated.View>

                            {/* Match Quality */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(300)} className="mb-8">
                                <View className="flex-row justify-between items-end mb-2">
                                    <AppText className="text-stone-500 font-semibold text-xs">ACCURACY</AppText>
                                    <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#3E63DD' }}>
                                        {mixResult?.distance !== undefined
                                            ? `${Math.round(Math.max(0, 100 - (mixResult.distance / 2)))}%`
                                            : 'N/A'}
                                    </AppText>
                                </View>
                                <View
                                    style={{
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: '#333',
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
                            </Animated.View>
                        </>
                    )}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);
