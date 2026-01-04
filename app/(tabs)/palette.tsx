import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { MixingRecipeBottomSheet } from '@/components/MixingRecipeBottomSheet';
import { PaletteSwatch } from '@/components/PaletteSwatch';
import { useAuth } from '@/context/AuthContext';
import { savePalette } from '@/services/paletteService';
import { useProjectStore } from '@/store/useProjectStore';
import { generatePalette } from '@/utils/paletteEngine';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image as ImageIcon, Palette, RefreshCw, Save } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
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
    const canvasRef = useRef<ColorSkiaCanvasRef>(null);
    const mixingRecipeBottomSheetRef = useRef<BottomSheetModal>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

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
            <SafeAreaView className="flex-1 bg-stone-100">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Palette Generator"
                        subtitle="Extract colors from your image."
                    />
                    <View className="flex-1 justify-center items-center">
                        <View className="items-center justify-center p-8 bg-white rounded-2xl border-2 border-dashed border-stone-200">
                            <ImageIcon size={48} color="#d6d3d1" />
                            <AppText className="text-stone-400 mt-4 text-center font-medium">
                                No image selected
                            </AppText>
                            <AppButton
                                title="Go to Studio"
                                onPress={() => router.navigate('/(tabs)')}
                                variant="outline"
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
            <View className="flex-1 p-0">
                <View className="px-6 pt-2 pb-2 flex-row justify-between items-center">
                    <View>
                        <AppText className="text-2xl font-bold text-stone-800">Palette</AppText>
                        <AppText className="text-stone-500 text-sm">Analyze</AppText>
                    </View>
                    <View className="flex-row items-center space-x-2">
                        {user && generatedPalette.length > 0 && (
                            <TouchableOpacity
                                onPress={handleSavePalette}
                                disabled={isSaving}
                                className={`p-2 rounded-full mr-2 ${isSaving ? 'bg-stone-200' : 'bg-emerald-600'}`}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#666" />
                                ) : (
                                    <Save size={20} color="white" />
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => handleGenerate()}
                            disabled={isGenerating}
                            className={`p-2 rounded-full ${isGenerating ? 'bg-stone-200' : 'bg-stone-900'}`}
                        >
                            {isGenerating ? <ActivityIndicator size="small" color="#666" /> : <RefreshCw size={20} color="white" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Top Half: Image Canvas Container */}
                <View style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, overflow: 'hidden' }} className="mb-4 relative bg-stone-200">
                    <GestureDetector gesture={composedGesture}>
                        <Animated.View style={[{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }, canvasAnimatedStyle]}>
                            <ColorSkiaCanvas ref={canvasRef} />
                        </Animated.View>
                    </GestureDetector>
                </View>

                {/* Bottom Half: Palette Controls & Grid */}
                <View className="flex-1 bg-white rounded-t-3xl shadow-lg px-6 pt-6">
                    {/* Controls */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center space-x-2">
                            <Palette size={18} color="#78716c" />
                            <AppText className="font-semibold text-stone-600">Generated Palette ({colorCount})</AppText>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-6">
                        {[4, 6, 8, 12].map((num) => (
                            <TouchableOpacity
                                key={num}
                                onPress={() => handlePresetPress(num)}
                                className={`px-5 py-3 rounded-xl border ${colorCount === num
                                    ? 'bg-stone-800 border-stone-800'
                                    : 'bg-white border-stone-200'
                                    }`}
                            >
                                <AppText className={`font-bold ${colorCount === num ? 'text-white' : 'text-stone-600'
                                    }`}>
                                    {num}
                                </AppText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Grid */}
                    <AppText className="text-stone-600 mb-2">Palette count: {generatedPalette.length}</AppText>
                    <ScrollView className="flex-1" contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 100 }}>
                        {generatedPalette.length === 0 ? (
                            <View className="items-center justify-center py-10">
                                <AppText className="text-stone-400 text-center">Tap the refresh button above{'\n'}to generate a palette.</AppText>
                            </View>
                        ) : (
                            generatedPalette.map((color, index) => (
                                <PaletteSwatch
                                    key={`${color}-${index}`}
                                    color={color}
                                    index={index}
                                    onPress={handleSwatchPress}
                                />
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* Mixing Recipe Bottom Sheet */}
            <MixingRecipeBottomSheet
                ref={mixingRecipeBottomSheetRef}
                targetColor={selectedColor}
            />
        </SafeAreaView>
    );
}
