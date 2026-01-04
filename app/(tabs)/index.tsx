import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorInspectorHUD } from '@/components/ColorInspectorHUD';
import { ColorPointer } from '@/components/ColorPointer';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { UploadBottomSheet } from '@/components/UploadBottomSheet';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ImagePlus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.6; // Larger area for studio

export default function PickerScreen() {
  const { pickImage, takePhoto } = useImagePicker();
  const { imageUri } = useProjectStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const canvasRef = useRef<ColorSkiaCanvasRef>(null);

  // Live Color State
  const [pickedColor, setPickedColor] = useState<string>('#FFFFFF');
  const [pickedRgb, setPickedRgb] = useState<{ r: number, g: number, b: number }>({ r: 255, g: 255, b: 255 });
  const [currentMix, setCurrentMix] = useState<MixResult>({
    closestColor: '#FFFFFF',
    recipe: 'Touch image to mix...',
    distance: 0
  });

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
    const originX = CANVAS_WIDTH / 2;
    const originY = CANVAS_HEIGHT / 2;

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

  const handlePresentModalPress = () => {
    bottomSheetRef.current?.present();
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
          <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
            <View className="flex-1 p-0">
              <View className="px-6 pt-2 pb-2 flex-row justify-between items-center z-10">
                <View>
                  <AppText className="text-2xl font-bold text-stone-800">Studio</AppText>
                  <AppText className="text-stone-500 text-sm">Pick & Mix</AppText>
                </View>
                <TouchableOpacity
                  onPress={handlePresentModalPress}
                  className="p-2 bg-stone-200 rounded-full"
                >
                  <ImagePlus size={24} color="#57534e" />
                </TouchableOpacity>
              </View>

              <View style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, overflow: 'hidden' }} className="mb-4 relative bg-stone-200">
                <GestureDetector gesture={composedGesture}>
                  <Animated.View style={[{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }, canvasAnimatedStyle]}>
                    <ColorSkiaCanvas ref={canvasRef} />
                  </Animated.View>
                </GestureDetector>

                <ColorPointer
                  canvasWidth={CANVAS_WIDTH}
                  canvasHeight={CANVAS_HEIGHT}
                  onColorChange={handleColorChange}
                />
              </View>

              {/* HUD Overlay */}
              <ColorInspectorHUD
                color={pickedColor}
                rgb={pickedRgb}
                mix={currentMix}
              />

              <UploadBottomSheet
                ref={bottomSheetRef}
                onPickImage={pickImage}
                onTakePhoto={takePhoto}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}
