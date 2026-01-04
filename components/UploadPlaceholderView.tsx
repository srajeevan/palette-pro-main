import { useImagePicker } from '@/services/useImagePicker';
import { Upload } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText } from './AppText';

export function UploadPlaceholderView({ onImageSelected }: { onImageSelected?: (uri: string) => void }) {
    const { pickImage } = useImagePicker();

    const handlePress = async () => {
        const uri = await pickImage();
        if (uri && onImageSelected) {
            onImageSelected(uri);
        }
    };

    return (
        <View className="flex-1 bg-white px-5 pt-8">
            {/* Header */}
            <View className="mb-6">
                <AppText className="text-4xl font-bold text-black">
                    Start Creating
                </AppText>
            </View>

            {/* Action Area */}
            <TouchableOpacity
                className="aspect-[4/5] w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50"
                activeOpacity={0.7}
                onPress={handlePress}
            >
                <View className="items-center justify-center space-y-4">
                    <Upload size={48} color="#9CA3AF" strokeWidth={1.5} />
                    <AppText className="text-lg font-medium text-gray-400">
                        Upload Reference Photo
                    </AppText>
                </View>
            </TouchableOpacity>
        </View>
    );
}
