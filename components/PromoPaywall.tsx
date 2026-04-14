import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { trackPaywallDismissed, trackPaywallPlanSelected, trackPaywallPurchased, trackPaywallViewed } from '@/services/analytics';
import { showToast } from '@/utils/toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Crown, User, X } from 'lucide-react-native';
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
import { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const PROMO_LAST_SHOWN_KEY = 'promo_paywall_last_shown';
const PROMO_SESSION_COUNT_KEY = 'promo_paywall_session_count';
const PROMO_COOLDOWN_DAYS = 3; // Show at most once every 3 days
const PROMO_MIN_SESSIONS = 3; // Don't show until 3rd session

interface PromoPaywallProps {
    visible: boolean;
    onDismiss: () => void;
}

export function PromoPaywall({ visible, onDismiss }: PromoPaywallProps) {
    const { purchasePackage, isLoading, offerings, setPendingUpgrade } = usePro();
    const { isGuest } = useAuth();
    const router = useRouter();
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (visible) trackPaywallViewed('promo');
    }, [visible]);

    useEffect(() => {
        if (offerings?.availablePackages) {
            const yearly = offerings.availablePackages.find(p => p.packageType === 'ANNUAL');
            if (yearly) setSelectedPackage(yearly);
        }
    }, [offerings]);

    const getPackage = (type: 'ANNUAL' | 'MONTHLY') => {
        return offerings?.availablePackages.find(p => p.packageType === type) || null;
    };

    const getPriceString = (type: 'ANNUAL' | 'MONTHLY') => {
        const pkg = offerings?.availablePackages.find(p => p.packageType === type);
        return pkg?.product.priceString || '...';
    };

    const getYearlyMonthlyPrice = () => {
        const pkg = offerings?.availablePackages.find(p => p.packageType === 'ANNUAL');
        if (pkg) return `$${(pkg.product.price / 12).toFixed(2)}`;
        return '...';
    };

    const getSavingsPercent = () => {
        const yearly = offerings?.availablePackages.find(p => p.packageType === 'ANNUAL');
        const monthly = offerings?.availablePackages.find(p => p.packageType === 'MONTHLY');
        if (yearly && monthly) {
            const monthlyAnnualized = monthly.product.price * 12;
            const savings = Math.round((1 - yearly.product.price / monthlyAnnualized) * 100);
            return savings > 0 ? savings : null;
        }
        return null;
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        const purchaseSuccess = await purchasePackage(selectedPackage);
        if (purchaseSuccess) {
            trackPaywallPurchased('promo', selectedPackage.packageType === 'ANNUAL' ? 'yearly' : 'monthly');
            setSuccess(true);
            setTimeout(() => {
                onDismiss();
                showToast("Welcome to the Pro Studio!", 5000);
                setTimeout(() => setSuccess(false), 500);
            }, 1500);
        }
    };

    if (success) {
        return (
            <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
                <View style={styles.backdrop}>
                    <Animated.View entering={FadeInDown.springify().damping(12)} style={styles.successCard}>
                        <View style={styles.successIcon}>
                            <Crown size={36} color="white" fill="white" />
                        </View>
                        <Text style={styles.successTitle}>You're Pro now</Text>
                        <Text style={styles.successSubtitle}>Unlimited everything. Go paint.</Text>
                    </Animated.View>
                </View>
            </Modal>
        );
    }

    const savings = getSavingsPercent();

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <Pressable style={styles.backdrop} onPress={onDismiss}>
                <Pressable style={styles.card} onPress={() => {}}>
                    {/* Close */}
                    <TouchableOpacity style={styles.closeButton} onPress={() => { trackPaywallDismissed('promo'); onDismiss(); }} hitSlop={12}>
                        <X size={18} color="#71717A" />
                    </TouchableOpacity>

                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.header}>
                        <View style={styles.crownBadge}>
                            <Crown size={20} color="#3E63DD" />
                        </View>
                        <Text style={styles.headline}>Ready to paint without limits?</Text>
                        <Text style={styles.subtext}>
                            Dedicated artists get unlimited recipes, unlimited saves, and the full temperature map.
                        </Text>
                    </Animated.View>

                    {/* Pricing Options */}
                    {offerings ? (
                        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.pricingSection}>
                            {/* Yearly */}
                            <TouchableOpacity
                                style={[
                                    styles.pricingCard,
                                    selectedPackage?.packageType === 'ANNUAL' && styles.pricingCardSelected,
                                ]}
                                onPress={() => { setSelectedPackage(getPackage('ANNUAL')); trackPaywallPlanSelected('yearly'); }}
                                activeOpacity={0.8}
                            >
                                {savings && (
                                    <View style={styles.savingsBadge}>
                                        <Text style={styles.savingsText}>SAVE {savings}%</Text>
                                    </View>
                                )}
                                <View style={styles.pricingRow}>
                                    <View style={[
                                        styles.radio,
                                        selectedPackage?.packageType === 'ANNUAL' && styles.radioSelected,
                                    ]}>
                                        {selectedPackage?.packageType === 'ANNUAL' && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <View style={styles.pricingInfo}>
                                        <Text style={styles.pricingLabel}>Yearly</Text>
                                        <Text style={styles.pricingMeta}>{getYearlyMonthlyPrice()}/mo</Text>
                                    </View>
                                    <View style={styles.priceCol}>
                                        <Text style={styles.priceAmount}>{getPriceString('ANNUAL')}</Text>
                                        <Text style={styles.pricePeriod}>/year</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Monthly */}
                            <TouchableOpacity
                                style={[
                                    styles.pricingCard,
                                    selectedPackage?.packageType === 'MONTHLY' && styles.pricingCardSelected,
                                ]}
                                onPress={() => { setSelectedPackage(getPackage('MONTHLY')); trackPaywallPlanSelected('monthly'); }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.pricingRow}>
                                    <View style={[
                                        styles.radio,
                                        selectedPackage?.packageType === 'MONTHLY' && styles.radioSelected,
                                    ]}>
                                        {selectedPackage?.packageType === 'MONTHLY' && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <View style={styles.pricingInfo}>
                                        <Text style={styles.pricingLabel}>Monthly</Text>
                                    </View>
                                    <View style={styles.priceCol}>
                                        <Text style={styles.priceAmount}>{getPriceString('MONTHLY')}</Text>
                                        <Text style={styles.pricePeriod}>/month</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#3E63DD" />
                        </View>
                    )}

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
                                <Text style={styles.ctaText}>Create Account to Subscribe</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.ctaButton, (isLoading || !selectedPackage) && styles.ctaDisabled]}
                                onPress={handlePurchase}
                                disabled={isLoading || !selectedPackage}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.ctaText}>Start Painting Like a Pro</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        <Text style={styles.cancelNote}>Cancel anytime. Less than a tube of paint.</Text>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

