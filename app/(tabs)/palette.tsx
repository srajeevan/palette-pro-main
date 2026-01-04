import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { MixingRecipeBottomSheet } from '@/components/MixingRecipeBottomSheet';
import { PaletteSwatch } from '@/components/PaletteSwatch';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { useAuth } from '@/context/AuthContext';
import { savePalette } from '@/services/paletteService';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { generatePalette } from '@/utils/paletteEngine';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RefreshCw, Save } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45; // Slightly reduced to fit palette

export default function PaletteScreen() {
    const {
        imageUri,
        generatedPalette,
        colorCount,
        setGeneratedPalette,
        setColorCount
    } = useProjectStore();

    console.log('🖼️ PaletteScreen render - generatedPalette:', generatedPalette);
    console.log('🖼️ PaletteScreen render - generatedPalette.length:', generatedPalette.length);

    const router = useRouter();
    const { user } = useAuth();
    const { pickImage } = useImagePicker();
    const canvasRef = useRef<ColorSkiaCanvasRef>(null);
    const mixingRecipeBottomSheetRef = useRef<BottomSheetModal>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    // Auto-generate palette on image load if empty
    React.useEffect(() => {
        if (imageUri && generatedPalette.length === 0) {
            console.log('🔄 Auto-generating palette...');
            // Small delay to ensure canvas/image is ready
            const timer = setTimeout(() => {
                handleGenerate();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [imageUri]);

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
                setGeneratedPalette(colors);
                console.log('✅ handleGenerate - setGeneratedPalette called');
            } catch (error) {
                console.error("Palette Gen Error:", error);
            }
        } else {
            console.error('❌ handleGenerate - No image snapshot available');
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
            // Silently fail if haptics not available
        });
    };

    const handleSavePalette = () => {
        if (!user) {
            Alert.alert('Not Logged In', 'Please log in to save palettes to your collection.');
            return;
        }

        if (generatedPalette.length === 0) {
            Alert.alert('No Palette', 'Please generate a palette first before saving.');
            return;
        }

        // Show input dialog for palette name
        Alert.prompt(
            'Save Palette',
            'Enter a name for this palette:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: async (name) => {
                        if (!name || name.trim() === '') {
                            Alert.alert('Invalid Name', 'Please enter a valid palette name.');
                            return;
                        }

                        setIsSaving(true);
                        const { data, error } = await savePalette({
                            name: name.trim(),
                            colors: generatedPalette,
                            image_url: imageUri
                        });
                        setIsSaving(false);

                        if (error) {
                            Alert.alert('Save Failed', error.message);
                        } else {
                            // Haptic feedback for success
                            try {
                                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } catch (e) {
                                // Silently fail if haptics not available
                            }
                            Alert.alert('Success', `"${name}" saved to your collection!`);
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
                        <UploadPlaceholderView onImageSelected={pickImage} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
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
                            onPress={handleSavePalette}
                            disabled={isSaving}
                            className={`w-10 h-10 items-center justify-center rounded-full border border-[#28282A] ${isSaving ? 'bg-[#1C1C1E]' : 'bg-[#3E63DD]'}`}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#FFF" />
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
                            overflow: 'hidden',
                            borderBottomLeftRadius: 24,
                            borderBottomRightRadius: 24,
                            backgroundColor: '#0A0A0B',
                            marginBottom: 24,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                        }}
                    >
                        <GestureDetector gesture={composedGesture}>
                            <Animated.View style={[{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }, canvasAnimatedStyle]}>
                                <ColorSkiaCanvas ref={canvasRef} />
                            </Animated.View>
                        </GestureDetector>
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
            />
        </SafeAreaView>
    );
}
