import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingCompleted, trackOnboardingStep, trackPaywallDismissed, trackPaywallPlanSelected, trackPaywallPurchased, trackPaywallViewed } from '@/services/analytics';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { showToast } from '@/utils/toast';
import { useRouter } from 'expo-router';
import { Check, Crown, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 9;

const PRO_FEATURES = [
    'Unlimited mixing recipes',
    'Unlimited saved palettes',
    'Temperature map unlocked',
    'No daily limits — pure creative flow',
];

const FREE_FEATURES = [
    '10 mixing recipes per day',
    '3 saved palettes',
    'Palette generator & squint tool',
];

export default function OnboardingPaywallScreen() {
    const router = useRouter();
    const { purchasePackage, restorePurchases, isLoading, offerings, setPendingUpgrade } = usePro();
    const { isGuest } = useAuth();
    const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        trackOnboardingStep('paywall');
        trackPaywallViewed('onboarding');
    }, []);

    // Auto-select yearly
    useEffect(() => {
        if (offerings?.availablePackages) {
            const yearly = offerings.availablePackages.find(p => p.packageType === 'ANNUAL');
            if (yearly) setSelectedPackage(yearly);
        }
    }, [offerings]);

    const getPriceString = (type: 'ANNUAL' | 'MONTHLY') => {
        const pkg = offerings?.availablePackages.find(p => p.packageType === type);
        return pkg?.product.priceString || '...';
    };

    const getYearlyMonthlyPrice = () => {
        const pkg = offerings?.availablePackages.find(p => p.packageType === 'ANNUAL');
        if (pkg) return (pkg.product.price / 12).toFixed(2);
        return '...';
    };

    const getPackage = (type: 'ANNUAL' | 'MONTHLY') => {
        return offerings?.availablePackages.find(p => p.packageType === type) || null;
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        const purchaseSuccess = await purchasePackage(selectedPackage);
        if (purchaseSuccess) {
            trackPaywallPurchased('onboarding', selectedPackage.packageType === 'ANNUAL' ? 'yearly' : 'monthly');
            trackOnboardingCompleted({ converted: true });
            setSuccess(true);
            setTimeout(() => {
                completeOnboarding();
                router.replace('/(tabs)/palette');
                showToast("Welcome to the Pro Studio!", 5000);
            }, 1500);
        }
    };

    const handleContinueFree = () => {
        trackPaywallDismissed('onboarding');
        trackOnboardingCompleted({ converted: false });
        completeOnboarding();
        router.replace('/(tabs)/palette');
    };

    // Success state
    if (success) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.successContainer}>
                    <Animated.View
                        entering={FadeInDown.springify().damping(12)}
                        style={styles.successInner}
                    >
                        <View style={styles.successCrownCircle}>
                            <Crown size={48} color="white" fill="white" />
                        </View>
                        <Text style={styles.successTitle}>Welcome to Pro</Text>
                        <Text style={styles.successSubtitle}>
                            Your studio is fully unlocked. Time to paint.
                        </Text>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={9} total={TOTAL_STEPS} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>
                        CHOOSE YOUR PATH
                    </AppText>
                    <AppText className="text-white" style={styles.title}>
                        How do you want to paint?
                    </AppText>
                    <Text style={styles.headerSubtext}>
                        Pick the plan that matches your creative commitment
                    </Text>
                </Animated.View>

                {/* Dedicated Artist Card (Pro) */}
                <Animated.View entering={FadeInDown.duration(500).delay(250)}>
                    <View style={styles.proCard}>
                        <View style={styles.proHeader}>
                            <View style={styles.proBadge}>
                                <Crown size={14} color="#FFFFFF" fill="#FFFFFF" />
                                <Text style={styles.proBadgeText}>MOST POPULAR</Text>
                            </View>
                        </View>

                        <View style={styles.proContent}>
                            <Text style={styles.tierTitle}>Dedicated Artist</Text>
                            <Text style={styles.tierDescription}>
                                For painters who are serious about improving
                            </Text>

                            <View style={styles.featureList}>
                                {PRO_FEATURES.map((feature, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <View style={styles.checkCirclePro}>
                                            <Check size={12} color="#3E63DD" strokeWidth={3} />
                                        </View>
                                        <Text style={styles.featureTextPro}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Pricing Options */}
                            {offerings ? (
                                <View style={styles.pricingOptions}>
                                    {/* Yearly */}
                                    <TouchableOpacity
                                        style={[
                                            styles.pricingOption,
                                            selectedPackage?.packageType === 'ANNUAL' && styles.pricingOptionSelected,
                                        ]}
                                        onPress={() => { setSelectedPackage(getPackage('ANNUAL')); trackPaywallPlanSelected('yearly'); }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.pricingOptionLeft}>
                                            <View style={[
                                                styles.radio,
                                                selectedPackage?.packageType === 'ANNUAL' && styles.radioSelected,
                                            ]}>
                                                {selectedPackage?.packageType === 'ANNUAL' && (
                                                    <View style={styles.radioInner} />
                                                )}
                                            </View>
                                            <View>
                                                <Text style={styles.pricingLabel}>Yearly</Text>
                                                <Text style={styles.pricingSubLabel}>
                                                    ${getYearlyMonthlyPrice()}/mo
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.pricingOptionRight}>
                                            <Text style={styles.pricingPrice}>{getPriceString('ANNUAL')}</Text>
                                            <Text style={styles.pricingPeriod}>/year</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Monthly */}
                                    <TouchableOpacity
                                        style={[
                                            styles.pricingOption,
                                            selectedPackage?.packageType === 'MONTHLY' && styles.pricingOptionSelected,
                                        ]}
                                        onPress={() => { setSelectedPackage(getPackage('MONTHLY')); trackPaywallPlanSelected('monthly'); }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.pricingOptionLeft}>
                                            <View style={[
                                                styles.radio,
                                                selectedPackage?.packageType === 'MONTHLY' && styles.radioSelected,
                                            ]}>
                                                {selectedPackage?.packageType === 'MONTHLY' && (
                                                    <View style={styles.radioInner} />
                                                )}
                                            </View>
                                            <Text style={styles.pricingLabel}>Monthly</Text>
                                        </View>
                                        <View style={styles.pricingOptionRight}>
                                            <Text style={styles.pricingPrice}>{getPriceString('MONTHLY')}</Text>
                                            <Text style={styles.pricingPeriod}>/month</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#3E63DD" />
                                </View>
                            )}

                            <Text style={styles.reframing}>Less than a tube of paint per month</Text>

                            {/* CTA */}
                            {isGuest ? (
                                <TouchableOpacity
                                    style={styles.ctaButton}
                                    onPress={() => {
                                        setPendingUpgrade(true);
                                        completeOnboarding();
                                        router.replace('/login');
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <User size={18} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.ctaText}>Create Account to Subscribe</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.ctaButton,
                                        (isLoading || !selectedPackage) && styles.ctaButtonDisabled,
                                    ]}
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
                        </View>
                    </View>
                </Animated.View>

                {/* Casual Explorer Card (Free) */}
                <Animated.View entering={FadeInDown.duration(500).delay(400)}>
                    <View style={styles.freeCard}>
                        <View style={styles.freeContent}>
                            <Text style={styles.freeTierTitle}>Casual Explorer</Text>
                            <Text style={styles.freeTierDescription}>
                                Perfect for occasional painting sessions
                            </Text>

                            <View style={styles.featureList}>
                                {FREE_FEATURES.map((feature, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <View style={styles.checkCircleFree}>
                                            <Check size={12} color="#71717A" strokeWidth={3} />
                                        </View>
                                        <Text style={styles.featureTextFree}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <Pressable
                                style={styles.freeButton}
                                onPress={handleContinueFree}
                            >
                                <Text style={styles.freeButtonText}>Continue for free</Text>
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>

                {/* Trust Footer */}
                <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.trustFooter}>
                    <View style={styles.trustRow}>
                        <Text style={styles.trustText}>Cancel anytime</Text>
                        <View style={styles.trustDot} />
                        <TouchableOpacity onPress={() => restorePurchases()}>
                            <Text style={styles.trustLink}>Restore</Text>
                        </TouchableOpacity>
                        <View style={styles.trustDot} />
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://www.palettepro.app/terms.html').catch(() => {})}
                        >
                            <Text style={styles.trustLink}>Terms</Text>
                        </TouchableOpacity>
                        <View style={styles.trustDot} />
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://www.palettepro.app/privacy.html').catch(() => {})}
                        >
                            <Text style={styles.trustLink}>Privacy</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0B',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 28,
        marginTop: 8,
    },
    tagline: {
        fontFamily: 'SpaceMono',
        fontSize: 12,
        color: '#3E63DD',
        letterSpacing: 2,
        marginBottom: 14,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: 10,
    },
    headerSubtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#71717A',
        textAlign: 'center',
    },

    // Pro Card
    proCard: {
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#3E63DD',
        backgroundColor: '#111320',
        overflow: 'hidden',
        marginBottom: 16,
    },
    proHeader: {
        backgroundColor: '#3E63DD',
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    proBadgeText: {
        fontFamily: 'SpaceMono',
        fontSize: 11,
        color: '#FFFFFF',
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    proContent: {
        padding: 22,
    },
    tierTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 24,
        color: '#FFFFFF',
        marginBottom: 6,
    },
    tierDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        marginBottom: 20,
    },
    featureList: {
        gap: 12,
        marginBottom: 22,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkCirclePro: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#1a2140',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTextPro: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#E4E4E7',
    },

    // Pricing
    pricingOptions: {
        gap: 10,
        marginBottom: 14,
    },
    pricingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#161618',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#28282A',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    pricingOptionSelected: {
        borderColor: '#3E63DD',
        backgroundColor: '#1a1b26',
    },
    pricingOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pricingOptionRight: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#3F3F46',
        alignItems: 'center',
        justifyContent: 'center',
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
    pricingLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#FFFFFF',
    },
    pricingSubLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#71717A',
    },
    pricingPrice: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: '#FFFFFF',
    },
    pricingPeriod: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#71717A',
    },
    reframing: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#71717A',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 20,
    },
    loadingContainer: {
        paddingVertical: 24,
        alignItems: 'center',
    },

    // CTA
    ctaButton: {
        backgroundColor: '#3E63DD',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#3E63DD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaButtonDisabled: {
        opacity: 0.5,
    },
    ctaText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: '#FFFFFF',
    },

    // Free Card
    freeCard: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#28282A',
        backgroundColor: '#161618',
        overflow: 'hidden',
        marginBottom: 24,
    },
    freeContent: {
        padding: 22,
    },
    freeTierTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: '#A1A1AA',
        marginBottom: 6,
    },
    freeTierDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#71717A',
        marginBottom: 18,
    },
    checkCircleFree: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTextFree: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#71717A',
    },
    freeButton: {
        marginTop: 18,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#28282A',
        alignItems: 'center',
    },
    freeButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#71717A',
    },

    // Trust Footer
    trustFooter: {
        marginBottom: 16,
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    trustText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: '#52525B',
    },
    trustLink: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: '#52525B',
        paddingVertical: 4,
    },
    trustDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#3F3F46',
    },

    // Success
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 100,
    },
    successInner: {
        alignItems: 'center',
    },
    successCrownCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#3E63DD',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#3E63DD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
    successTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 30,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    successSubtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#71717A',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
