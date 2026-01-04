import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { SquintCanvas } from '@/components/SquintCanvas';
import { SquintControls } from '@/components/SquintControls';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { useRouter } from 'expo-router';
import { Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SquintScreen() {
    const { imageUri } = useProjectStore();
    const router = useRouter();
    const { pickImage } = useImagePicker();

    // Blur intensity state (0 = no blur, 50 = maximum blur)
    const [blurIntensity, setBlurIntensity] = useState(0);
    const MAX_BLUR = 50;

    if (!imageUri) {
        return (
            <SafeAreaView className="flex-1 bg-stone-100">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Tonal Analysis"
                        subtitle="Analyze values and composition."
                    />
                    <View className="flex-1 justify-center items-center">
                        <ImageIcon size={48} color="#d6d3d1" />
                        <AppText className="text-stone-400 mt-4 text-center font-medium">
                            Ready to analyze?
                        </AppText>
                        <AppText className="text-stone-400 text-sm text-center mb-6">
                            Select an image to see values.
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
                            Squint Tool
                        </AppText>
                        <AppText style={{ fontFamily: 'Inter_500Medium', color: '#666' }} className="text-base">
                            See shapes, not details.
                        </AppText>
                    </View>
                </View>

                {/* Squint Canvas with Blur */}
                <View
                    style={{
                        flex: 1,
                        borderBottomLeftRadius: 32,
                        borderBottomRightRadius: 32,
                        overflow: 'hidden',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        backgroundColor: '#fff', // Needed for shadow
                        elevation: 5
                    }}
                >
                    <SquintCanvas blurIntensity={blurIntensity} />
                </View>

                {/* Bottom Controls */}
                {/* Floating Control Deck */}
                <View style={{ marginTop: 24 }}>
                    <SquintControls
                        blurIntensity={blurIntensity}
                        setBlurIntensity={setBlurIntensity}
                        maxBlur={MAX_BLUR}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}
