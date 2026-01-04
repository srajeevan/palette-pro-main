import { AppText } from '@/components/AppText';
import { useProjectStore } from '@/store/useProjectStore';
import { Image as ImageIcon } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

type ImageCanvasProps = {
    onPress?: () => void;
};

export const ImageCanvas = ({ onPress }: ImageCanvasProps) => {
    const { imageUri, isUploading } = useProjectStore();

    if (!imageUri) {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                className="w-full h-full justify-center items-center"
            >
                <View className="w-[90%] aspect-[4/5] justify-center items-center bg-stone-50 rounded-xl border-2 border-dashed border-stone-300">
                    <ImageIcon size={48} color="#d6d3d1" strokeWidth={1.5} />
                    <AppText className="text-stone-400 mt-4 font-medium">
                        {isUploading ? 'Uploading Reference...' : 'Tap to upload reference'}
                    </AppText>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View className="w-full h-full justify-center items-center p-4">
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                className="w-full h-full shadow-lg"
            >
                <Animated.View
                    key={imageUri}
                    entering={FadeIn.duration(800)}
                    className="w-full h-full"
                >
                    <Animated.Image
                        entering={ZoomIn.duration(800)}
                        source={{ uri: imageUri }}
                        className="w-full h-full rounded-lg border border-stone-200 bg-white"
                        resizeMode="contain"
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};
