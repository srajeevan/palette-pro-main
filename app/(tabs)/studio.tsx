import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ColorPointer } from '@/components/ColorPointer';
import { ColorSkiaCanvas, ColorSkiaCanvasRef } from '@/components/ColorSkiaCanvas';
import { GridOverlay } from '@/components/GridOverlay';
import { GridSelectorSheet } from '@/components/GridSelectorSheet';
import { MixingRecipeModal } from '@/components/MixingRecipeModal';
import { PaywallModal } from '@/components/PaywallModal';
import { SceneTransition } from '@/components/SceneTransition';
import { UploadBottomSheet } from '@/components/UploadBottomSheet';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { useImagePicker } from '@/services/useImagePicker';
import { useGridStore } from '@/store/useGridStore';
import { useProjectStore } from '@/store/useProjectStore';
import { getContrastColor } from '@/utils/colorUtils';
import { calculateMix, MixResult } from '@/utils/mixingEngine';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import { Grid3x3, ImagePlus } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Default initial dimensions until measurement
const INITIAL_WIDTH = SCREEN_WIDTH;
const INITIAL_HEIGHT = SCREEN_HEIGHT * 0.6;

export default function PickerScreen() {
  const { pickImage, takePhoto } = useImagePicker();
  const { imageUri, imageDimensions } = useProjectStore();
  const gridEnabled = useGridStore((s) => s.enabled);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const paywallRef = useRef<BottomSheetModal>(null);
  const gridSheetRef = useRef<BottomSheetModal>(null);
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
    distance: 0,
    ingredients: [],
    reasoning: null,
  });

  // Modal State
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);

  // Zoom/Pan State (UI thread — drives animations)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // JS-thread mirror of zoom state — updated on gesture end.
  // Reading shared values from JS thread can return stale data because
  // UI↔JS bridge sync is async. These refs are set via runOnJS at the
  // end of each gesture, guaranteeing the JS thread has the correct values
  // when the user subsequently drags the color pointer.
  const jsZoom = useRef({ scale: 1, tx: 0, ty: 0 });

  const syncZoomToJS = useCallback((s: number, tx: number, ty: number) => {
    jsZoom.current = { scale: s, tx, ty };
  }, []);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, savedScale.value * e.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(syncZoomToJS)(scale.value, translateX.value, translateY.value);
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
      runOnJS(syncZoomToJS)(scale.value, translateX.value, translateY.value);
    });

  const composedGesture = Gesture.Simultaneous(pinch, pan);

  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  // Debounce timer for expensive mix calculation
  const mixTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleColorChange = useCallback((screenX: number, screenY: number) => {
    const originX = canvasLayout.width / 2;
    const originY = canvasLayout.height / 2;

    // Use JS-thread zoom state (synced via runOnJS on gesture end)
    // instead of reading shared values which can be stale on JS thread
    const { scale: zs, tx: ztx, ty: zty } = jsZoom.current;

    const unzoomedX = ((screenX - ztx - originX) / zs) + originX;
    const unzoomedY = ((screenY - zty - originY) / zs) + originY;

    const pixel = canvasRef.current?.getPixelColor(unzoomedX, unzoomedY);

    if (pixel) {
      // Instant: update color ribbon immediately (zero cost)
      const hex = `#${((1 << 24) + (pixel.r << 16) + (pixel.g << 8) + pixel.b).toString(16).slice(1).toUpperCase()}`;
      setPickedRgb(pixel);
      setPickedColor(hex);

      // Debounced: only run expensive KM mix after user pauses dragging (150ms)
      if (mixTimerRef.current) clearTimeout(mixTimerRef.current);
      mixTimerRef.current = setTimeout(() => {
        const mix = calculateMix(pixel);
        setCurrentMix(mix);
      }, 150);
    }
  }, [canvasLayout.width, canvasLayout.height]);

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

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (mixTimerRef.current) clearTimeout(mixTimerRef.current);
    };
  }, []);

  // Initial Color Pick on Image Load
  const isFocused = useIsFocused();

  React.useEffect(() => {
    if (isFocused && imageUri && canvasLayout.width > 0 && canvasLayout.height > 0) {
      // Small delay to ensure Skia image is rendered on canvas
      const timer = setTimeout(() => {
        try {
          const centerX = canvasLayout.width / 2;
          const centerY = canvasLayout.height / 2;
          handleColorChange(centerX, centerY);
        } catch {
          // Skia view not ready yet — safe to ignore
        }
      }, 800); // 800ms delay to be safe
      return () => clearTimeout(timer);
    }
  }, [imageUri, canvasLayout, isFocused]);

  return (
    <SceneTransition style={{ flex: 1 }}>
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
                  rightAction={
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={() => gridSheetRef.current?.present()}
                        className="w-10 h-10 items-center justify-center rounded-full border active:opacity-70"
                        style={{
                          backgroundColor: gridEnabled ? '#1C3A1C' : '#1C1C1E',
                          borderColor: gridEnabled ? '#22C55E' : '#28282A',
                        }}
                      >
                        <Grid3x3 size={20} color={gridEnabled ? '#22C55E' : '#FFFFFF'} />
                      </Pressable>
                      <Pressable
                        onPress={pickImage}
                        className="w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E] border border-[#28282A] active:opacity-70"
                      >
                        <ImagePlus size={20} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  }
                />

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
                        <GridOverlay
                          width={canvasLayout.width}
                          height={canvasLayout.height}
                          imageWidth={imageDimensions?.width ?? 0}
                          imageHeight={imageDimensions?.height ?? 0}
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
                  reasoning={currentMix.reasoning}
                  onClose={() => setIsRecipeModalVisible(false)}
                  onUnlock={() => {
                    // Open Paywall Modal
                    // We need a dedicated Paywall modal ref or reuse bottomSheetRef with a different state
                    // For simplicity, let's create a dedicated Paywall ref in this component or handle it via a new state/ref
                    paywallRef.current?.present();
                  }}
                />
                <PaywallModal ref={paywallRef} />
                <GridSelectorSheet ref={gridSheetRef} />
              </View>
            </SafeAreaView>
          </Animated.View>
        )}
      </View>
    </SceneTransition>
  );
}
