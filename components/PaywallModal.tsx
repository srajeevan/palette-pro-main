import { AppText } from '@/components/AppText';
import { useAuth } from '@/context/AuthContext';
import { usePro } from '@/context/ProContext';
import { showToast } from '@/utils/toast';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Crown, User } from 'lucide-react-native';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PaywallModalProps {
    onClose?: () => void;
}

export const PaywallModal = forwardRef<BottomSheetModal, PaywallModalProps>(({ onClose }, ref) => {
    const snapPoints = useMemo(() => ['85%'], []);
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

        const success = await purchasePackage(selectedPackage);

        if (success) {
            // Trigger Success Animation
            setSuccess(true);

            // Dismiss after delay and navigate
            setTimeout(() => {
                // @ts-ignore
                ref?.current?.dismiss();
                onClose?.();

                showToast("Welcome to the Pro Studio! 🎨✨", 5000);

                // Navigate to Studio (/(tabs))
                router.replace('/(tabs)');

                // Reset state after close
                setTimeout(() => setSuccess(false), 500);
            }, 1200);
        }
    };

    // Features List - Updated for Catchiness
    const features = [
        { icon: '🎨', title: 'Mixing Recipes', desc: 'Don\'t just guess. Mix with precision.' },
        { icon: '👁️', title: 'Tonal Analysis', desc: 'See values like the Old Masters.' },
        { icon: '💾', title: 'Unlimited Library', desc: 'Your digital studio, always with you.' },
    ];

    const getPriceString = (type: 'ANNUAL' | 'MONTHLY') => {
        const pkg = offerings?.availablePackages.find(p => p.packageType === type);
        return pkg?.product.priceString || 'Loading...';
    };

    // Calculate simulated monthly price for yearly plan
    const getYearlyMonthlyPrice = () => {
        const pkg = offerings?.availablePackages.find(p => p.packageType === 'ANNUAL');
        if (pkg) {
            const price = pkg.product.price;
            return (price / 12).toFixed(2);
        }
        return '...';
    };

    // Helper to get package by type for selection logic
    const getPackage = (type: 'ANNUAL' | 'MONTHLY') => {
        return offerings?.availablePackages.find(p => p.packageType === type) || null;
    };

    if (success) {
        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backgroundStyle={{ backgroundColor: '#0A0A0B' }}
                handleIndicatorStyle={{ backgroundColor: '#333' }}
                enablePanDownToClose={false}
            >
                <BottomSheetView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }}>
                    <Animated.View
                        entering={FadeInDown.springify().damping(12)}
                        className="items-center"
                    >
                        <View className="w-24 h-24 rounded-full bg-[#3E63DD] items-center justify-center mb-6 shadow-2xl shadow-blue-500/50">
                            <Crown size={48} color="white" fill="white" />
                        </View>
                        <AppText className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'PlayfairDisplay_700Bold' }}>
                            Welcome to Pro
                        </AppText>
                        <AppText className="text-stone-400 text-center px-10" style={{ fontFamily: 'Inter_500Medium' }}>
                            Your studio is now fully unlocked.
                        </AppText>
                    </Animated.View>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: '#0A0A0B' }}
            handleIndicatorStyle={{ backgroundColor: '#333' }}
            enablePanDownToClose
        >
            <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 12 }}>
                {/* Header */}
                <View className="items-center mb-6">
                    <View className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 items-center justify-center mb-4 bg-[#3E63DD] shadow-lg shadow-blue-500/20">
                        <Crown size={32} color="white" fill="white" />
                    </View>

                    {/* Marketing Tagline with distinct font */}
                    <AppText className="text-xs font-bold mb-2 tracking-[3px] uppercase" style={{ color: '#3E63DD', fontFamily: 'SpaceMono' }}>
                        THE ULTIMATE ARTIST TOOLKIT
                    </AppText>

                    {/* Main Title */}
                    <AppText className="text-3xl font-bold mb-3 text-center" style={{ color: '#FFFFFF', fontFamily: 'PlayfairDisplay_700Bold' }}>
                        Unleash Your Creativity
                    </AppText>

                    {/* Subheading - Clarity Improved */}
                    <AppText className="text-base text-center px-2" style={{ color: '#E4E4E7', lineHeight: 24, fontFamily: 'Inter_500Medium' }}>
                        Join thousands of artists mastering color with accurate mixing recipes and tonal tools.
                    </AppText>
                </View>

                {/* Features */}
                <View className="mb-8 space-y-5">
                    {features.map((feature, index) => (
                        <View key={index} className="flex-row items-center bg-[#161618] p-3 rounded-2xl border border-[#28282A]">
                            <View className="w-10 h-10 rounded-full bg-[#27272A] items-center justify-center mr-4">
                                <AppText className="text-lg">{feature.icon}</AppText>
                            </View>
                            <View className="flex-1">
                                <AppText className="font-bold text-base mb-0.5" style={{ color: '#FFFFFF' }}>{feature.title}</AppText>
                                <AppText className="text-xs" style={{ color: '#A1A1AA' }}>{feature.desc}</AppText>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Pricing Options */}
                {offerings ? (
                    <View className="mb-4 space-y-3">
                        {/* Yearly Option - Highlighted */}
                        <TouchableOpacity
                            className={`flex-row items-center p-4 rounded-2xl border-2 ${selectedPackage?.packageType === 'ANNUAL' ? 'border-[#3E63DD] bg-[#1a1b26]' : 'border-[#28282A]'}`}
                            onPress={() => setSelectedPackage(getPackage('ANNUAL'))}
                        >
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${selectedPackage?.packageType === 'ANNUAL' ? 'border-[#3E63DD]' : 'border-stone-600'}`}>
                                {selectedPackage?.packageType === 'ANNUAL' && <View className="w-2.5 h-2.5 rounded-full bg-[#3E63DD]" />}
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center">
                                    <AppText className="font-bold text-base mr-2" style={{ color: '#FFFFFF' }}>Yearly Access</AppText>
                                    <View className="bg-[#3E63DD] px-1.5 py-0.5 rounded">
                                        <AppText className="text-[10px] font-bold text-white uppercase" style={{ fontFamily: 'SpaceMono' }}>BEST VALUE</AppText>
                                    </View>
                                </View>
                                {/* Hook: Safe 40% */}
                                <AppText className="text-xs mt-0.5" style={{ color: '#A1A1AA' }}>
                                    {`Billed at ${getPriceString('ANNUAL')}/yr`}
                                </AppText>
                            </View>
                            <View className="items-end">
                                <AppText className="font-bold text-lg" style={{ color: '#FFFFFF' }}>${getYearlyMonthlyPrice()}<AppText className="text-xs" style={{ color: '#A1A1AA' }}>/mo</AppText></AppText>
                            </View>
                        </TouchableOpacity>

                        {/* Monthly Option */}
                        <TouchableOpacity
                            className={`flex-row items-center p-4 rounded-2xl border ${selectedPackage?.packageType === 'MONTHLY' ? 'border-[#3E63DD] bg-[#161618]' : 'border-[#28282A]'}`}
                            onPress={() => setSelectedPackage(getPackage('MONTHLY'))}
                        >
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${selectedPackage?.packageType === 'MONTHLY' ? 'border-[#3E63DD]' : 'border-stone-600'}`}>
                                {selectedPackage?.packageType === 'MONTHLY' && <View className="w-2.5 h-2.5 rounded-full bg-[#3E63DD]" />}
                            </View>
                            <View className="flex-1">
                                <AppText className="font-bold text-base" style={{ color: selectedPackage?.packageType === 'MONTHLY' ? '#FFFFFF' : '#71717A' }}>Monthly Access</AppText>
                                {/* Hook: Less than a tube of paint */}
                                <AppText className="text-xs mt-0.5" style={{ color: '#71717A' }}>Less than a tube of paint.</AppText>
                            </View>
                            <View className="items-end">
                                <AppText className="font-bold text-lg" style={{ color: '#FFFFFF' }}>{getPriceString('MONTHLY')}<AppText className="text-xs" style={{ color: '#A1A1AA' }}>/mo</AppText></AppText>
                            </View>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="py-8 items-center">
                        <ActivityIndicator color="#3E63DD" />
                        <AppText className="text-stone-500 mt-2">Loading offers...</AppText>
                    </View>
                )}

                {/* CTA */}
                {isGuest ? (
                    <View className="mb-6">
                        <TouchableOpacity
                            onPress={() => {
                                onClose?.();
                                // @ts-ignore
                                ref?.current?.dismiss();
                                setPendingUpgrade(true);
                                router.push('/login');
                            }}
                            className="w-full bg-[#3E63DD] py-4 rounded-full items-center justify-center shadow-lg shadow-blue-500/40 flex-row"
                            style={{ shadowColor: '#3E63DD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                        >
                            <User size={20} color="white" style={{ marginRight: 8 }} />
                            <AppText className="font-bold text-lg text-white uppercase tracking-wide" style={{ fontFamily: 'Inter_700Bold' }}>
                                Create Account to Subscribe
                            </AppText>
                        </TouchableOpacity>
                        <AppText className="text-center text-[10px] text-[#8E8E93] mt-3" style={{ fontFamily: 'Inter_500Medium' }}>
                            Save your palettes and sync across devices.
                        </AppText>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={handlePurchase}
                        disabled={isLoading || !selectedPackage}
                        className="w-full bg-[#3E63DD] py-4 rounded-full items-center justify-center mb-6 shadow-lg shadow-blue-500/40"
                        style={{ shadowColor: '#3E63DD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, opacity: (isLoading || !selectedPackage) ? 0.5 : 1 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <AppText className="font-bold text-lg text-white uppercase tracking-wide" style={{ fontFamily: 'Inter_700Bold' }}>
                                {selectedPackage?.packageType === 'ANNUAL' ? 'Subscribe Yearly' : 'Subscribe Monthly'}
                            </AppText>
                        )}
                    </TouchableOpacity>
                )}

                {/* Footer Links */}
                <View className="flex-row justify-center space-x-6 pb-4">
                    <TouchableOpacity onPress={() => restorePurchases()}>
                        <AppText className="text-xs font-medium" style={{ color: '#52525B' }}>Restore</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL('https://www.palettepro.app/terms.html')}>
                        <AppText className="text-xs font-medium" style={{ color: '#52525B' }}>Terms of Service</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL('https://www.palettepro.app/privacy.html')}>
                        <AppText className="text-xs font-medium" style={{ color: '#52525B' }}>Privacy Policy</AppText>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});
