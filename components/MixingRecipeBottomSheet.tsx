import { usePro } from '@/context/ProContext';
import { getContrastColor, hexToRgb } from '@/utils/colorUtils';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Lock, X } from 'lucide-react-native';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';

export type MixingRecipeBottomSheetProps = {
    targetColor: string | null;
    onUnlock: () => void;
};

export const MixingRecipeBottomSheet = forwardRef<BottomSheetModal, MixingRecipeBottomSheetProps>(
    ({ targetColor, onUnlock }, ref) => {
        // const snapPoints = useMemo(() => ['60%'], []);
        const { isPro } = usePro();
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
                            {/* Target Color View (Single) */}
                            <Animated.View
                                entering={FadeInDown.springify().damping(14).delay(100)}
                                className="mb-8"
                                style={{
                                    height: 80,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    backgroundColor: targetColor || '#000'
                                }}
                            />

                            {/* Recipe Card */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(200)}>
                                <AppText className="font-semibold mb-3 tracking-wider text-xs uppercase" style={{ color: '#A1A1AA' }}>Oil Mix Formula</AppText>
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
                                    {isPro ? (
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
                                    ) : (
                                        <TouchableOpacity activeOpacity={0.9} onPress={onUnlock} style={{ alignItems: 'center', justifyContent: 'center' }}>
                                            <View style={{ position: 'absolute', zIndex: 10, alignItems: 'center' }}>
                                                <Lock size={24} color="#F59E0B" fill="#F59E0B" />
                                                <AppText style={{ color: '#E4E4E7', fontFamily: 'Inter_700Bold', marginTop: 8, fontSize: 16 }}>
                                                    Unlock Mixing Recipe
                                                </AppText>
                                                <AppText style={{ color: '#A1A1AA', fontSize: 13, marginTop: 4 }}>
                                                    Pro users get exact paint mixtures
                                                </AppText>
                                            </View>
                                            <AppText
                                                style={{
                                                    fontFamily: 'PlayfairDisplay_400Regular',
                                                    fontSize: 20,
                                                    color: '#E5E5E5',
                                                    lineHeight: 30,
                                                    opacity: 0.15, // Heavily dimmed to verify blur effect visually
                                                    textAlign: 'center'
                                                }}
                                                className="blur-sm" // Native wind blur if available, otherwise rely on opacity+overlay
                                            >
                                                {"Titanium White + 2 parts Ultramarine Blue + Touch of Burnt Umber..."}
                                            </AppText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Animated.View>

                            {/* Match Quality */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(300)} className="mb-8">
                                <View className="flex-row justify-between items-end mb-2">
                                    <AppText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#A1A1AA', letterSpacing: 0.5 }}>ACCURACY</AppText>
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
