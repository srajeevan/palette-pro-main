import { AppText } from '@/components/AppText';
import { usePro } from '@/context/ProContext';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Crown } from 'lucide-react-native';
import React, { forwardRef, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PaywallModalProps {
    onClose?: () => void;
}

export const PaywallModal = forwardRef<BottomSheetModal, PaywallModalProps>(({ onClose }, ref) => {
    const snapPoints = useMemo(() => ['85%'], []);
    const { unlockPro, isLoading, isPro } = usePro();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

    const handlePurchase = async () => {
        await unlockPro();
        // If successful, close modal
        if (// @ts-ignore - checking internal ref method if needed or just relying on parent
            true
        ) {
            // @ts-ignore
            ref?.current?.dismiss();
        }
    };

    // Features List
    const features = [
        { icon: '🎨', title: 'Unlock Mixing Recipes', desc: 'Get precise paint ratios for any color.' },
        { icon: '👁️', title: 'Squint & Value Maps', desc: 'Master composition with tonal analysis tools.' },
        { icon: '💾', title: 'Save Unlimited Palettes', desc: 'Build your personal color library.' },
        { icon: '☁️', title: 'Cloud Sync', desc: 'Access your studio from any device.' },
    ];

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: '#0A0A0B' }}
            handleIndicatorStyle={{ backgroundColor: '#28282A' }}
            enablePanDownToClose
        >
            <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 12 }}>
                {/* Header */}
                <View className="items-center mb-8">
                    <View className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 items-center justify-center mb-4 bg-[#F59E0B]">
                        <Crown size={32} color="black" fill="black" />
                    </View>
                    <AppText className="text-2xl font-bold text-white text-center mb-2">Unlock Palette Pro</AppText>
                    <AppText className="text-stone-400 text-center text-base">Your digital companion for physical painting.</AppText>
                </View>

                {/* Features */}
                <View className="mb-8 space-y-5">
                    {features.map((feature, index) => (
                        <View key={index} className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-[#1C1C1E] items-center justify-center mr-4">
                                <AppText className="text-lg">{feature.icon}</AppText>
                            </View>
                            <View>
                                <AppText className="text-white font-bold text-base">{feature.title}</AppText>
                                <AppText className="text-stone-500 text-sm">{feature.desc}</AppText>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Pricing Options */}
                <View className="mb-6 space-y-3">
                    {/* Yearly Option */}
                    <TouchableOpacity
                        className={`flex-row items-center p-4 rounded-xl border ${selectedPlan === 'yearly' ? 'border-[#F59E0B] bg-[#161618]' : 'border-[#28282A]'}`}
                        onPress={() => setSelectedPlan('yearly')}
                    >
                        <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${selectedPlan === 'yearly' ? 'border-[#F59E0B]' : 'border-stone-600'}`}>
                            {selectedPlan === 'yearly' && <View className="w-3 h-3 rounded-full bg-[#F59E0B]" />}
                        </View>
                        <View className="flex-1">
                            <AppText className={`font-bold text-base ${selectedPlan === 'yearly' ? 'text-white' : 'text-stone-400'}`}>Yearly (Best Value)</AppText>
                            <AppText className="text-stone-500 text-xs">Billed annually at $39.99</AppText>
                        </View>
                        <View className="items-end">
                            <AppText className="text-white font-bold text-lg">$3.33/mo</AppText>
                            <View className="bg-[#F59E0B] px-2 py-0.5 rounded">
                                <AppText className="text-black text-[10px] font-bold">SAVE 33%</AppText>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Monthly Option */}
                    <TouchableOpacity
                        className={`flex-row items-center p-4 rounded-xl border ${selectedPlan === 'monthly' ? 'border-[#F59E0B] bg-[#161618]' : 'border-[#28282A]'}`}
                        onPress={() => setSelectedPlan('monthly')}
                    >
                        <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${selectedPlan === 'monthly' ? 'border-[#F59E0B]' : 'border-stone-600'}`}>
                            {selectedPlan === 'monthly' && <View className="w-3 h-3 rounded-full bg-[#F59E0B]" />}
                        </View>
                        <View className="flex-1">
                            <AppText className={`font-bold text-base ${selectedPlan === 'monthly' ? 'text-white' : 'text-stone-400'}`}>Monthly</AppText>
                            <AppText className="text-stone-500 text-xs">Billed monthly</AppText>
                        </View>
                        <View className="items-end">
                            <AppText className="text-white font-bold text-lg">$4.99/mo</AppText>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* CTA */}
                <TouchableOpacity
                    onPress={handlePurchase}
                    disabled={isLoading}
                    className="w-full bg-[#F59E0B] py-4 rounded-full items-center justify-center mb-4"
                >
                    {isLoading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <AppText className="text-black font-bold text-lg">
                            {selectedPlan === 'yearly' ? 'Start Free Trial' : 'Subscribe Now'}
                        </AppText>
                    )}
                </TouchableOpacity>

                {/* Footer Links */}
                <View className="flex-row justify-center space-x-6">
                    <TouchableOpacity onPress={() => {/* Restore */ }}>
                        <AppText className="text-stone-500 text-xs">Restore Purchases</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {/* Terms */ }}>
                        <AppText className="text-stone-500 text-xs">Terms & Privacy</AppText>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});
