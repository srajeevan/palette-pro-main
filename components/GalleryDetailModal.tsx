import { AppText } from '@/components/AppText';
import { GalleryItem } from '@/components/GalleryCard';
import { PaletteSwatch } from '@/components/PaletteSwatch';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { Share, Trash2, X } from 'lucide-react-native';
import React, { forwardRef, useMemo } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GalleryDetailModalProps {
    item: GalleryItem | null;
    onClose: () => void;
    onShare: () => void;
    onOpenInStudio: (item: GalleryItem) => void;
    onDelete: (item: GalleryItem) => void;
    canDelete?: boolean;
}

export const GalleryDetailModal = forwardRef<BottomSheetModal, GalleryDetailModalProps>(
    ({ item, onClose, onShare, onOpenInStudio, onDelete, canDelete = false }, ref) => {
        const snapPoints = useMemo(() => ['90%'], []);
        const { width } = Dimensions.get('window');

        if (!item) return null;

        return (
            <BottomSheetModal
                ref={ref}
                snapPoints={snapPoints}
                index={0}
                enablePanDownToClose={true}
                backgroundStyle={{ backgroundColor: '#F5F5F4' }}
                handleIndicatorStyle={{ backgroundColor: '#D6D3D1' }}
                onDismiss={onClose}
            >
                {/* Header — fixed outside scroll */}
                <View style={styles.header}>
                    <View>
                        <AppText style={styles.title}>Palette Details</AppText>
                        <AppText style={styles.date}>Created {new Date().toLocaleDateString()}</AppText>
                    </View>
                    <View style={styles.headerActions}>
                        {canDelete && (
                            <TouchableOpacity
                                onPress={() => onDelete(item)}
                                style={styles.deleteButton}
                                activeOpacity={0.7}
                                accessibilityLabel="Delete palette"
                            >
                                <Trash2 size={18} color="#DC2626" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => (ref as any).current?.dismiss()} style={styles.closeButton}>
                            <X size={20} color="#57534e" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Scrollable content */}
                <BottomSheetScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
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

                    {/* Action Buttons — inline, always visible */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            onPress={() => onOpenInStudio(item)}
                            style={[styles.actionButton, { backgroundColor: '#3E63DD' }]}
                            activeOpacity={0.8}
                        >
                            <AppText style={styles.actionButtonText}>Open</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onShare}
                            style={[styles.actionButton, { backgroundColor: '#1A1A1A' }]}
                            activeOpacity={0.8}
                        >
                            <Share size={18} color="#FFFFFF" />
                            <AppText style={styles.actionButtonText}>Share</AppText>
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 16,
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e7e5e4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    imageContainer: {
        width: '100%',
        height: 280,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#e7e5e4',
        marginBottom: 20,
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
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 28,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    actionButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: '#FFFFFF',
    },
});
