import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorPointer } from '@/components/ColorPointer';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { MixingRecipeModal } from '@/components/MixingRecipeModal';
import { UploadBottomSheet } from '@/components/UploadBottomSheet';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { getContrastColor } from '@/utils/colorUtils';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ImagePlus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  // Interaction State
  const isInteracting = useSharedValue(0); // 0 = false, 1 = true

  const footerStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isInteracting.value ? 1 : 0.4, { damping: 20, stiffness: 90 })
    };
  });

  const handlePresentUploadModal = () => {
    bottomSheetRef.current?.present();
  };

  const handlePresentRecipeModal = () => {
    setIsRecipeModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0B' }}>
      {!imageUri && (
        <Animated.View
          entering={FadeIn.duration(800)}
          exiting={FadeOut.duration(800)}
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
        >
          <SafeAreaView className="flex-1 bg-[#0A0A0B]">
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
          <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'bottom']}>
            <View className="flex-1 p-0" style={{ paddingBottom: 110 }}>
              {/* Standardized Header (Midnight) with exact 24pt spacing */}
              <AppHeader
                title="Studio"
                subtitle="Pick & Mix"
                className="mb-6" // 24pt margin (mb-6 = 24px)
              />
              <View className="absolute top-8 right-6 z-50">
                <Pressable
                  onPress={handlePresentUploadModal}
                  className="w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E] border border-[#28282A] active:opacity-70"
                >
                  <ImagePlus size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Unified Image & Metadata Container */}
              <View
                className="flex-1 mx-4 mb-4"
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#28282A', // Outer border for the whole unit
                  backgroundColor: '#161618',
                }}
              >
                {/* Image Area */}
                <View
                  style={{ flex: 1, backgroundColor: '#0A0A0B', overflow: 'hidden' }}
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
                    onInteractionStart={() => { isInteracting.value = 1; }}
                    onInteractionEnd={() => { isInteracting.value = 0; }}
                  />
                </View>

                {/* Technical Metadata Footer / Comparison Deck */}
                <AnimatedPressable
                  onPress={handlePresentRecipeModal}
                  style={[{
                    height: 64, // Taller (64pt) for easier physical comparison
                    backgroundColor: pickedColor, // The Footer IS the Swatch
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(0,0,0,0.1)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                  }, footerStyle]}
                >
                  {/* Adaptive Text Color */}
                  {(() => {
                    const textColor = getContrastColor(pickedColor);
                    const separatorColor = textColor === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
                    const labelColor = textColor === '#FFFFFF' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';

                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <AppText style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, color: labelColor }}>HEX </AppText>
                          <AppText style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, fontWeight: '600', color: textColor, letterSpacing: 1 }}>
                            {pickedColor.toUpperCase()}
                          </AppText>
                        </View>

                        <View style={{ width: 1, height: 16, backgroundColor: separatorColor, marginHorizontal: 16 }} />

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <AppText style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, color: labelColor }}>RGB </AppText>
                          <AppText style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, fontWeight: '600', color: textColor, letterSpacing: 1 }}>
                            {`${pickedRgb.r}, ${pickedRgb.g}, ${pickedRgb.b}`}
                          </AppText>
                        </View>
                      </View>
                    );
                  })()}
                </AnimatedPressable>
              </View>

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
