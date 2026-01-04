import { AppHeader } from '@/components/AppHeader';
import { SquintCanvas } from '@/components/SquintCanvas';
import { SquintControls } from '@/components/SquintControls';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
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
            <SafeAreaView className="flex-1 bg-[#0A0A0B]">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Tonal Analysis"
                        subtitle="Analyze values and composition."
                    />
                    <View className="flex-1 -mt-20">
                        <UploadPlaceholderView onImageSelected={pickImage} />
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
                    title="Tonal Analysis"
                    subtitle="SQUINT TOOL"
                    className="mb-0 z-10 bg-[#0A0A0B]"
                />

                {/* Main Scrollable Content */}
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Squint Canvas with Blur */}
                    <View
                        style={{
                            width: '100%',
                            aspectRatio: 1, // Keep it square or match canvas dimensions if possible
                            overflow: 'hidden',
                            borderBottomLeftRadius: 32,
                            borderBottomRightRadius: 32,
                            backgroundColor: '#0A0A0B',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.1)',
                            marginBottom: 24,
                        }}
                    >
                        <SquintCanvas blurIntensity={blurIntensity} />
                    </View>

                    {/* Bottom Controls */}
                    <View className="px-6">
                        <SquintControls
                            blurIntensity={blurIntensity}
                            setBlurIntensity={setBlurIntensity}
                            maxBlur={MAX_BLUR}
                        />
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
