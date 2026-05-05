import { AppText } from '@/components/AppText';
import { GalleryCard, GalleryItem } from '@/components/GalleryCard';
import { GuestSyncCard } from '@/components/GuestSyncCard';
import { SceneTransition } from '@/components/SceneTransition';
import { ShareCardGenerator, ShareCardGeneratorRef } from '@/components/ShareCardGenerator';
import { StreakBanner } from '@/components/StreakBanner';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { deletePalette, loadPalettes } from '@/services/paletteService';
import { useEngagementStore } from '@/store/useEngagementStore';
import { useProjectStore } from '@/store/useProjectStore';
import { showToast } from '@/utils/toast';
import { useFocusEffect, useRouter } from 'expo-router';
import { Crown, Flame, Palette, Pipette, Plus, SlidersHorizontal } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, Share as NativeShare, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GalleryDetailModal } from '@/components/GalleryDetailModal';
import { PaywallModal } from '@/components/PaywallModal';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export default function HomeScreen() {
    const { user, loading, isGuest, signOut } = useAuth();
    const { isPro } = usePro();
    const router = useRouter();
    const currentStreak = useEngagementStore((s) => s.currentStreak);
    const longestStreak = useEngagementStore((s) => s.longestStreak);
    const isPaletteDirty = useProjectStore((s) => s.isPaletteDirty);
    const isFromSavedPalette = useProjectStore((s) => s.isFromSavedPalette);
    const hasGeneratedPalette = useProjectStore((s) => s.generatedPalette.length > 0);

    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loadingPalettes, setLoadingPalettes] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const detailModalRef = useRef<BottomSheetModal>(null);
    const paywallRef = useRef<BottomSheetModal>(null);
    const shareGeneratorRef = useRef<ShareCardGeneratorRef>(null);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchPalettes();
            }
        }, [user])
    );

    const fetchPalettes = async () => {
        setLoadingPalettes(true);
        try {
            const { data, error } = await loadPalettes();
            if (error) {
                console.error('Error loading palettes:', error);
            } else if (data) {
                const items: GalleryItem[] = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    imageUrl: p.image_url || 'https://via.placeholder.com/400',
                    colors: p.colors,
                    type: p.type || 'palette',
                    effects: p.effects,
                }));
                setGalleryItems(items);
            }
        } catch (e) {
            console.error('Exception loading palettes:', e);
        } finally {
            setLoadingPalettes(false);
        }
    };

    const handleOpenItem = (item: GalleryItem) => {
        try {
            const store = require('@/store/useProjectStore').useProjectStore;
            const colors = item.colors ?? [];
            const presets = [4, 6, 8, 12];
            const closest = colors.length > 0
                ? presets.reduce((prev, curr) =>
                    Math.abs(curr - colors.length) < Math.abs(prev - colors.length) ? curr : prev
                )
                : 6;
            store.setState({
                imageUri: item.imageUrl,
                imageDimensions: null,
                isUploading: false,
                pickedColors: [],
                generatedPalette: colors,
                colorCount: closest,
                isPaletteDirty: false,
                isFromSavedPalette: true,
                restoredEffects: item.effects ?? null,
                restoredSaveType: item.type ?? 'palette',
            });
            setSelectedItem(null);
            detailModalRef.current?.dismiss();
            setTimeout(() => {
                let target: string;
                switch (item.type) {
                    case 'squint':
                    case 'valuemap':
                        target = '/(tabs)/tools';
                        break;
                    case 'studio':
                        target = '/(tabs)/studio';
                        break;
                    default:
                        target = '/(tabs)/palette';
                }
                router.push(target as any);
            }, 300);
        } catch (e) {
            console.error('Failed to open item:', e);
        }
    };

    const handleCardPress = (item: GalleryItem) => {
        setSelectedItem(item);
        detailModalRef.current?.present();
    };

    const handleDeleteItem = (item: GalleryItem) => {
        const label = item.type === 'palette' ? 'palette' : 'saved image';
        Alert.alert(
            `Delete ${label}?`,
            `This will permanently delete this ${label} and its image. This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const previous = galleryItems;
                        setGalleryItems((list) => list.filter((i) => i.id !== item.id));
                        setSelectedItem(null);
                        detailModalRef.current?.dismiss();

                        const { error } = await deletePalette(item.id);
                        if (error) {
                            console.error('Delete failed:', error);
                            setGalleryItems(previous);
                            showToast(`Could not delete ${label}. Please try again.`);
                            return;
                        }
                        showToast('Deleted.');
                    },
                },
            ],
        );
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
        return <View style={{ flex: 1, backgroundColor: '#0A0A0B' }} />;
    }

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Greeting */}
            <View style={styles.greetingRow}>
                <View style={{ flex: 1 }}>
                    <AppText style={styles.greeting}>
                        {isGuest ? "Guest Artist" : user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Artist"}
                    </AppText>
                    <AppText style={styles.subtitle}>
                        {isGuest
                            ? 'Guest User'
                            : `Member since ${new Date(user?.created_at || Date.now()).getFullYear()}`
                        }
                    </AppText>
                </View>
                {isPro && (
                    <View style={styles.proBadge}>
                        <Crown size={14} color="#F59E0B" />
                        <AppText style={styles.proBadgeText}>PRO</AppText>
                    </View>
                )}
            </View>

            {/* Guest Sync Card */}
            {isGuest && (
                <View style={{ marginBottom: 16 }}>
                    <GuestSyncCard onPressSync={() => signOut()} />
                </View>
            )}

            {/* Streak Banner */}
            <StreakBanner />

            {/* Stats Strip */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsStrip}>
                <View style={styles.statItem}>
                    <AppText style={styles.statValue}>{galleryItems.length}</AppText>
                    <AppText style={styles.statLabel}>Saves</AppText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <AppText style={styles.statValue}>{longestStreak}</AppText>
                        {longestStreak >= 3 && <Flame size={14} color="#F59E0B" />}
                    </View>
                    <AppText style={styles.statLabel}>Best Streak</AppText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <AppText style={styles.statValue}>
                        {galleryItems.reduce((sum, item) => sum + (item.colors?.length || 0), 0)}
                    </AppText>
                    <AppText style={styles.statLabel}>Colors</AppText>
                </View>
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.quickActions}>
                <Pressable
                    style={styles.quickActionPrimary}
                    onPress={() => {
                        // Reset project so the palette screen shows the upload placeholder
                        const { resetProject } = require('@/store/useProjectStore').useProjectStore.getState();
                        resetProject();
                        router.push('/(tabs)/palette');
                    }}
                >
                    <Plus size={18} color="#FFFFFF" />
                    <AppText style={styles.quickActionPrimaryText}>New Palette</AppText>
                </Pressable>
                <Pressable
                    style={styles.quickActionSecondary}
                    onPress={() => router.push('/(tabs)/studio')}
                >
                    <Pipette size={18} color="#3E63DD" />
                    <AppText style={styles.quickActionSecondaryText}>Pick Colors</AppText>
                </Pressable>
                <Pressable
                    style={styles.quickActionSecondary}
                    onPress={() => router.push('/(tabs)/tools')}
                >
                    <SlidersHorizontal size={18} color="#3E63DD" />
                    <AppText style={styles.quickActionSecondaryText}>Tools</AppText>
                </Pressable>
            </Animated.View>

            {/* Continue Card — shown only when there's a genuinely unsaved palette on a new image */}
            {isPaletteDirty && hasGeneratedPalette && !isFromSavedPalette && (
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                    <Pressable
                        style={styles.continueCard}
                        onPress={() => router.push('/(tabs)/palette')}
                    >
                        <View style={styles.continueLeft}>
                            <View style={styles.continueDot} />
                            <View>
                                <AppText style={styles.continueTitle}>Unsaved palette</AppText>
                                <AppText style={styles.continueSubtitle}>Continue where you left off</AppText>
                            </View>
                        </View>
                        <AppText style={styles.continueArrow}>›</AppText>
                    </Pressable>
                </Animated.View>
            )}

            {/* Section Title */}
            {galleryItems.length > 0 && (
                <AppText style={styles.sectionTitle}>YOUR COLLECTION</AppText>
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconRing}>
                <Palette size={36} color="#3E63DD" />
            </View>
            <AppText style={styles.emptyTitle}>No palettes yet</AppText>
            <AppText style={styles.emptySubtitle}>
                Upload a reference photo and extract your first color palette.
            </AppText>
            <Pressable
                style={styles.emptyCta}
                onPress={() => router.push('/(tabs)/palette')}
            >
                <Plus size={18} color="#FFFFFF" />
                <AppText style={styles.emptyCtaText}>Create Your First Palette</AppText>
            </Pressable>
        </View>
    );

    return (
        <SceneTransition style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0B' }} edges={['top']}>
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

                <GalleryDetailModal
                    ref={detailModalRef}
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onShare={handleShare}
                    onOpenInStudio={handleOpenItem}
                    onDelete={handleDeleteItem}
                    canDelete={isPro}
                />

                <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                    <ShareCardGenerator
                        ref={shareGeneratorRef}
                        imageUri={selectedItem?.imageUrl || null}
                        colors={selectedItem?.colors || []}
                    />
                </View>

                <PaywallModal ref={paywallRef} />
            </SafeAreaView>
        </SceneTransition>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },

    // Greeting
    greetingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    greeting: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28,
        color: '#FFFFFF',
    },
    subtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#71717A',
        marginTop: 4,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245,158,11,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginTop: 4,
    },
    proBadgeText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 11,
        color: '#F59E0B',
        letterSpacing: 1,
    },

    // Stats Strip
    statsStrip: {
        flexDirection: 'row',
        backgroundColor: '#161618',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#28282A',
        paddingVertical: 16,
        marginTop: 16,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: '#FFFFFF',
    },
    statLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: '#71717A',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#28282A',
    },

    // Quick Actions
    quickActions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    quickActionPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3E63DD',
        borderRadius: 14,
        paddingVertical: 14,
    },
    quickActionPrimaryText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#FFFFFF',
    },
    quickActionSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#161618',
        borderRadius: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#28282A',
    },
    quickActionSecondaryText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#E4E4E7',
    },

    // Continue Card
    continueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#161618',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#28282A',
        marginBottom: 16,
    },
    continueLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    continueDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F59E0B',
    },
    continueTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#FFFFFF',
    },
    continueSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#71717A',
        marginTop: 2,
    },
    continueArrow: {
        fontFamily: 'Inter_500Medium',
        fontSize: 24,
        color: '#52525B',
    },

    // Section Title
    sectionTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: '#52525B',
        letterSpacing: 1.5,
        marginTop: 8,
        marginBottom: 12,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 32,
    },
    emptyIconRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(62,99,221,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(62,99,221,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 22,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#71717A',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3E63DD',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    emptyCtaText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: '#FFFFFF',
    },
});
