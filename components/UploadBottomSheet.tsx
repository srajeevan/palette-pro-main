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
                backgroundStyle={{ backgroundColor: '#161618' }} // Midnight Surface
                handleIndicatorStyle={{ backgroundColor: '#3F3F46' }} // Zinc 700
            >
                <BottomSheetView className="flex-1 px-6 pt-2 pb-8">
                    <View className="flex-row justify-between items-center mb-6">
                        <AppText className="text-lg font-bold text-white">New Project</AppText>
                        <TouchableOpacity onPress={() => (ref as any)?.current?.dismiss()}>
                            <View className="bg-[#27272A] p-1 rounded-full">
                                <X size={20} color="#A1A1AA" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-3">
                        <TouchableOpacity
                            onPress={() => {
                                (ref as any)?.current?.dismiss();
                                onPickImage();
                            }}
                            className="flex-row items-center bg-[#1C1C1E] p-4 rounded-xl border border-[#28282A]"
                        >
                            <View className="bg-[#2C2C2E] p-2 rounded-lg mr-4">
                                <ImageIcon size={24} color="#EA580C" />
                            </View>
                            <View>
                                <AppText className="font-semibold text-white">Choose from Gallery</AppText>
                                <AppText className="text-xs text-[#A1A1AA]">Pick an existing photo</AppText>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                (ref as any)?.current?.dismiss();
                                onTakePhoto();
                            }}
                            className="flex-row items-center bg-[#1C1C1E] p-4 rounded-xl border border-[#28282A]"
                        >
                            <View className="bg-[#2C2C2E] p-2 rounded-lg mr-4">
                                <Camera size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <AppText className="font-semibold text-white">Take Photo</AppText>
                                <AppText className="text-xs text-[#A1A1AA]">Capture a new image</AppText>
                            </View>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);
