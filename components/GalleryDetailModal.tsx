import { AppText } from '@/components/AppText';
import { GalleryItem } from '@/components/GalleryCard';
import { PaletteSwatch } from '@/components/PaletteSwatch';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { Share, X } from 'lucide-react-native';
import React, { forwardRef, useMemo } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GalleryDetailModalProps {
    item: GalleryItem | null;
    onClose: () => void;
    onShare: () => void;
    onOpenInStudio: (item: GalleryItem) => void;
}

export const GalleryDetailModal = forwardRef<BottomSheetModal, GalleryDetailModalProps>(
    ({ item, onClose, onShare, onOpenInStudio }, ref) => {
        const snapPoints = useMemo(() => ['85%'], []);
        const { width } = Dimensions.get('window');

        if (!item) return null;

        return (
            <BottomSheetModal
                ref={ref}
                snapPoints={snapPoints}
                index={0}
                enablePanDownToClose={true}
                backgroundStyle={{ backgroundColor: '#F5F5F4' }} // stone-100
                handleIndicatorStyle={{ backgroundColor: '#D6D3D1' }}
                onDismiss={onClose}
            >
                <BottomSheetView style={styles.contentContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <AppText style={styles.title}>Palette Details</AppText>
                            <AppText style={styles.date}>Created {new Date().toLocaleDateString()}</AppText>
                        </View>
                        <TouchableOpacity onPress={() => (ref as any).current?.dismiss()} style={styles.closeButton}>
                            <X size={20} color="#57534e" />
                        </TouchableOpacity>
                    </View>

                    {/* Image */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={200}
                        />
                    </View>

                    {/* Palette Grid */}
                    <View style={styles.paletteContainer}>
                        {item.colors.map((color, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(index * 50).springify()}
                                style={{ margin: 4 }}
                            >
                                <PaletteSwatch color={color} index={index} onPress={() => { }} />
                            </Animated.View>
                        ))}
                    </View>

                    {/* Floating Action Buttons */}
                    <View style={styles.fabContainer}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => onOpenInStudio(item)}
                                style={[styles.fab, { backgroundColor: '#3E63DD', paddingHorizontal: 24 }]}
                                activeOpacity={0.8}
                            >
                                <AppText style={styles.fabText}>Open</AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onShare}
                                style={[styles.fab, { backgroundColor: '#1A1A1A', paddingHorizontal: 24 }]}
                                activeOpacity={0.8}
                            >
                                <Share size={20} color="#FFFFFF" />
                                <AppText style={styles.fabText}>Share</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>

                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 24,
        color: '#1c1917',
    },
    date: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#78716c',
        marginTop: 4,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e7e5e4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        width: '100%',
        height: 300,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#e7e5e4',
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    paletteContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 40,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 32,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    fabText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
    }
});
