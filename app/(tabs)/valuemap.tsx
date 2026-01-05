import { AppHeader } from '@/components/AppHeader';
import { PaywallModal } from '@/components/PaywallModal';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { ValueControls } from '@/components/ValueControls';
import { ValueMapCanvas } from '@/components/ValueMapCanvas';
import { usePro } from '@/context/ProContext';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 48; // Match px-6 padding (24 * 2)
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45; // Match Palette Screen

export default function ValueMapScreen() {
    const { imageUri } = useProjectStore();
    const router = useRouter();
    const { pickImage } = useImagePicker();
    const { isPro } = usePro();
    const paywallRef = React.useRef<BottomSheetModal>(null);

    // State for grayscale and posterization
    const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);
    const [posterizeLevels, setPosterizeLevels] = useState(1);
    const MIN_LEVELS = 1; // No posterization
    const MAX_LEVELS = 12; // Maximum posterization levels

    const handleUploadPress = () => {
        if (isPro) {
            pickImage();
        } else {
            paywallRef.current?.present();
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

                    {/* Demo Mode / Paywall Prompt */}
                    {!isPro && (
                        <View className="mb-6 bg-[#161618] p-4 rounded-xl border border-[#F59E0B]">
                            <Text className="text-[#F59E0B] font-bold text-center mb-1">PRO FEATURE</Text>
                            <Text className="text-stone-400 text-center text-xs">Unlock to analyze your own photos.</Text>
                        </View>
                    )}

                    <View className="flex-1 -mt-5">
                        <UploadPlaceholderView onImageSelected={handleUploadPress} />
                    </View>
                </View>
                <PaywallModal ref={paywallRef} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top']}>
            <View className="flex-1">
                {/* Fixed Header */}
                <AppHeader
                    title="Value Map"
                    subtitle="TONAL ZONES"
                    className="mb-0 z-10 bg-[#0A0A0B]"
                />

                {/* Demo Banner */}
                {!isPro && (
                    <TouchableOpacity
                        onPress={() => paywallRef.current?.present()}
                        className="bg-[#F59E0B] py-1 px-4 items-center justify-center flex-row z-20"
                    >
                        <Text className="text-black font-bold text-xs uppercase tracking-wider">Demo Mode • Tap to Unlock</Text>
                    </TouchableOpacity>
                )}

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
                            backgroundColor: '#0A0A0B',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                            marginBottom: 24,
                            marginTop: 16, // Add top margin to separate from Header
                        }}
                    >
                        <ValueMapCanvas
                            grayscaleEnabled={grayscaleEnabled}
                            posterizeLevels={posterizeLevels}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                        />
                    </View>

                    {/* Bottom Controls */}
                    <View className="px-6">
                        <ValueControls
                            grayscaleEnabled={grayscaleEnabled}
                            setGrayscaleEnabled={setGrayscaleEnabled}
                            posterizeLevels={posterizeLevels}
                            setPosterizeLevels={setPosterizeLevels}
                            minLevels={MIN_LEVELS}
                            maxLevels={MAX_LEVELS}
                        />
                    </View>
                </ScrollView>
            </View>
            <PaywallModal ref={paywallRef} />
        </SafeAreaView>
    );
}
