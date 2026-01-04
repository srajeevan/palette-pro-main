import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ValueControls } from '@/components/ValueControls';
import { ValueMapCanvas } from '@/components/ValueMapCanvas';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { useRouter } from 'expo-router';
import { Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ValueMapScreen() {
    const { imageUri } = useProjectStore();
    const router = useRouter();
    const { pickImage } = useImagePicker();

    // State for grayscale and posterization
    const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);
    const [posterizeLevels, setPosterizeLevels] = useState(1);
    const MIN_LEVELS = 1; // No posterization
    const MAX_LEVELS = 12; // Maximum posterization levels

    if (!imageUri) {
        return (
            <SafeAreaView className="flex-1 bg-stone-100">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Value Map"
                        subtitle="Analyze tonal values."
                    />
                    <View className="flex-1 justify-center items-center">
                        <ImageIcon size={48} color="#d6d3d1" />
                        <AppText className="text-stone-400 mt-4 text-center font-medium">
                            Ready to analyze?
                        </AppText>
                        <AppText className="text-stone-400 text-sm text-center mb-6">
                            Select an image to map values.
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
        <SafeAreaView className="flex-1 bg-stone-100" edges={['top', 'bottom']}>
            <View className="flex-1" style={{ paddingBottom: 120 }}>
                {/* Header */}
                <View className="px-6 pt-2 pb-2">
                    <View>
                        <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#1A1A1A' }} className="text-4xl mb-1">
                            Value Map
                        </AppText>
                        <AppText style={{ fontFamily: 'Inter_500Medium', color: '#666' }} className="text-base">
                            Light, mid-tone, and shadow.
                        </AppText>
                    </View>
                </View>

                {/* Value Map Canvas */}
                {/* Value Map Canvas */}
                <View
                    style={{
                        flex: 1,
                        borderBottomLeftRadius: 32,
                        borderBottomRightRadius: 32,
                        overflow: 'hidden',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        backgroundColor: '#fff',
                        elevation: 5
                    }}
                >
                    <ValueMapCanvas
                        grayscaleEnabled={grayscaleEnabled}
                        posterizeLevels={posterizeLevels}
                    />
                </View>

                {/* Bottom Controls */}
                {/* Floating Value Controls */}
                <View style={{ marginTop: 24 }}>
                    <ValueControls
                        grayscaleEnabled={grayscaleEnabled}
                        setGrayscaleEnabled={setGrayscaleEnabled}
                        posterizeLevels={posterizeLevels}
                        setPosterizeLevels={setPosterizeLevels}
                        minLevels={MIN_LEVELS}
                        maxLevels={MAX_LEVELS}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
