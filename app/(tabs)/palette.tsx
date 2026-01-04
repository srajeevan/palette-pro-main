import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { MixingNotesInput } from '@/components/MixingNotesInput';
import { MixingRecipeBottomSheet } from '@/components/MixingRecipeBottomSheet';
import { PaletteSwatch } from '@/components/PaletteSwatch';
import { useAuth } from '@/context/AuthContext';
import { savePalette } from '@/services/paletteService';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { generatePalette } from '@/utils/paletteEngine';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Image as ImageIcon, RefreshCw, Save } from 'lucide-react-native';
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
    const [notes, setNotes] = useState('');

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
            <SafeAreaView className="flex-1 bg-stone-100">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Palette Generator"
                        subtitle="Extract colors from your image."
                    />
                    <View className="flex-1 justify-center items-center">
                        <ImageIcon size={48} color="#d6d3d1" />
                        <AppText className="text-stone-400 mt-4 text-center font-medium">
                            Ready to create?
                        </AppText>
                        <AppText className="text-stone-400 text-sm text-center mb-6">
                            Select an image to generate a palette.
                        </AppText>
                        <View className="gap-3 w-full">
                            <AppButton
                                title="Choose Image"
                                onPress={pickImage}
                                variant="primary"
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
                        <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 34, color: '#1A1A1A' }}>Palette</AppText>
                        <AppText style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: '#666', letterSpacing: 0.5, marginTop: 4 }}>Analyze</AppText>
                    </View>
                    <View className="flex-row items-center space-x-2">
                        {generatedPalette.length > 0 && (
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
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: 'white',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#000',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 3,
                            }}
                        >
                            {isGenerating ? <ActivityIndicator size="small" color="#666" /> : <RefreshCw size={20} color="black" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Top Half: Image Canvas Container */}
                <View
                    style={{
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        overflow: 'hidden',
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                        // Shadow
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 15,
                        shadowOffset: { width: 0, height: 10 },
                        elevation: 5,
                        backgroundColor: '#E7E5E4', // stone-200
                        marginBottom: 16,
                    }}
                >
                    <GestureDetector gesture={composedGesture}>
                        <Animated.View style={[{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }, canvasAnimatedStyle]}>
                            <ColorSkiaCanvas ref={canvasRef} />
                        </Animated.View>
                    </GestureDetector>
                </View>

                {/* Bottom Half: Palette Controls & Grid */}
                <View className="flex-1 bg-white rounded-t-3xl shadow-lg px-6 pt-6">
                    {/* Controls */}
                    <View className="mb-6">
                        {/* Segmented Control Container */}
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: '#F2F2F7',
                                borderRadius: 16,
                                padding: 4,
                                height: 50,
                            }}
                        >
                            {/* Animated Active Indicator */}
                            {/* We need to calculate width dynamically, but for now we can use flex */}
                            <Animated.View
                                style={[
                                    {
                                        position: 'absolute',
                                        top: 4,
                                        bottom: 4,
                                        left: 4,
                                        width: (SCREEN_WIDTH - 48 - 8) / 4, // (Screen - padding - innerPadding) / 4 segments
                                        backgroundColor: 'white',
                                        borderRadius: 12,
                                        shadowColor: '#000',
                                        shadowOpacity: 0.1,
                                        shadowRadius: 2,
                                        elevation: 2,
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
                                            fontFamily: colorCount === num ? 'Inter_700Bold' : 'Inter_500Medium',
                                            color: colorCount === num ? '#000' : '#8E8E93',
                                            fontSize: 16
                                        }}
                                    >
                                        {num}
                                    </AppText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Grid */}
                    <ScrollView className="flex-1" contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: 100 }}>
                        {generatedPalette.length === 0 ? (
                            <View className="items-center justify-center py-10">
                                <AppText className="text-stone-400 text-center">Tap the refresh button above{'\n'}to generate a palette.</AppText>
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

                        {/* Field Notes Section - Now inside ScrollView */}
                        {generatedPalette.length > 0 && (
                            <View style={{ width: '100%', paddingHorizontal: 8, marginTop: 24 }}>
                                <MixingNotesInput
                                    value={notes}
                                    onChangeText={setNotes}
                                />
                            </View>
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
