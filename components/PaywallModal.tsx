import { AppText } from '@/components/AppText';
import { usePro } from '@/context/ProContext';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Crown } from 'lucide-react-native';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PaywallModalProps {
    onClose?: () => void;
}

export const PaywallModal = forwardRef<BottomSheetModal, PaywallModalProps>(({ onClose }, ref) => {
    const snapPoints = useMemo(() => ['85%'], []);
    const { purchasePackage, restorePurchases, isLoading, isPro, offerings } = usePro();
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

    // Auto-select yearly if available
    useEffect(() => {
        if (offerings?.availablePackages) {
            const yearly = offerings.availablePackages.find(p => p.packageType === 'ANNUAL');
            if (yearly) setSelectedPackage(yearly);
        }
    }, [offerings]);

    const handlePurchase = async () => {
        if (!selectedPackage) return;

        await purchasePackage(selectedPackage);

        if (isPro) {
            // @ts-ignore
            ref?.current?.dismiss();
            onClose?.();
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
                    <View className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 items-center justify-center mb-4 bg-[#F59E0B] shadow-lg shadow-orange-500/20">
                        <Crown size={32} color="black" fill="black" />
                    </View>

                    {/* Marketing Tagline with distinct font */}
                    <AppText className="text-xs font-bold mb-2 tracking-[3px] uppercase" style={{ color: '#F59E0B', fontFamily: 'SpaceMono' }}>
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
                            className={`flex-row items-center p-4 rounded-2xl border-2 ${selectedPackage?.packageType === 'ANNUAL' ? 'border-[#F59E0B] bg-[#1a1500]' : 'border-[#28282A]'}`}
                            onPress={() => setSelectedPackage(getPackage('ANNUAL'))}
                        >
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${selectedPackage?.packageType === 'ANNUAL' ? 'border-[#F59E0B]' : 'border-stone-600'}`}>
                                {selectedPackage?.packageType === 'ANNUAL' && <View className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />}
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center">
                                    <AppText className="font-bold text-base mr-2" style={{ color: '#FFFFFF' }}>Yearly Access</AppText>
                                    <View className="bg-[#F59E0B] px-1.5 py-0.5 rounded">
                                        <AppText className="text-[10px] font-bold text-black uppercase" style={{ fontFamily: 'SpaceMono' }}>BEST VALUE</AppText>
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
                            className={`flex-row items-center p-4 rounded-2xl border ${selectedPackage?.packageType === 'MONTHLY' ? 'border-[#F59E0B] bg-[#161618]' : 'border-[#28282A]'}`}
                            onPress={() => setSelectedPackage(getPackage('MONTHLY'))}
                        >
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${selectedPackage?.packageType === 'MONTHLY' ? 'border-[#F59E0B]' : 'border-stone-600'}`}>
                                {selectedPackage?.packageType === 'MONTHLY' && <View className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />}
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
                        <ActivityIndicator color="#F59E0B" />
                        <AppText className="text-stone-500 mt-2">Loading offers...</AppText>
                    </View>
                )}

                {/* CTA */}
                <TouchableOpacity
                    onPress={handlePurchase}
                    disabled={isLoading || !selectedPackage}
                    className="w-full bg-[#F59E0B] py-4 rounded-full items-center justify-center mb-6 shadow-lg shadow-orange-500/40"
                    style={{ shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, opacity: (isLoading || !selectedPackage) ? 0.5 : 1 }}
                >
                    {isLoading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <AppText className="font-bold text-lg text-black uppercase tracking-wide" style={{ fontFamily: 'Inter_700Bold' }}>
                            {selectedPackage?.packageType === 'ANNUAL' ? 'Subscribe Yearly' : 'Subscribe Monthly'}
                        </AppText>
                    )}
                </TouchableOpacity>

                {/* Footer Links */}
                <View className="flex-row justify-center space-x-6 pb-4">
                    <TouchableOpacity onPress={() => restorePurchases()}>
                        <AppText className="text-xs font-medium" style={{ color: '#52525B' }}>Restore</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'This is a placeholder for your Terms of Service URL.')}>
                        <AppText className="text-xs font-medium" style={{ color: '#52525B' }}>Terms of Service</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'This is a placeholder for your Privacy Policy URL.')}>
                        <AppText className="text-xs font-medium" style={{ color: '#52525B' }}>Privacy Policy</AppText>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});
