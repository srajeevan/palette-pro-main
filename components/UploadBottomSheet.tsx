import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText } from './AppText';

export type UploadBottomSheetProps = {
    onPickImage: () => void;
    onTakePhoto: () => void;
};

export const UploadBottomSheet = forwardRef<BottomSheetModal, UploadBottomSheetProps>(
    ({ onPickImage, onTakePhoto }, ref) => {
        const snapPoints = useMemo(() => ['30%'], []);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: '#fafaf9' }} // stone-50
                handleIndicatorStyle={{ backgroundColor: '#d6d3d1' }} // stone-300
            >
                <BottomSheetView className="flex-1 px-6 pt-2 pb-8">
                    <View className="flex-row justify-between items-center mb-6">
                        <AppText className="text-lg font-bold text-stone-800">New Project</AppText>
                        <TouchableOpacity onPress={() => (ref as any)?.current?.dismiss()}>
                            <View className="bg-stone-200 p-1 rounded-full">
                                <X size={20} color="#78716c" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-3">
                        <TouchableOpacity
                            onPress={() => {
                                (ref as any)?.current?.dismiss();
                                onPickImage();
                            }}
                            className="flex-row items-center bg-white p-4 rounded-xl border border-stone-200"
                        >
                            <View className="bg-orange-50 p-2 rounded-lg mr-4">
                                <ImageIcon size={24} color="#ea580c" />
                            </View>
                            <View>
                                <AppText className="font-semibold text-stone-800">Choose from Gallery</AppText>
                                <AppText className="text-xs text-stone-500">Pick an existing photo</AppText>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                (ref as any)?.current?.dismiss();
                                onTakePhoto();
                            }}
                            className="flex-row items-center bg-white p-4 rounded-xl border border-stone-200"
                        >
                            <View className="bg-blue-50 p-2 rounded-lg mr-4">
                                <Camera size={24} color="#2563eb" />
                            </View>
                            <View>
                                <AppText className="font-semibold text-stone-800">Take Photo</AppText>
                                <AppText className="text-xs text-stone-500">Capture a new image</AppText>
                            </View>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);
