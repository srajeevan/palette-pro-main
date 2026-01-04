import { AppButton } from '@/components/AppButton';
import { AppHeader } from '@/components/AppHeader';
import { AppText } from '@/components/AppText';
import { ValueMapCanvas } from '@/components/ValueMapCanvas';
import { useProjectStore } from '@/store/useProjectStore';
import { useRouter } from 'expo-router';
import { Layers } from 'lucide-react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ValueMapScreen() {
    const { imageUri } = useProjectStore();
    const router = useRouter();

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
                        title="Value Map"
                        subtitle="Light, mid-tone, and shadow."
                    />
                </View>

                {/* Value Map Canvas */}
                <View className="mb-6">
                    <ValueMapCanvas
                        grayscaleEnabled={grayscaleEnabled}
                        posterizeLevels={posterizeLevels}
                    />
                </View>

                {/* Bottom Controls */}
                <View className="bg-white rounded-t-3xl shadow-lg px-6 pt-8 pb-6">
                    {/* Grayscale Toggle */}
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center space-x-2">
                            <Layers size={18} color="#78716c" />
                            <AppText className="font-semibold text-stone-600">Grayscale</AppText>
                        </View>
                        <Switch
                            value={grayscaleEnabled}
                            onValueChange={setGrayscaleEnabled}
                            trackColor={{ false: '#e7e5e4', true: '#292524' }}
                            thumbColor={grayscaleEnabled ? '#ffffff' : '#a8a29e'}
                        />
                    </View>

                    {/* Posterization Control */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <AppText className="font-semibold text-stone-600">Posterization</AppText>
                            <AppText className="text-stone-800 font-bold text-lg">
                                {posterizeLevels === 1 ? 'Off' : `${posterizeLevels} Levels`}
                            </AppText>
                        </View>

                        {/* Posterization Slider */}
                        <View className="px-4">
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={MIN_LEVELS}
                                maximumValue={MAX_LEVELS}
                                step={1}
                                value={posterizeLevels}
                                onValueChange={setPosterizeLevels}
                                minimumTrackTintColor="#292524"
                                maximumTrackTintColor="#e7e5e4"
                                thumbTintColor="#292524"
                            />
                        </View>
                    </View>

                    {/* Info */}
                    <View className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                        <AppText className="text-stone-600 text-sm text-center leading-5">
                            The Value Map helps artists see tonal relationships. Grayscale removes color
                            distractions, while posterization simplifies the image into distinct value zones.
                        </AppText>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
