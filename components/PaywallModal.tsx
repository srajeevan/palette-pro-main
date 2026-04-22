import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { showToast } from '@/utils/toast';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Check, Crown, User, X as XIcon } from 'lucide-react-native';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PaywallModalProps {
    onClose?: () => void;
}

const PRO_FEATURES = [
    { label: 'Mixing recipes', free: '10 / day', pro: 'Unlimited' },
    { label: 'Saved palettes', free: '3', pro: 'Unlimited' },
    { label: 'Temperature map', free: '—', pro: '✓' },
    { label: 'Daily limits', free: 'Yes', pro: 'None' },
];

export const PaywallModal = forwardRef<BottomSheetModal, PaywallModalProps>(({ onClose }, ref) => {
    const snapPoints = useMemo(() => ['92%'], []);
    const { purchasePackage, restorePurchases, isLoading, isPro, offerings, setPendingUpgrade } = usePro();
    const { isGuest } = useAuth();
    const router = useRouter();
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [success, setSuccess] = useState(false);

    // Auto-select yearly if available
    useEffect(() => {
        if (offerings?.availablePackages) {
            const yearly = offerings.availablePackages.find(p => p.packageType === 'ANNUAL');
            if (yearly) setSelectedPackage(yearly);
        }
    }, [offerings]);

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        const purchaseSuccess = await purchasePackage(selectedPackage);
        if (purchaseSuccess) {
            setSuccess(true);
            setTimeout(() => {
                // @ts-ignore
                ref?.current?.dismiss();
                onClose?.();
                showToast("Welcome to the Pro Studio!", 5000);
                router.replace('/(tabs)');
                setTimeout(() => setSuccess(false), 500);
            }, 1200);
        }
    };

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

    if (success) {
        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backgroundStyle={styles.sheetBg}
                handleIndicatorStyle={{ backgroundColor: '#333' }}
                enablePanDownToClose={false}
            >
                <View style={styles.successContainer}>
                    <Animated.View entering={FadeInDown.springify().damping(12)} style={styles.successInner}>
                        <View style={styles.successCrownCircle}>
                            <Crown size={48} color="white" fill="white" />
                        </View>
                        <Text style={styles.successTitle}>Welcome to Pro</Text>
                        <Text style={styles.successSubtitle}>
                            Your studio is fully unlocked. Time to paint.
                        </Text>
                    </Animated.View>
                </View>
            </BottomSheetModal>
        );
    }

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            backgroundStyle={styles.sheetBg}
            handleIndicatorStyle={{ backgroundColor: '#333' }}
            enablePanDownToClose
        >
            <BottomSheetScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.header}>
                    <AppText style={styles.tagline}>CHOOSE YOUR PATH</AppText>
                    <AppText style={styles.title}>Upgrade Your Studio</AppText>
                    <Text style={styles.subtitle}>
                        Pick the plan that matches your creative commitment
                    </Text>
                </Animated.View>

                {/* Free vs Pro Comparison Table */}
                <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                    <View style={styles.comparisonTable}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <View style={styles.tableFeatureCol} />
                            <View style={styles.tableFreeCol}>
                                <Text style={styles.tableHeaderFree}>Free</Text>
                            </View>
                            <View style={styles.tableProCol}>
                                <View style={styles.proBadge}>
                                    <Crown size={10} color="#FFFFFF" fill="#FFFFFF" />
                                    <Text style={styles.proBadgeText}>PRO</Text>
                                </View>
                            </View>
                        </View>

                        {/* Table Rows */}
                        {PRO_FEATURES.map((feature, i) => (
                            <View key={i} style={[styles.tableRow, i === PRO_FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={styles.tableFeatureCol}>
                                    <Text style={styles.tableFeatureText}>{feature.label}</Text>
                                </View>
                                <View style={styles.tableFreeCol}>
                                    <Text style={styles.tableFreeValue}>{feature.free}</Text>
                                </View>
                                <View style={styles.tableProCol}>
                                    <Text style={styles.tableProValue}>{feature.pro}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Dedicated Artist Pro Card */}
                <Animated.View entering={FadeInDown.duration(400).delay(300)}>
                    <View style={styles.proCard}>
                        <View style={styles.proHeader}>
                            <Crown size={14} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.proHeaderText}>DEDICATED ARTIST</Text>
                        </View>

                        <View style={styles.proContent}>
                            <Text style={styles.proDescription}>
                                For painters who are serious about improving
                            </Text>

                            {/* Pro Feature Checklist */}
                            <View style={styles.featureList}>
                                <FeatureCheck text="Unlimited mixing recipes" />
                                <FeatureCheck text="Unlimited saved palettes" />
                                <FeatureCheck text="Temperature map unlocked" />
                                <FeatureCheck text="No daily limits — pure creative flow" />
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
                                        onPress={() => setSelectedPackage(getPackage('ANNUAL'))}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.pricingLeft}>
                                            <View style={[styles.radio, selectedPackage?.packageType === 'ANNUAL' && styles.radioSelected]}>
                                                {selectedPackage?.packageType === 'ANNUAL' && <View style={styles.radioInner} />}
                                            </View>
                                            <View>
                                                <Text style={styles.pricingLabel}>Yearly</Text>
                                                <Text style={styles.pricingSubLabel}>${getYearlyMonthlyPrice()}/mo</Text>
                                            </View>
                                        </View>
                                        <View style={styles.pricingRight}>
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
                                        onPress={() => setSelectedPackage(getPackage('MONTHLY'))}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.pricingLeft}>
                                            <View style={[styles.radio, selectedPackage?.packageType === 'MONTHLY' && styles.radioSelected]}>
                                                {selectedPackage?.packageType === 'MONTHLY' && <View style={styles.radioInner} />}
                                            </View>
                                            <Text style={styles.pricingLabel}>Monthly</Text>
                                        </View>
                                        <View style={styles.pricingRight}>
                                            <Text style={styles.pricingPrice}>{getPriceString('MONTHLY')}</Text>
                                            <Text style={styles.pricingPeriod}>/month</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#3E63DD" />
                                    <Text style={styles.loadingText}>Loading offers...</Text>
                                </View>
                            )}

                            <Text style={styles.reframing}>Less than a tube of paint per month</Text>

                            {/* CTA */}
                            {isGuest ? (
                                <TouchableOpacity
                                    style={styles.ctaButton}
                                    onPress={() => {
                                        onClose?.();
                                        // @ts-ignore
                                        ref?.current?.dismiss();
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
                                    style={[styles.ctaButton, (isLoading || !selectedPackage) && styles.ctaButtonDisabled]}
                                    onPress={handlePurchase}
                                    disabled={isLoading || !selectedPackage}
                                    activeOpacity={0.85}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.ctaText}>
                                            Start Painting Like a Pro
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>

                {/* Trust Footer */}
                <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.trustFooter}>
                    <View style={styles.trustRow}>
                        <Text style={styles.trustText}>Cancel anytime</Text>
                        <View style={styles.trustDot} />
                        <TouchableOpacity onPress={() => restorePurchases()}>
                            <Text style={styles.trustLink}>Restore</Text>
                        </TouchableOpacity>
                        <View style={styles.trustDot} />
                        <TouchableOpacity onPress={() => Linking.openURL('https://www.palettepro.app/terms.html').catch(() => {})}>
                            <Text style={styles.trustLink}>Terms</Text>
                        </TouchableOpacity>
                        <View style={styles.trustDot} />
                        <TouchableOpacity onPress={() => Linking.openURL('https://www.palettepro.app/privacy.html').catch(() => {})}>
                            <Text style={styles.trustLink}>Privacy</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
});

