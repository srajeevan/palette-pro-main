import { usePro } from '@/context/ProContext';
import { useAuth } from '@/context/AuthContext';
import { trackPaywallDismissed, trackPaywallPurchased, trackPaywallViewed, trackRecipeLimitHit } from '@/services/analytics';
import { showToast } from '@/utils/toast';
import { useRouter } from 'expo-router';
import { Crown, Palette, User, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RecipeLimitOverlayProps {
    visible: boolean;
    onDismiss: () => void;
    remaining?: number;
}

export function RecipeLimitOverlay({ visible, onDismiss, remaining = 0 }: RecipeLimitOverlayProps) {
    const { purchasePackage, isLoading, offerings, setPendingUpgrade } = usePro();
    const { isGuest } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (visible) {
            trackRecipeLimitHit();
            trackPaywallViewed('recipe_limit');
        }
    }, [visible]);

    const getYearlyPackage = () => {
        return offerings?.availablePackages.find(p => p.packageType === 'ANNUAL') || null;
    };

    const getYearlyMonthlyPrice = () => {
        const pkg = getYearlyPackage();
        if (pkg) return `$${(pkg.product.price / 12).toFixed(2)}`;
        return '...';
    };

    const handleUpgrade = async () => {
        const pkg = getYearlyPackage();
        if (!pkg) return;
        const purchaseSuccess = await purchasePackage(pkg);
        if (purchaseSuccess) {
            trackPaywallPurchased('recipe_limit', 'yearly');
            setSuccess(true);
            setTimeout(() => {
                onDismiss();
                showToast("Unlimited recipes unlocked!", 4000);
                setTimeout(() => setSuccess(false), 500);
            }, 1200);
        }
    };

    if (success) {
        return (
            <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
                <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <Animated.View entering={FadeInDown.springify().damping(12)} style={styles.successCard}>
                        <View style={styles.successIcon}>
                            <Crown size={32} color="white" fill="white" />
                        </View>
                        <Text style={styles.successTitle}>Unlocked!</Text>
                        <Text style={styles.successSubtitle}>Unlimited recipes are yours</Text>
                    </Animated.View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <Pressable style={styles.backdrop} onPress={onDismiss}>
                <Pressable style={styles.card} onPress={() => {}}>
                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.headerSection}>
                        <View style={styles.limitIcon}>
                            <Palette size={28} color="#3E63DD" />
                        </View>
                        <Text style={styles.headline}>
                            You've used all 10 recipes for today
                        </Text>
                        <Text style={styles.subtext}>
                            Serious artists need unlimited access to keep their creative flow going
                        </Text>
                    </Animated.View>

                    {/* What you get */}
                    <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.benefitsSection}>
                        <View style={styles.benefitRow}>
                            <Zap size={16} color="#3E63DD" />
                            <Text style={styles.benefitText}>Unlimited mixing recipes, every day</Text>
                        </View>
                        <View style={styles.benefitRow}>
                            <Zap size={16} color="#3E63DD" />
                            <Text style={styles.benefitText}>Unlimited saved palettes</Text>
                        </View>
                        <View style={styles.benefitRow}>
                            <Zap size={16} color="#3E63DD" />
                            <Text style={styles.benefitText}>Temperature map & all pro tools</Text>
                        </View>
                    </Animated.View>

                    {/* CTA */}
                    <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.ctaSection}>
                        {isGuest ? (
                            <TouchableOpacity
                                style={styles.ctaButton}
                                onPress={() => {
                                    onDismiss();
                                    setPendingUpgrade(true);
                                    router.push('/login');
                                }}
                                activeOpacity={0.85}
                            >
                                <User size={18} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.ctaText}>Create Account to Upgrade</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.ctaButton, isLoading && styles.ctaDisabled]}
                                onPress={handleUpgrade}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.ctaText}>
                                        Upgrade — {getYearlyMonthlyPrice()}/mo
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={() => { trackPaywallDismissed('recipe_limit'); onDismiss(); }} style={styles.dismissButton}>
                            <Text style={styles.dismissText}>I'll wait until tomorrow</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
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

    // Header
    headerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    limitIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#1a2140',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    headline: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 22,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 10,
    },
    subtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Benefits
    benefitsSection: {
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
    benefitText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#E4E4E7',
    },

    // CTA
    ctaSection: {
        alignItems: 'center',
    },
    ctaButton: {
        width: '100%',
        backgroundColor: '#3E63DD',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#3E63DD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    ctaDisabled: {
        opacity: 0.5,
    },
    ctaText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    dismissButton: {
        marginTop: 16,
        paddingVertical: 8,
    },
    dismissText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#52525B',
    },

    // Success
    successCard: {
        backgroundColor: '#161618',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#28282A',
        padding: 40,
        alignItems: 'center',
    },
    successIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#3E63DD',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        shadowColor: '#3E63DD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    successTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 24,
        color: '#FFFFFF',
        marginBottom: 6,
    },
    successSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#71717A',
    },
});
