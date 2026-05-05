import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { MixingRecipeBottomSheet } from '@/components/MixingRecipeBottomSheet';
import { PaletteSwatch } from '@/components/PaletteSwatch';
import { PaywallModal } from '@/components/PaywallModal';
import { SceneTransition } from '@/components/SceneTransition';
import { StreakBanner } from '@/components/StreakBanner';
import { UnsavedPaletteBanner } from '@/components/UnsavedPaletteBanner';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { getPaletteCount, savePalette } from '@/services/paletteService';
import { uploadReferenceImageToR2 } from '@/services/storageService';
import { trackPaletteGenerated, trackPaletteSaved } from '@/services/analytics';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { safeHaptics } from '@/utils/haptics';
import { generatePalette } from '@/utils/paletteEngine';
import { showToast } from '@/utils/toast';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Check, RefreshCw, Save } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/core';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 48; // Match px-6 padding (24 * 2)
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45;

export default function PaletteScreen() {
    const {
        imageUri,
        generatedPalette,
        colorCount,
        isPaletteDirty,
        isFromSavedPalette,
        setGeneratedPalette,
        setColorCount,
        markPaletteSaved,
        resetProject,
    } = useProjectStore();

    console.log('🖼️ PaletteScreen render - generatedPalette:', generatedPalette);
    console.log('🖼️ PaletteScreen render - generatedPalette.length:', generatedPalette.length);

    const router = useRouter();
    const { user } = useAuth();
    const { isPro } = usePro();
    const { pickImage } = useImagePicker();

    // Nudge when navigating away with unsaved palette
    const isFocused = useIsFocused();
    const wasFocused = useRef(false);

    useEffect(() => {
        if (wasFocused.current && !isFocused && isPaletteDirty && !isFromSavedPalette && generatedPalette.length > 0) {
            showToast("Don't forget to save your palette!", 3000);
        }
        wasFocused.current = isFocused;
    }, [isFocused]);

    // Inside PaletteScreen:
    const canvasRef = useRef<ColorSkiaCanvasRef>(null);
    const mixingRecipeBottomSheetRef = useRef<BottomSheetModal>(null);
    const paywallRef = useRef<BottomSheetModal>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    // Auto-generate palette on image load if empty
    // We now rely on the onImageLoaded callback from the Canvas to ensure the Skia image is ready (no race condition)
    const handleCanvasImageLoaded = () => {
        console.log('🖼️ Canvas Image Loaded - Checking auto-generate...');
        if (generatedPalette.length === 0) {
            console.log('🔄 Auto-generating palette...');
            handleGenerate();
        }
    };

    // Zoom/Pan State (Purely for viewing)
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(1, savedScale.value * e.scale);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const pan = Gesture.Pan()
        .averageTouches(true) // Smoothness for 2-finger pan
        .onUpdate((e) => {
            // Only pan if zoomed in or if intentional
            if (scale.value > 1) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            }
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    // Combine gestures (simultaneous allows pinching and panning together)
    const composedGesture = Gesture.Simultaneous(pinch, pan);

    const canvasAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    const indicatorAnimatedStyle = useAnimatedStyle(() => {
        const segmentWidth = (SCREEN_WIDTH - 48 - 8) / 4;
        const index = [4, 6, 8, 12].indexOf(colorCount);
        return {
            transform: [{ translateX: withTiming(index * segmentWidth, { duration: 250 }) }]
        };
    });

    const handleGenerate = async (overrideCount?: number) => {
        const targetCount = overrideCount || colorCount;
        setIsGenerating(true);
        // Small delay to allow UI to update to loading state
        await new Promise(r => setTimeout(r, 50));

        const image = canvasRef.current?.getImageSnapshot();
        console.log('🔍 handleGenerate - image exists:', !!image);
        if (image) {
            try {
                // Run heavy calculation
                const colors = generatePalette(image, targetCount);
                console.log('🎨 handleGenerate - colors generated:', colors);
                console.log('🎨 handleGenerate - colors length:', colors.length);
                // Mark dirty only for fresh images (not saved palettes being re-explored)
                setGeneratedPalette(colors, !isFromSavedPalette);
                console.log('✅ handleGenerate - setGeneratedPalette called');
                trackPaletteGenerated(colors.length);

                // ⭐️ Smart Review Trigger (Generation = 1 point)
                try {
                    const { reviewService } = require('@/services/reviewService');
                    if (reviewService) {
                        reviewService.recordInteraction(1);
                    }
                } catch (e) {
                    // Ignore missing module
                }

            } catch (error) {
                console.error("Palette Gen Error:", error);
            }
        } else {
            console.error('❌ handleGenerate - No image snapshot available - Image likely not fully loaded yet');
        }
        setIsGenerating(false);
    };

    const handlePresetPress = (num: number) => {
        setColorCount(num);
        handleGenerate(num);
    };

    const handleSwatchPress = (color: string) => {
        console.log("Selected swatch:", color);
        setSelectedColor(color);
        mixingRecipeBottomSheetRef.current?.present();
        // Haptic feedback with error handling
        safeHaptics.impact();
    };

    const handleSavePalette = async () => {
        if (!user) {
            showToast("Sign in to save your masterpiece! 🎨");
            return;
        }

        if (generatedPalette.length === 0) {
            showToast("Ghost palette? 👻 Generate some colors first!");
            return;
        }

        // Gating: Free Limit Check (Max 3 Palettes)
        if (!isPro) {
            setIsSaving(true);
            const count = await getPaletteCount();
            setIsSaving(false);

            if (count >= 3) {
                Alert.alert(
                    'Free Limit Reached',
                    'You can save up to 3 palettes on the free plan. Upgrade to Pro for unlimited saves.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Upgrade',
                            onPress: () => {
                                // Small delay to allow alert to close
                                setTimeout(() => {
                                    paywallRef.current?.present();
                                }, 200);
                            }
                        }
                    ]
                );
                return;
            }
        }

        // Show input dialog for palette name
        Alert.prompt(
            'Save Palette',
            'Enter a name for this palette:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: async (name?: string) => {
                        if (!name || name.trim() === '') {
                            Alert.alert('Invalid Name', 'Please enter a valid palette name.');
                            return;
                        }

                        setIsSaving(true);

                        // 1. Upload Image to Cloudflare R2 (only on save — no orphans)
                        let uploadedImageUrl = imageUri;
                        if (imageUri) {
                            // Already a remote URL (user re-opened an existing palette's image)
                            if (imageUri.startsWith('http')) {
                                console.log('☁️ Image is already remote, skipping upload.');
                                uploadedImageUrl = imageUri;
                            } else {
                                // Local JPEG → upload to R2 via presigned URL
                                console.log('⬆️ Uploading local image to R2...');
                                const publicUrl = await uploadReferenceImageToR2(imageUri);
                                if (publicUrl) {
                                    uploadedImageUrl = publicUrl;
                                    console.log('✅ R2 upload success:', publicUrl);
                                } else {
                                    // Upload failed — abort save so user isn't left with a broken row
                                    setIsSaving(false);
                                    showToast("Image upload failed. Please try again.");
                                    return;
                                }
                            }
                        }

                        // 2. Save Palette with Cloud Image URL
                        const { data, error } = await savePalette({
                            name: name.trim(),
                            colors: generatedPalette,
                            image_url: uploadedImageUrl,
                            type: 'palette',
                        });
                        setIsSaving(false);

                        if (error) {
                            showToast(error.message || "The cloud hiccuped. Try again? ☁️");
                        } else {
                            trackPaletteSaved();
                            // Haptic feedback for success
                            await safeHaptics.notification(Haptics.NotificationFeedbackType.Success);

                            // ⭐️ Smart Review Trigger
                            // Saving a palette is a high-value action (2 points)
                            try {
                                const { reviewService } = require('@/services/reviewService');
                                if (reviewService) {
                                    reviewService.recordInteraction(2);
                                }
                            } catch (e) {
                                console.log('⚠️ Review service skipped (likely native module missing):', e);
                            }

                            showToast(`"${name}" saved to Home`);

                            // Brief pause to let the toast register, then clean up and go home
                            setTimeout(() => {
                                resetProject();
                                router.replace('/' as any);
                            }, 600);
                        }
                    }
                }
            ],
            'plain-text',
            '',
            'default'
        );
    };

    if (!imageUri) {
        return (
            <SafeAreaView className="flex-1 bg-[#0A0A0B]">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Palette Generator"
                        subtitle="Extract colors from your image."
                    />
                    <View className="flex-1 -mt-20">
                        <UploadPlaceholderView />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SceneTransition style={{ flex: 1 }}>
            <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top']}>
                <View className="flex-1">
                    {/* Fixed Header */}
                    <AppHeader
                        title="Palette"
                        subtitle="ANALYZE"
                        className="mb-0 z-10 bg-[#0A0A0B]" // Ensure background covers scrolling content if needed, or let content slide under. Actually standard is header on top.
                    />

                    {/* Floating Actions (Fixed relative to screen, not scroll) */}
                    <View className="absolute top-8 right-6 flex-row items-center space-x-3 z-50">
                        {generatedPalette.length > 0 && (
                            <TouchableOpacity
                                onPress={isFromSavedPalette && !isPaletteDirty ? undefined : handleSavePalette}
                                disabled={isSaving || (isFromSavedPalette && !isPaletteDirty)}
                                style={{
                                    width: 40,
                                    height: 40,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: isFromSavedPalette && !isPaletteDirty ? '#28282A' : '#3E63DD',
                                    backgroundColor: isFromSavedPalette && !isPaletteDirty
                                        ? '#1C1C1E'
                                        : '#3E63DD',
                                }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : isFromSavedPalette && !isPaletteDirty ? (
                                    <Check size={18} color="#22c55e" />
                                ) : (
                                    <Save size={18} color="white" />
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => handleGenerate()}
                            disabled={isGenerating}
                            className="w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E] border border-[#28282A]"
                        >
                            {isGenerating ? <ActivityIndicator size="small" color="#FFF" /> : <RefreshCw size={18} color="white" />}
                        </TouchableOpacity>
                    </View>

                    {/* Engagement Banners */}
                    <StreakBanner />
                    <UnsavedPaletteBanner />

                    {/* Main Scrollable Content */}
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 140 }} // Extra padding for dock
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Image Canvas Container */}
                        <View
                            style={{
                                width: CANVAS_WIDTH,
                                height: CANVAS_HEIGHT,
                                alignSelf: 'center', // Center the narrower canvas
                                overflow: 'hidden',
                                borderRadius: 24, // Uniform radius for Floating Card look
                                backgroundColor: '#1C1C1E', // Match dark theme card background
                                marginBottom: 24,
                                marginTop: 16, // Add top margin to separate from Header
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <GestureDetector gesture={composedGesture}>
                                <Animated.View style={[{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }, canvasAnimatedStyle]}>
                                    <ColorSkiaCanvas
                                        ref={canvasRef}
                                        width={CANVAS_WIDTH}
                                        height={CANVAS_HEIGHT}
                                        onImageLoaded={handleCanvasImageLoaded}
                                    />
                                </Animated.View>
                            </GestureDetector>

                            {/* Loading Overlay (if image is loading) - relies on store state or local state derived if needed */}
                            {/* Since we don't track detailed image loading steps here easily without extra state, 
                                 setting the background to #1C1C1E prevents the harsh white flash. 
                                 The Canvas component also handles empty state.
                              */}
                        </View>

                        {/* Palette Controls & Grid */}
                        <View className="px-6">
                            {/* Controls */}
                            <View className="mb-6">
                                {/* Segmented Control Container (Dark Recessed) */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        backgroundColor: '#161618', // Surface L1
                                        borderRadius: 16,
                                        padding: 4,
                                        height: 56,
                                        borderWidth: 1,
                                        borderColor: '#28282A',
                                    }}
                                >
                                    {/* Active Indicator */}
                                    <Animated.View
                                        style={[
                                            {
                                                position: 'absolute',
                                                top: 4,
                                                bottom: 4,
                                                left: 4,
                                                width: (SCREEN_WIDTH - 48 - 8) / 4,
                                                backgroundColor: '#28282A', // Recessed Active State
                                                borderRadius: 12,
                                                borderWidth: 1,
                                                borderColor: 'rgba(255,255,255,0.05)',
                                            },
                                            indicatorAnimatedStyle
                                        ]}
                                    />

                                    {[4, 6, 8, 12].map((num) => (
                                        <TouchableOpacity
                                            key={num}
                                            onPress={() => handlePresetPress(num)}
                                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <AppText
                                                style={{
                                                    fontFamily: 'Inter_700Bold', // Always Bold for tech feel
                                                    color: colorCount === num ? '#FFFFFF' : '#525255',
                                                    fontSize: 16
                                                }}
                                            >
                                                {num}
                                            </AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Grid of Swatches */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {generatedPalette.length === 0 ? (
                                    <View className="items-center justify-center py-10 w-full">
                                        <AppText className="text-stone-500 text-center">Tap the refresh button above{'\n'}to generate a palette.</AppText>
                                    </View>
                                ) : (
                                    generatedPalette.map((color, index) => (
                                        <Animated.View
                                            key={`${color}-${index}`}
                                            entering={FadeInDown.springify().damping(12).delay(index * 50)}
                                        >
                                            <PaletteSwatch
                                                color={color}
                                                index={index}
                                                onPress={handleSwatchPress}
                                            />
                                        </Animated.View>
                                    ))
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Mixing Recipe Bottom Sheet */}
                <MixingRecipeBottomSheet
                    ref={mixingRecipeBottomSheetRef}
                    targetColor={selectedColor}
                    onUnlock={() => {
                        mixingRecipeBottomSheetRef.current?.dismiss();
                        // Small delay
                        setTimeout(() => {
                            paywallRef.current?.present();
                        }, 300);
                    }}
                />

                <PaywallModal ref={paywallRef} />
            </SafeAreaView>
        </SceneTransition>
    );
}