// Small reusable component for feature check rows
const FeatureCheck = ({ text }: { text: string }) => (
    <View style={styles.featureRow}>
        <View style={styles.checkCircle}>
            <Check size={12} color="#3E63DD" strokeWidth={3} />
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    sheetBg: {
        backgroundColor: '#0A0A0B',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 4,
    },
    tagline: {
        fontFamily: 'SpaceMono',
        fontSize: 11,
        color: '#3E63DD',
        letterSpacing: 2,
        marginBottom: 12,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 26,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#71717A',
        textAlign: 'center',
    },

    // Comparison Table
    comparisonTable: {
        backgroundColor: '#161618',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#28282A',
        overflow: 'hidden',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#28282A',
    },
    tableFeatureCol: {
        flex: 1.2,
    },
    tableFreeCol: {
        flex: 0.7,
        alignItems: 'center',
    },
    tableProCol: {
        flex: 0.7,
        alignItems: 'center',
    },
    tableHeaderFree: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: '#71717A',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3E63DD',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 4,
    },
    proBadgeText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F22',
    },
    tableFeatureText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#E4E4E7',
    },
    tableFreeValue: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#71717A',
    },
    tableProValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: 13,
        color: '#3E63DD',
    },

    // Pro Card
    proCard: {
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#3E63DD',
        backgroundColor: '#111320',
        overflow: 'hidden',
        marginBottom: 20,
    },
    proHeader: {
        backgroundColor: '#3E63DD',
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    proHeaderText: {
        fontFamily: 'SpaceMono',
        fontSize: 11,
        color: '#FFFFFF',
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    proContent: {
        padding: 22,
    },
    proDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        marginBottom: 18,
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
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#1a2140',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
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
    pricingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pricingRight: {
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
        gap: 8,
    },
    loadingText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#52525B',
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
