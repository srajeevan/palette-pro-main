import { trackNotificationPermission } from '@/services/analytics';
import {
    hasAskedPermission,
    requestNotificationPermission,
    scheduleRetentionNotifications,
} from '@/services/notificationService';
import { Bell, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface NotificationPrimingProps {
    visible: boolean;
    onDismiss: () => void;
}

export function NotificationPriming({ visible, onDismiss }: NotificationPrimingProps) {
    const handleEnable = async () => {
        const granted = await requestNotificationPermission();
        trackNotificationPermission(granted);
        if (granted) {
            await scheduleRetentionNotifications();
        }
        onDismiss();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <Pressable style={styles.backdrop} onPress={onDismiss}>
                <Pressable style={styles.card} onPress={() => {}}>
                    {/* Close */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onDismiss}
                        hitSlop={12}
                    >
                        <X size={18} color="#71717A" />
                    </TouchableOpacity>

                    {/* Icon */}
                    <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.iconWrapper}>
                        <View style={styles.iconCircle}>
                            <Bell size={32} color="#3E63DD" />
                        </View>
                    </Animated.View>

                    {/* Content */}
                    <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.textContent}>
                        <Text style={styles.headline}>
                            Never lose your streak
                        </Text>
                        <Text style={styles.subtext}>
                            Get a gentle reminder to keep your painting momentum going. We'll also share color tips and inspiration.
                        </Text>
                    </Animated.View>

                    {/* Benefits */}
                    <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.benefits}>
                        <View style={styles.benefitRow}>
                            <Text style={styles.benefitEmoji}>{'\uD83D\uDD25'}</Text>
                            <Text style={styles.benefitText}>Daily streak reminders</Text>
                        </View>
                        <View style={styles.benefitRow}>
                            <Text style={styles.benefitEmoji}>{'\uD83C\uDFA8'}</Text>
                            <Text style={styles.benefitText}>Color tips and inspiration</Text>
                        </View>
                        <View style={styles.benefitRow}>
                            <Text style={styles.benefitEmoji}>{'\uD83D\uDCBE'}</Text>
                            <Text style={styles.benefitText}>Unsaved palette alerts</Text>
                        </View>
                    </Animated.View>

                    {/* Buttons */}
                    <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.enableButton}
                            onPress={handleEnable}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.enableText}>Enable Reminders</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={onDismiss}
                        >
                            <Text style={styles.skipText}>Not now</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

/**
 * Hook to manage notification priming visibility.
 * Shows the priming modal after the user's 3rd app session
 * (by which point they've experienced value).
 */
export function useNotificationPriming() {
    const [showPriming, setShowPriming] = useState(false);

    useEffect(() => {
        checkShouldShow();
    }, []);

    const checkShouldShow = async () => {
        const asked = await hasAskedPermission();
        if (asked) return; // Already asked, don't show again

        // Show after a delay to not interrupt the user
        setTimeout(() => setShowPriming(true), 3000);
    };

    return {
        showPriming,
        dismissPriming: () => setShowPriming(false),
    };
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        backgroundColor: '#161618',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#28282A',
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#28282A',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },

    // Icon
    iconWrapper: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 4,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#1a2140',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Text
    textContent: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headline: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 24,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        textAlign: 'center',
        lineHeight: 21,
        paddingHorizontal: 8,
    },

    // Benefits
    benefits: {
        backgroundColor: '#111113',
        borderRadius: 16,
        padding: 18,
        gap: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1E1E20',
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitEmoji: {
        fontSize: 18,
    },
    benefitText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#E4E4E7',
    },

    // Buttons
    buttons: {
        alignItems: 'center',
        gap: 12,
    },
    enableButton: {
        width: '100%',
        backgroundColor: '#3E63DD',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#3E63DD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    enableText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    skipButton: {
        paddingVertical: 6,
    },
    skipText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#52525B',
    },
});
