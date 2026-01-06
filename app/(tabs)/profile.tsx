import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { GalleryCard, GalleryItem } from '@/components/GalleryCard';
import { GuestSyncCard } from '@/components/GuestSyncCard';
import { ShareCardGenerator, ShareCardGeneratorRef } from '@/components/ShareCardGenerator';
import { useAuth } from '@/context/AuthContext';
import { loadPalettes } from '@/services/paletteService';
import { useFocusEffect, useRouter } from 'expo-router';
import { Palette, Settings } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Share as NativeShare, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GalleryDetailModal } from '@/components/GalleryDetailModal';
import { SettingsModal } from '@/components/SettingsModal';
import { BottomSheetModal } from '@gorhom/bottom-sheet';


import { PaywallModal } from '@/components/PaywallModal';

// ... (imports)

export default function ProfileScreen() {
    const { user, loading, isGuest, signOut } = useAuth();
    const router = useRouter();

    // State
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loadingPalettes, setLoadingPalettes] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const detailModalRef = useRef<BottomSheetModal>(null);
    const paywallRef = useRef<BottomSheetModal>(null);
    const shareGeneratorRef = useRef<ShareCardGeneratorRef>(null);

    // Fetch on focus to get updates from Studio
    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchPalettes();
            }
        }, [user])
    );

    const fetchPalettes = async () => {
        setLoadingPalettes(true);
        console.log('🏁 Profile: fetchPalettes started');
        try {
            const { data, error } = await loadPalettes();
            if (error) {
                console.error('❌ Profile: Error loading palettes:', error);
            } else if (data) {
                console.log('📦 Profile: Received data:', data.length);
                const items: GalleryItem[] = data.map(p => ({
                    id: p.id,
                    imageUrl: p.image_url || 'https://via.placeholder.com/400', // Fallback
                    colors: p.colors
                }));
                setGalleryItems(items);
            } else {
                console.log('⚠️ Profile: No data received');
            }
        } catch (e) {
            console.error('❌ Profile: Exception loading palettes:', e);
        } finally {
            setLoadingPalettes(false);
        }
    };

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
        <View className="px-6 pt-2 pb-6">
            {/* Header Row */}
            <View className="flex-row justify-between items-start mb-6">
                <View>
                    <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#FFFFFF' }} className="text-3xl">
                        {isGuest ? "Guest Artist" : user?.email?.split('@')[0] || "Artist"}
                    </AppText>
                    <AppText style={{ fontFamily: 'Inter_500Medium', color: '#A1A1AA' }} className="text-base mt-2">
                        Member since 2024 • {galleryItems.length} Palettes Created
                    </AppText>
                </View>
                <Pressable
                    onPress={() => setShowSettings(true)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E] border border-[#28282A]"
                >
                    <Settings size={20} color="#A1A1AA" />
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
            <View
                className="items-center justify-center p-8 rounded-full h-40 w-40 mb-6"
                style={{
                    borderWidth: 2,
                    borderColor: '#28282A',
                    borderStyle: 'dashed',
                }}
            >
                <Palette size={40} color="#52525B" />
            </View>
            <AppText style={{ fontFamily: 'PlayfairDisplay_700Bold', color: '#FFFFFF' }} className="text-2xl text-center mb-2">
                Your studio is empty.
            </AppText>
            <AppText style={{ fontFamily: 'Times New Roman', fontStyle: 'italic' }} className="text-[#A1A1AA] text-lg text-center mb-8 px-4">
                "Your journey begins with a single reference."
            </AppText>
            <View className="w-48">
                <AppButton
                    title="Start Mixing"
                    onPress={() => router.push('/(tabs)/palette')}
                    variant="primary"
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top']}>
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
                showsVerticalScrollIndicator={false}
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
                onManageSubscription={() => {
                    setShowSettings(false);
                    // Small delay to allow modal to close smoothly before opening paywall
                    setTimeout(() => {
                        paywallRef.current?.present();
                    }, 300);
                }}
            />

            {/* Hidden Share Generator */}
            <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                <ShareCardGenerator
                    ref={shareGeneratorRef}
                    imageUri={selectedItem?.imageUrl || null}
                    colors={selectedItem?.colors || []}
                />
            </View>

            {/* Paywall Modal */}
            <PaywallModal ref={paywallRef} />
        </SafeAreaView>
    );
}
