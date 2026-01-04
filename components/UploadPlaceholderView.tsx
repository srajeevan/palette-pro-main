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
        <View className="flex-1 bg-[#0A0A0B] px-5 pt-8">
            {/* Header */}
            <View className="mb-6">
                <AppText className="text-4xl text-white" style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#FFFFFF' }}>
                    Start Creating
                </AppText>
            </View>

            {/* Action Area */}
            <TouchableOpacity
                className="aspect-[4/5] w-full items-center justify-center rounded-2xl border-2 border-dashed border-[#28282A] bg-[#161618]"
                activeOpacity={0.7}
                onPress={handlePress}
            >
                <View className="items-center justify-center space-y-4">
                    <Upload size={48} color="#E4E4E7" strokeWidth={1.5} />
                    <AppText className="text-lg font-medium" style={{ color: '#E4E4E7' }}>
                        Upload Reference Photo
                    </AppText>
                </View>
            </TouchableOpacity>
        </View>
    );
}
