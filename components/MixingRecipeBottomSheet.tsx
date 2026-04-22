import { usePro } from '@/context/ProContext';
import { trackRecipeViewed } from '@/services/analytics';
import { getContrastColor, hexToRgb } from '@/utils/colorUtils';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { showToast } from '@/utils/toast';
import { checkDailyMixingLimit, incrementDailyMixingCount } from '@/utils/usage';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Info, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from './AppText';
import { RecipeLimitOverlay } from './RecipeLimitOverlay';

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

        // Daily Limit State
        const [isViewAllowed, setIsViewAllowed] = useState(false);
        const [dailyLimitReached, setDailyLimitReached] = useState(false);
        const [showLimitOverlay, setShowLimitOverlay] = useState(false);

        // Track which targetColor has already been counted to prevent double-counting
        const countedColorRef = useRef<string | null>(null);
        const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        useEffect(() => {
            if (targetColor) {
                // Reset State
                setIsViewAllowed(false);
                setDailyLimitReached(false);
                setShowLimitOverlay(false);
                setIsCalculating(true);
                const rgb = hexToRgb(targetColor);
                if (rgb) {
                    // Delay to let the sheet animation + loading spinner render first
                    timerRef.current = setTimeout(async () => {
                        const result = calculateMix(rgb);
                        setMixResult(result);

                        // Check Permissions (Pro or Daily Limit)
                        if (isPro) {
                            setIsViewAllowed(true);
                            trackRecipeViewed(-1); // -1 = unlimited (pro)
                        } else {
                            // Only count this color once (prevents double-counting if isPro changes)
                            const alreadyCounted = countedColorRef.current === targetColor;

                            const { allowed } = await checkDailyMixingLimit('palette');
                            if (allowed) {
                                setIsViewAllowed(true);
                                if (!alreadyCounted) {
                                    countedColorRef.current = targetColor;
                                    const newCount = await incrementDailyMixingCount('palette');
                                    trackRecipeViewed(10 - newCount);
                                    if (newCount === 5) {
                                        showToast("Halfway there! 5 of 10 free mixes used today. 🎨");
                                    } else if (newCount === 8) {
                                        showToast("Almost out! 2 free mixes left today. ⏳");
                                    }
                                }
                            } else {
                                setDailyLimitReached(true);
                                setIsViewAllowed(false);
                                // Dismiss sheet and show limit overlay
                                (ref as any)?.current?.dismiss();
                                setTimeout(() => setShowLimitOverlay(true), 300);
                            }
                        }

                        setIsCalculating(false);
                    }, 100);
                } else {
                    setIsCalculating(false);
                }
            }

            return () => {
                if (timerRef.current) clearTimeout(timerRef.current);
            };
        }, [targetColor, isPro]);

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
                                    {isViewAllowed ? (
                                        <>
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
                                            {mixResult?.reasoning && (
                                                <AppText
                                                    style={{
                                                        fontFamily: 'Inter_400Regular',
                                                        fontSize: 12,
                                                        color: '#71717A',
                                                        lineHeight: 17,
                                                        marginTop: 10,
                                                    }}
                                                >
                                                    {mixResult.reasoning}
                                                </AppText>
                                            )}
                                        </>
                                    ) : (
                                        <View style={{ position: 'relative', minHeight: 60 }}>
                                            {/* Show blurred placeholder text */}
                                            <AppText
                                                style={{
                                                    fontFamily: 'PlayfairDisplay_400Regular',
                                                    fontSize: 20,
                                                    color: '#E5E5E5',
                                                    lineHeight: 30,
                                                }}
                                            >
                                                {mixResult?.recipe || 'Recipe unavailable'}
                                            </AppText>
                                            {/* Blur overlay */}
                                            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 8 }]}>
                                                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(28,28,30,0.3)' }]}>
                                                    <AppText style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#A1A1AA' }}>
                                                        🔒 Daily limit reached
                                                    </AppText>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>

                            {/* Match Quality */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(300)} className="mb-8">
                                {(() => {
                                    const d = mixResult?.distance ?? 99;
                                    const label = d < 1 ? 'Perfect Match'
                                        : d < 2 ? 'Excellent'
                                        : d < 4 ? 'Very Good'
                                        : d < 7 ? 'Good'
                                        : d < 10 ? 'Fair'
                                        : 'Approximate';
                                    const labelColor = d < 2 ? '#22c55e'
                                        : d < 4 ? '#84cc16'
                                        : d < 7 ? '#eab308'
                                        : d < 10 ? '#f97316'
                                        : '#ef4444';
                                    const barPercent = Math.max(5, Math.min(100,
                                        d < 1 ? 100
                                        : d < 2 ? 90
                                        : d < 4 ? 75
                                        : d < 7 ? 55
                                        : d < 10 ? 35
                                        : 15
                                    ));
                                    return (
                                        <>
                                            <View className="flex-row justify-between items-end mb-2">
                                                <AppText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#A1A1AA', letterSpacing: 0.5 }}>MATCH QUALITY</AppText>
                                                <AppText style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: labelColor }}>
                                                    {label}
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
                                                <View
                                                    style={{
                                                        height: '100%',
                                                        width: `${barPercent}%`,
                                                        backgroundColor: labelColor,
                                                        borderRadius: 2,
                                                    }}
                                                />
                                            </View>
                                        </>
                                    );
                                })()}
                            </Animated.View>

                            {/* Disclaimer */}
                            <Animated.View entering={FadeInDown.springify().damping(14).delay(400)}>
                                <View className="flex-row gap-3 bg-[#28282A] p-4 rounded-xl border border-[#333]">
                                    <Info size={16} color="#71717A" style={{ marginTop: 2 }} />
                                    <AppText style={{ flex: 1, fontSize: 13, color: '#A1A1AA', lineHeight: 18, fontFamily: 'Inter_400Regular' }}>
                                        Note: Recipes are based on standard professional oil pigments. Results may vary slightly depending on the specific brand or medium used.
                                    </AppText>
                                </View>
                            </Animated.View>
                        </>
                    )}
                </BottomSheetView>
                <RecipeLimitOverlay
                    visible={showLimitOverlay && !isPro}
                    onDismiss={() => setShowLimitOverlay(false)}
                />
            </BottomSheetModal>
        );
    }
);
