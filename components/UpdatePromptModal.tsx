import { AppText } from '@/components/AppText';
import { UpdateInfo } from '@/services/appConfigService';
import { trackEvent } from '@/services/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ArrowRight, Sparkles, Star } from 'lucide-react-native';
import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

interface UpdatePromptModalProps {
    visible: boolean;
    updateInfo: UpdateInfo;
    onDismiss: () => void;
}

const DISMISS_KEY = 'update_dismiss_state';

interface DismissState {
    version: string;
    count: number;
    lastDismissedAt: number;
}

export const UpdatePromptModal = ({ visible, updateInfo, onDismiss }: UpdatePromptModalProps) => {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    const isFeature = updateInfo.type === 'feature' && updateInfo.features.length > 0;

    const handleUpdate = () => {
        trackEvent('update_prompt_clicked', { type: updateInfo.type });
        Linking.openURL(updateInfo.storeUrl);
        onDismiss();
    };

    const handleDismiss = async () => {
        trackEvent('update_prompt_dismissed', { type: updateInfo.type });
        const state: DismissState = {
            version: updateInfo.latestVersion,
            count: 1,
            lastDismissedAt: Date.now(),
        };
        // Increment count if same version was dismissed before
        try {
            const raw = await AsyncStorage.getItem(DISMISS_KEY);
            if (raw) {
                const prev: DismissState = JSON.parse(raw);
                if (prev.version === updateInfo.latestVersion) {
                    state.count = prev.count + 1;
                }
            }
        } catch { /* ignore */ }
        await AsyncStorage.setItem(DISMISS_KEY, JSON.stringify(state));
        onDismiss();
    };

    if (!visible) return null;

    if (isFeature) {
        return (
            <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
                <View style={styles.overlay}>
                    <Animated.View entering={FadeIn.duration(200)} style={styles.dimmedLayer} />
                    <Animated.View entering={ZoomIn.duration(300)} style={styles.featureCard}>
                        {/* Header badge */}
                        <View style={styles.badge}>
                            <Sparkles size={14} color="#F59E0B" />
                            <AppText style={styles.badgeText}>NEW IN v{updateInfo.latestVersion}</AppText>
                        </View>

                        <AppText style={styles.featureTitle}>What's New</AppText>

                        <AppText style={styles.featureSubtitle}>{updateInfo.updateMessage}</AppText>

                        {/* Feature list */}
                        <View style={styles.featureList}>
                            {updateInfo.features.map((feature, i) => (
                                <Animated.View
                                    key={i}
                                    entering={FadeInDown.delay(100 + i * 80).duration(300)}
                                    style={styles.featureRow}
                                >
                                    <View style={styles.featureDot} />
                                    <AppText style={styles.featureText}>{feature}</AppText>
                                </Animated.View>
                            ))}
                        </View>

                        <AppText style={styles.versionTag}>
                            v{currentVersion} → v{updateInfo.latestVersion}
                        </AppText>

                        <Pressable onPress={handleUpdate} style={styles.updateButton}>
                            <AppText style={styles.updateText}>Update Now</AppText>
                            <ArrowRight size={18} color="#FFFFFF" />
                        </Pressable>

                        <Pressable onPress={handleDismiss} style={styles.laterButton}>
                            <AppText style={styles.laterText}>Maybe Later</AppText>
                        </Pressable>
                    </Animated.View>
                </View>
            </Modal>
        );
    }

    // Minor update — simple, compact prompt
    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
            <View style={styles.overlay}>
                <Animated.View entering={FadeIn.duration(200)} style={styles.dimmedLayer} />
                <Animated.View entering={ZoomIn.duration(250)} style={styles.minorCard}>
                    <Star size={24} color="#3E63DD" />

                    <View style={styles.minorContent}>
                        <AppText style={styles.minorTitle}>Update Available</AppText>
                        <AppText style={styles.minorMessage}>
                            v{updateInfo.latestVersion} — {updateInfo.updateMessage}
                        </AppText>
                    </View>

                    <View style={styles.minorActions}>
                        <Pressable onPress={handleUpdate} style={styles.minorUpdateBtn}>
                            <AppText style={styles.minorUpdateText}>Update</AppText>
                        </Pressable>
                        <Pressable onPress={handleDismiss} style={styles.minorLaterBtn}>
                            <AppText style={styles.minorLaterText}>Later</AppText>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

/**
 * Decides whether to show the update prompt based on dismiss history.
 *
 * Minor updates: dismissed once for a version → never show again for that version.
 * Feature updates: show up to 3 times, with a 5-day cooldown between each.
 */
export async function shouldShowUpdatePrompt(updateInfo: UpdateInfo | null): Promise<boolean> {
    if (!updateInfo) return false;

    try {
        const raw = await AsyncStorage.getItem(DISMISS_KEY);
        if (!raw) return true;

        const state: DismissState = JSON.parse(raw);

        // Different version → always show
        if (state.version !== updateInfo.latestVersion) return true;

        const isFeature = updateInfo.type === 'feature' && updateInfo.features.length > 0;

        if (!isFeature) {
            // Minor: dismissed once → done
            return false;
        }

        // Feature: max 3 dismissals, 5-day cooldown
        if (state.count >= 3) return false;
        const fiveDays = 5 * 24 * 60 * 60 * 1000;
        return Date.now() - state.lastDismissedAt >= fiveDays;
    } catch {
        return true;
    }
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },
    dimmedLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },

    // ── Feature card ──
    featureCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 28,
        marginHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#28282A',
        width: '88%',
        maxWidth: 380,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245,158,11,0.12)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 20,
    },
    badgeText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 11,
        color: '#F59E0B',
        letterSpacing: 1,
    },
    featureTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 26,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    featureSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#71717A',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    featureList: {
        width: '100%',
        gap: 12,
        marginBottom: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 4,
    },
    featureDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3E63DD',
    },
    featureText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#E4E4E7',
        flex: 1,
    },
    versionTag: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        marginBottom: 20,
    },
    updateButton: {
        backgroundColor: '#3E63DD',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    updateText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    laterButton: { paddingVertical: 8 },
    laterText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#52525B',
    },

    // ── Minor card ──
    minorCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#28282A',
        width: '85%',
        maxWidth: 360,
        gap: 16,
    },
    minorContent: {
        alignItems: 'center',
        gap: 6,
    },
    minorTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: '#FFFFFF',
    },
    minorMessage: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#A1A1AA',
        textAlign: 'center',
        lineHeight: 18,
    },
    minorActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    minorUpdateBtn: {
        flex: 1,
        backgroundColor: '#3E63DD',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    minorUpdateText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: '#FFFFFF',
    },
    minorLaterBtn: {
        flex: 1,
        backgroundColor: '#27272A',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    minorLaterText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#A1A1AA',
    },
});
