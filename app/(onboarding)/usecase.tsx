import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingStep, trackUseCaseSelected } from '@/services/analytics';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'expo-router';
import { Flower2, Mountain, Shapes, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const USE_CASES = [
    { key: 'portraits', label: 'Portraits', icon: User },
    { key: 'landscapes', label: 'Landscapes', icon: Mountain },
    { key: 'still_life', label: 'Still Life', icon: Flower2 },
    { key: 'abstract', label: 'Abstract', icon: Shapes },
];

export default function UseCaseScreen() {
    const router = useRouter();
    const setSelectedUseCase = useOnboardingStore((s) => s.setSelectedUseCase);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => { trackOnboardingStep('usecase'); }, []);

    const handleSelect = (key: string) => {
        setSelected((prev) => {
            if (prev.includes(key)) {
                return prev.filter((k) => k !== key);
            }
            if (prev.length >= 2) {
                // Replace oldest selection
                return [prev[1], key];
            }
            return [...prev, key];
        });
    };

    const handleContinue = () => {
        if (selected.length > 0) {
            setSelectedUseCase(selected.join(','));
            trackUseCaseSelected(selected);
            router.push('/(onboarding)/upload');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={7} total={9} />

            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>PERSONALIZE</AppText>
                    <AppText className="text-white" style={styles.title}>What do you paint most?</AppText>
                    <AppText className="text-[#71717A]" style={styles.subtitle}>
                        Pick up to 2 — we'll tailor your experience
                    </AppText>
                </Animated.View>

                {/* Grid */}
                <View style={styles.grid}>
                    {USE_CASES.map((item, index) => {
                        const Icon = item.icon;
                        const isSelected = selected.includes(item.key);
                        return (
                            <Animated.View
                                key={item.key}
                                entering={FadeInDown.duration(400).delay(300 + index * 80)}
                                style={styles.gridItem}
                            >
                                <Pressable
                                    style={[
                                        styles.card,
                                        isSelected && styles.cardSelected,
                                    ]}
                                    onPress={() => handleSelect(item.key)}
                                >
                                    <View style={[
                                        styles.iconContainer,
                                        isSelected && styles.iconContainerSelected,
                                    ]}>
                                        <Icon
                                            size={32}
                                            color={isSelected ? '#3E63DD' : '#71717A'}
                                            strokeWidth={1.5}
                                        />
                                    </View>
                                    <AppText className={isSelected ? "text-white" : "text-[#A1A1AA]"} style={[
                                        styles.cardLabel,
                                        isSelected && styles.cardLabelSelected,
                                    ]}>
                                        {item.label}
                                    </AppText>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>
            </View>

            {/* Continue Button */}
            <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.footer}>
                <Pressable
                    style={[
                        styles.continueButton,
                        selected.length === 0 && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={selected.length === 0}
                >
                    <AppText className="text-white" style={styles.continueText}>Continue</AppText>
                </Pressable>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0B',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    tagline: {
        fontFamily: 'SpaceMono',
        fontSize: 12,
        color: '#3E63DD',
        letterSpacing: 2,
        marginBottom: 16,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#71717A',
        marginBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: '48%',
    },
    card: {
        backgroundColor: '#161618',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#28282A',
        padding: 24,
        alignItems: 'center',
        gap: 14,
    },
    cardSelected: {
        borderColor: '#3E63DD',
        backgroundColor: '#1a1b26',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerSelected: {
        backgroundColor: '#1e2545',
    },
    cardLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#A1A1AA',
    },
    cardLabelSelected: {
        color: '#FFFFFF',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    continueButton: {
        backgroundColor: '#3E63DD',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    continueButtonDisabled: {
        opacity: 0.4,
    },
    continueText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: '#FFFFFF',
    },
});