/**
 * Hook to manage promo paywall visibility for free users.
 * - Never shows for Pro users
 * - Waits until 3rd session
 * - Shows at most once every 3 days
 * - Shows after a 5-second delay to not interrupt flow
 */
export function usePromoPaywall() {
    const { isPro } = usePro();
    const [showPromo, setShowPromo] = useState(false);

    useEffect(() => {
        if (isPro) return; // Never show for Pro users

        checkAndShow();
    }, [isPro]);

    const checkAndShow = async () => {
        try {
            // Increment session count
            const countStr = await AsyncStorage.getItem(PROMO_SESSION_COUNT_KEY);
            const count = (countStr ? parseInt(countStr, 10) : 0) + 1;
            await AsyncStorage.setItem(PROMO_SESSION_COUNT_KEY, count.toString());

            // Don't show until minimum sessions reached
            if (count < PROMO_MIN_SESSIONS) return;

            // Check cooldown
            const lastShown = await AsyncStorage.getItem(PROMO_LAST_SHOWN_KEY);
            if (lastShown) {
                const daysSince = (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60 * 24);
                if (daysSince < PROMO_COOLDOWN_DAYS) return;
            }

            // Show after delay
            setTimeout(() => {
                setShowPromo(true);
                AsyncStorage.setItem(PROMO_LAST_SHOWN_KEY, Date.now().toString());
            }, 5000);
        } catch (e) {
            // Fail silently
        }
    };

    return {
        showPromo,
        dismissPromo: () => setShowPromo(false),
    };
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    card: {
        width: '100%',
        backgroundColor: '#161618',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#28282A',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#28282A',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 22,
        marginTop: 4,
    },
    crownBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#1a2140',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headline: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 22,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 8,
    },
    subtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 8,
    },

    // Pricing
    pricingSection: {
        gap: 10,
        marginBottom: 20,
    },
    pricingCard: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#28282A',
        backgroundColor: '#111113',
        paddingVertical: 14,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    pricingCardSelected: {
        borderColor: '#3E63DD',
        backgroundColor: '#1a1b26',
    },
    savingsBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#3E63DD',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderBottomLeftRadius: 10,
    },
    savingsText: {
        fontFamily: 'SpaceMono',
        fontSize: 9,
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 1,
    },
    pricingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#3F3F46',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioSelected: {
        borderColor: '#3E63DD',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3E63DD',
    },
    pricingInfo: {
        flex: 1,
    },
    pricingLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#FFFFFF',
    },
    pricingMeta: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#71717A',
    },
    priceCol: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    priceAmount: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    pricePeriod: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: '#71717A',
    },
    loadingContainer: {
        paddingVertical: 24,
        alignItems: 'center',
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
    cancelNote: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        marginTop: 14,
        textAlign: 'center',
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
