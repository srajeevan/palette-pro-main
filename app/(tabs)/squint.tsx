import { AppHeader } from '@/components/AppHeader';
import { PaywallModal } from '@/components/PaywallModal';
import { SceneTransition } from '@/components/SceneTransition';
import { SquintCanvas } from '@/components/SquintCanvas';
import { SquintControls } from '@/components/SquintControls';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { usePro } from '@/context/ProContext';
import { useUpgradeFlow } from '@/hooks/useUpgradeFlow';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 48; // Match px-6 padding (24 * 2)
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45; // Match Palette Screen

export default function SquintScreen() {
    const { imageUri } = useProjectStore();
    const router = useRouter();
    const { pickImage } = useImagePicker();
    const { isPro } = usePro();
    const paywallRef = React.useRef<BottomSheetModal>(null);

    // Blur intensity state (0 = no blur, 50 = maximum blur)
    const [blurIntensity, setBlurIntensity] = useState(0);
    const MAX_BLUR = 50;

    const handleUploadPress = () => {
        // Allow upload for free user too? Prompt implies "For squint... upgrade modal should show up when moving slides 8%".
        // It doesn't explicitly say "Gate Upload". 
        // Logic: "Demo Mode" usually meant no upload. 
        // But if they can't upload, they can't use the tool at all unless there's a demo image.
        // Assuming we keep Upload gated for Consistency? 
        // "Make the value map feature as free." -> Implies Squint is NOT fully free.
        // "For the squint, once the user blur... then upgrade modal".
        // This implies they CAN use it up to a point. If they can't upload, they can't use it.
        // So I will UNLOCK upload, but gate the Slider.
        pickImage();
    };

    const { triggerUpgradeFlow } = useUpgradeFlow();

    const handleBlurChange = (value: number) => {
        const percentage = (value / MAX_BLUR) * 100;
        if (!isPro && percentage > 8) {

            triggerUpgradeFlow(() => {
                // Allowed to open Paywall
                paywallRef.current?.present();
            }, {
                onGuestIntent: () => {
                    // Reset blur if guest decides to upgrade (so it doesn't stay stuck if they cancel)
                    setBlurIntensity(MAX_BLUR * 0.08);
                }
            });

            // Cap locally while waiting
            setBlurIntensity(MAX_BLUR * 0.08);
        } else {
            setBlurIntensity(value);
        }
    };

    if (!imageUri) {
        return (
            <SafeAreaView className="flex-1 bg-[#0A0A0B]">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Tonal Analysis"
                        subtitle="Analyze values and composition."
                    />

                    {/* No blocked upload banner anymore */}

                    <View className="flex-1 -mt-5">
                        <UploadPlaceholderView onImageSelected={handleUploadPress} />
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
                        title="Tonal Analysis"
                        subtitle="SQUINT TOOL"
                        className="mb-0 z-10 bg-[#0A0A0B]"
                    />

                    {/* No top banner "Unlock Unlimited Access" */}

                    {/* Main Scrollable Content */}
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 140 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Squint Canvas with Blur */}
                        <View
                            style={{
                                width: CANVAS_WIDTH,
                                height: CANVAS_HEIGHT,
                                alignSelf: 'center', // Center the narrower canvas
                                overflow: 'hidden',
                                borderRadius: 24, // Uniform radius for Floating Card look
                                backgroundColor: '#1C1C1E',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                marginBottom: 24,
                                marginTop: 16, // Add top margin to separate from Header
                            }}
                        >
                            <SquintCanvas
                                blurIntensity={blurIntensity}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                            />
                        </View>

                        {/* Bottom Controls */}
                        <View className="px-6">
                            <SquintControls
                                blurIntensity={blurIntensity}
                                setBlurIntensity={handleBlurChange}
                                maxBlur={MAX_BLUR}
                            />
                        </View>
                    </ScrollView>
                </View>
                <PaywallModal ref={paywallRef} />
            </SafeAreaView>
        </SceneTransition>
    );
}
