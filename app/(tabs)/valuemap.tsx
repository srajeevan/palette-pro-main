import { AppHeader } from '@/components/AppHeader';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { ValueControls } from '@/components/ValueControls';
import { ValueMapCanvas } from '@/components/ValueMapCanvas';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import React, { useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 48; // Match px-6 padding (24 * 2)
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45; // Match Palette Screen

export default function ValueMapScreen() {
    const { imageUri } = useProjectStore();
    const { pickImage } = useImagePicker();

    // State for grayscale and posterization
    const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);
    const [posterizeLevels, setPosterizeLevels] = useState(1);
    const MIN_LEVELS = 1; // No posterization
    const MAX_LEVELS = 12; // Maximum posterization levels

    const handleUploadPress = () => {
        // Free for all
        pickImage();
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
        </SafeAreaView>
    );
}
