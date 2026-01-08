import { AppHeader } from '@/components/AppHeader';
import { PaywallModal } from '@/components/PaywallModal';
import { SceneTransition } from '@/components/SceneTransition';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { ValueControls } from '@/components/ValueControls';
import { ValueMapCanvas } from '@/components/ValueMapCanvas';
import { usePro } from '@/context/ProContext';
import { useUpgradeFlow } from '@/hooks/useUpgradeFlow';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 48; // Match px-6 padding (24 * 2)
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45; // Match Palette Screen

export default function ValueMapScreen() {
    const { imageUri } = useProjectStore();
    const { pickImage } = useImagePicker();
    const { isPro } = usePro();
    const paywallRef = useRef<BottomSheetModal>(null);

    // State for grayscale and posterization
    // State for grayscale and temperature
    const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);
    const [temperatureEnabled, setTemperatureEnabled] = useState(false);

    const handleUploadPress = () => {
        // Free for all
        pickImage();
    };

    const { triggerUpgradeFlow } = useUpgradeFlow();

    const handleTemperatureToggle = (value: boolean) => {
        // Gating: Temperature Map requires Pro
        if (!isPro && value) {
            triggerUpgradeFlow(() => {
                paywallRef.current?.present();
            }, {
                onGuestIntent: () => {
                    setTemperatureEnabled(false); // Reset
                }
            });

            setTemperatureEnabled(false); // Reset to off immediately
        } else {
            setTemperatureEnabled(value);
        }
    };

    if (!imageUri) {
        return (
            <SafeAreaView className="flex-1 bg-[#0A0A0B]">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Value Map"
                        subtitle="Analyze tonal values."
                    />

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
                        title="Value Map"
                        subtitle="TONAL ZONES"
                        className="mb-0 z-10 bg-[#0A0A0B]"
                    />

                    {/* Main Scrollable Content */}
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 140 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Value Map Canvas */}
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
                            <ValueMapCanvas
                                grayscaleEnabled={grayscaleEnabled}
                                temperatureEnabled={temperatureEnabled}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                            />
                        </View>

                        {/* Bottom Controls */}
                        <View className="px-6">
                            <ValueControls
                                grayscaleEnabled={grayscaleEnabled}
                                setGrayscaleEnabled={setGrayscaleEnabled}
                                temperatureEnabled={temperatureEnabled}
                                setTemperatureEnabled={handleTemperatureToggle}
                            />
                        </View>
                    </ScrollView>
                </View>
                <PaywallModal ref={paywallRef} />
            </SafeAreaView>
        </SceneTransition>
    );
}
