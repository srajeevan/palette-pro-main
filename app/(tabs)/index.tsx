import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorComparisonBar } from '@/components/ColorComparisonBar';
import { ColorPointer } from '@/components/ColorPointer';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { MixingRecipeModal } from '@/components/MixingRecipeModal';
import { UploadBottomSheet } from '@/components/UploadBottomSheet';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ImagePlus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default initial dimensions until measurement
const INITIAL_WIDTH = SCREEN_WIDTH;
const INITIAL_HEIGHT = SCREEN_HEIGHT * 0.6;

export default function PickerScreen() {
  const { pickImage, takePhoto } = useImagePicker();
  const { imageUri } = useProjectStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const canvasRef = useRef<ColorSkiaCanvasRef>(null);

  // Layout State
  // Layout State
  const [canvasLayout, setCanvasLayout] = useState({ width: INITIAL_WIDTH, height: INITIAL_HEIGHT });

  // Live Color State
  const [pickedColor, setPickedColor] = useState<string>('#FFFFFF');
  const [pickedRgb, setPickedRgb] = useState<{ r: number, g: number, b: number }>({ r: 255, g: 255, b: 255 });
  const [currentMix, setCurrentMix] = useState<MixResult>({
    closestColor: '#FFFFFF',
    recipe: 'Touch image to mix...',
    distance: 0
  });

  // Modal State
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);

  // Zoom/Pan State
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
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinch, pan);

  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  const handleColorChange = (screenX: number, screenY: number) => {
    const originX = canvasLayout.width / 2;
    const originY = canvasLayout.height / 2;

    const unzoomedX = ((screenX - translateX.value - originX) / scale.value) + originX;
    const unzoomedY = ((screenY - translateY.value - originY) / scale.value) + originY;

    const pixel = canvasRef.current?.getPixelColor(unzoomedX, unzoomedY);

    if (pixel) {
      const hex = `#${((1 << 24) + (pixel.r << 16) + (pixel.g << 8) + pixel.b).toString(16).slice(1).toUpperCase()}`;
      setPickedRgb(pixel);
      setPickedColor(hex);
      const mix = calculateMix(pixel);
      setCurrentMix(mix);
    }
  };

  const handlePresentUploadModal = () => {
    bottomSheetRef.current?.present();
  };

  const handlePresentRecipeModal = () => {
    setIsRecipeModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f4' }}>
      {!imageUri && (
        <Animated.View
          entering={FadeIn.duration(800)}
          exiting={FadeOut.duration(800)}
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
        >
          <SafeAreaView className="flex-1 bg-stone-100">
            <View className="flex-1 px-6 pt-10">
              <AppHeader
                title="Studio"
                subtitle="Select an image to start."
              />
              <UploadPlaceholderView onImageSelected={(uri) => console.log('Image selected:', uri)} />
              <UploadBottomSheet
                ref={bottomSheetRef}
                onPickImage={pickImage}
                onTakePhoto={takePhoto}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {imageUri && (
        <Animated.View
          entering={FadeIn.duration(800)}
          exiting={FadeOut.duration(800)}
          style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
        >
          <SafeAreaView className="flex-1 bg-stone-100" edges={['top', 'bottom']}>
            <View className="flex-1 p-0" style={{ paddingBottom: 110 }}>
              {/* Compact Header */}
              <View className="px-6 pt-2 pb-2 flex-row justify-between items-center z-10 bg-stone-100 border-b border-stone-200">
                <View className="flex-row items-baseline space-x-2">
                  <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#1A1A1A' }} className="text-2xl">Studio</AppText>
                  <AppText style={{ fontFamily: 'Inter_400Regular', color: '#9ca3af' }} className="text-xs">Pick & Mix</AppText>
                </View>
                <Pressable
                  onPress={handlePresentUploadModal}
                  className="p-2 bg-white rounded-full border border-stone-200 shadow-sm active:opacity-70"
                >
                  <ImagePlus size={20} color="#57534e" />
                </Pressable>
              </View>

              {/* Main Canvas Area */}
              <View style={{ flex: 1, overflow: 'hidden' }} className="relative bg-[#1A1A1A]">
                <View
                  style={{ flex: 1 }}
                  onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setCanvasLayout({ width, height });
                  }}
                >
                  <GestureDetector gesture={composedGesture}>
                    <Animated.View style={[{ width: '100%', height: '100%' }, canvasAnimatedStyle]}>
                      <ColorSkiaCanvas
                        ref={canvasRef}
                        width={canvasLayout.width}
                        height={canvasLayout.height}
                      />
                    </Animated.View>
                  </GestureDetector>

                  <ColorPointer
                    canvasWidth={canvasLayout.width}
                    canvasHeight={canvasLayout.height}
                    onColorChange={handleColorChange}
                  />
                </View>
              </View>

              {/* Bottom Comparison Bar */}
              <ColorComparisonBar
                color={pickedColor}
                rgb={`${pickedRgb.r}, ${pickedRgb.g}, ${pickedRgb.b}`}
                onPress={handlePresentRecipeModal}
              />

              <UploadBottomSheet
                ref={bottomSheetRef}
                onPickImage={pickImage}
                onTakePhoto={takePhoto}
              />

              <MixingRecipeModal
                visible={isRecipeModalVisible}
                recipeData={currentMix.recipe}
                onClose={() => setIsRecipeModalVisible(false)}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}
