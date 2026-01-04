import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { GalleryCard, GalleryItem } from '@/components/GalleryCard';
import { GuestSyncCard } from '@/components/GuestSyncCard';
import { ShareCardGeneratorRef } from '@/components/ShareCardGenerator';
import { useAuth } from '@/context/AuthContext';
import { Palette, Settings } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { FlatList, Share as NativeShare, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GalleryDetailModal } from '@/components/GalleryDetailModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ShareCardGenerator } from '@/components/ShareCardGenerator';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export default function ProfileScreen() {
    const { user, loading, isGuest, signOut } = useAuth();

    // State
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const detailModalRef = useRef<BottomSheetModal>(null);
    const shareGeneratorRef = useRef<ShareCardGeneratorRef>(null);

    // Mock Data for Gallery (Will replace with real data later)
    // Adding placeholder mock data for testing UI
    const galleryItems: GalleryItem[] = [
        { id: '1', imageUrl: 'https://picsum.photos/400/500', colors: ['#2F3E46', '#354F52', '#52796F', '#84A98C', '#CAD2C5'] },
        { id: '2', imageUrl: 'https://picsum.photos/400/501', colors: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'] },
        { id: '3', imageUrl: 'https://picsum.photos/400/502', colors: ['#606C38', '#283618', '#FEFAE0', '#DDA15E', '#BC6C25'] },
    ];

    const handleCardPress = (item: GalleryItem) => {
        setSelectedItem(item);
        detailModalRef.current?.present();
    };

    const handleShare = async () => {
        if (!shareGeneratorRef.current) return;

        try {
            const base64Coords = await shareGeneratorRef.current.generate();
            if (base64Coords) {
                await NativeShare.share({
                    url: base64Coords,
                    message: 'Check out my palette from Studio!',
                });
            }
        } catch (error) {
            console.error('Sharing failed', error);
        }
    };

    if (loading || (!user && !isGuest)) {
        return <View className="flex-1 bg-stone-100" />;
    }

    const renderHeader = () => (
        <View className="px-4 pt-2 pb-6">
            {/* Header Row */}
            <View className="flex-row justify-between items-start mb-6">
                <View>
                    <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#1A1A1A' }} className="text-3xl">
                        {isGuest ? "Guest Artist" : user?.email?.split('@')[0] || "Artist"}
                    </AppText>
                    <AppText style={{ fontFamily: 'Inter_500Medium', color: '#78716c' }} className="text-base mt-2">
                        Member since 2024 • {galleryItems.length} Palettes Created
                    </AppText>
                </View>
                <Pressable onPress={() => setShowSettings(true)} className="p-2 bg-white rounded-full border border-stone-200 shadow-sm">
                    <Settings size={20} color="#57534e" />
                </Pressable>
            </View>

            {/* Guest Sync Card */}
            {isGuest && (
                <GuestSyncCard onPressSync={() => signOut()} />
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View className="flex-1 justify-center items-center py-20 px-6">
            <View className="items-center justify-center p-8 bg-white rounded-full h-40 w-40 border-2 border-dashed border-stone-200 mb-6">
                <Palette size={48} color="#d6d3d1" />
            </View>
            <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#1A1A1A' }} className="text-2xl text-center mb-2">
                Your studio is empty.
            </AppText>
            <AppText className="text-stone-500 text-center mb-8">
                Start mixing colors to populate your gallery.
            </AppText>
            <View className="w-48">
                <AppButton
                    title="Start Mixing"
                    onPress={() => {/* TODO: Navigate to Picker */ }}
                    variant="primary"
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
            <FlatList
                data={galleryItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <View style={{ flex: 1, margin: 8 }}>
                        <GalleryCard item={item} index={index} onPress={() => handleCardPress(item)} />
                    </View>
                )}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            />

            {/* Detail Modal */}
            <GalleryDetailModal
                ref={detailModalRef}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onShare={handleShare}
            />

            {/* Settings Modal */}
            <SettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
            />

            {/* Hidden Share Generator */}
            <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                <ShareCardGenerator
                    ref={shareGeneratorRef}
                    imageUri={selectedItem?.imageUrl || null}
                    colors={selectedItem?.colors || []}
                />
            </View>
        </SafeAreaView>
    );
}
