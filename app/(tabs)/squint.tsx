import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { SquintCanvas } from '@/components/SquintCanvas';
import { useProjectStore } from '@/store/useProjectStore';
import { useRouter } from 'expo-router';
import { Eye } from 'lucide-react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SquintScreen() {
    const { imageUri } = useProjectStore();
    const router = useRouter();

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
                        <View className="items-center justify-center p-8 bg-white rounded-2xl border-2 border-dashed border-stone-200">
                            <ImageIcon size={48} color="#d6d3d1" />
                            <AppText className="text-stone-400 mt-4 text-center font-medium">
                                No image selected
                            </AppText>
                            <AppText className="text-stone-400 text-sm text-center mb-6">
                                Go to the Picker tab to select an image.
                            </AppText>
                            <AppButton
                                title="Go to Picker"
                                onPress={() => router.navigate('/(tabs)')}
                                variant="outline"
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-stone-100" edges={['top', 'bottom']}>
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-2 pb-4">
                    <AppHeader
                        title="Squint Tool"
                        subtitle="See shapes, not details."
                    />
                </View>

                {/* Squint Canvas with Blur */}
                <View className="mb-6">
                    <SquintCanvas blurIntensity={blurIntensity} />
                </View>

                {/* Bottom Controls */}
                <View className="bg-white rounded-t-3xl shadow-lg px-6 pt-8 pb-6">
                    {/* Control Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center space-x-2">
                            <Eye size={18} color="#78716c" />
                            <AppText className="font-semibold text-stone-600">Blur Intensity</AppText>
                        </View>
                        <AppText className="text-stone-800 font-bold text-lg">
                            {Math.round((blurIntensity / MAX_BLUR) * 100)}%
                        </AppText>
                    </View>

                    {/* Slider */}
                    <View className="mb-6 px-4">
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={MAX_BLUR}
                            value={blurIntensity}
                            onValueChange={setBlurIntensity}
                            minimumTrackTintColor="#292524"
                            maximumTrackTintColor="#e7e5e4"
                            thumbTintColor="#292524"
                        />
                    </View>

                    {/* Info */}
                    <View className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                        <AppText className="text-stone-600 text-sm text-center leading-5">
                            Squinting helps artists see the big shapes and values without getting lost in details.
                            Drag the slider to simulate this classic painting technique.
                        </AppText>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
