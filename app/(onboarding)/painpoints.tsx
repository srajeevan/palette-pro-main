import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingStep, trackPainPointsSelected } from '@/services/analytics';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 9;

const PAIN_POINTS = [
    {
        key: 'waste_paint',
        emoji: '\uD83C\uDFA8',
        label: 'I waste paint trying to match colors',
    },
    {
        key: 'mixes_off',
        emoji: '\uD83D\uDE16',
        label: "My mixes never look like the reference",
    },
    {
        key: 'cant_see_values',
        emoji: '\uD83D\uDC41\uFE0F',
        label: "I can't see the values clearly",
    },
    {
        key: 'wrong_pigments',
        emoji: '\uD83E\uDDEA',
        label: "I don't know which pigments to use",
    },
    {
        key: 'too_long_mixing',
        emoji: '\u23F3',
        label: 'I spend more time mixing than painting',
    },
    {
        key: 'overwhelmed',
        emoji: '\uD83D\uDE35\u200D\uD83D\uDCAB',
        label: "The blank canvas overwhelms me",
    },
];

export default function PainPointsScreen() {
    const router = useRouter();
    const setPainPoints = useOnboardingStore((s) => s.setPainPoints);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => { trackOnboardingStep('painpoints'); }, []);

    const toggleSelection = (key: string) => {
        setSelected((prev) =>
            prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key]
        );
    };

    const handleContinue = () => {
        setPainPoints(selected);
        trackPainPointsSelected(selected);
        router.push('/(onboarding)/showcase');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={3} total={TOTAL_STEPS} />

            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>WE GET IT</AppText>
                    <AppText className="text-white" style={styles.title}>
                        What slows you down right now?
                    </AppText>
                    <AppText className="text-[#71717A]" style={styles.subtitle}>
                        Select all that apply
                    </AppText>
                </Animated.View>

                {/* Pain Points */}
                <View style={{ gap: 10 }}>
                    {PAIN_POINTS.map((item, index) => {
                        const isSelected = selected.includes(item.key);
                        return (
                            <Animated.View
                                key={item.key}
                                entering={FadeInDown.duration(400).delay(250 + index * 70)}
                            >
                                <Pressable
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionCardSelected,
                                    ]}
                                    onPress={() => toggleSelection(item.key)}
                                >
                                    <Text style={styles.emoji}>{item.emoji}</Text>
                                    <Text style={[
                                        styles.optionLabel,
                                        isSelected && styles.optionLabelSelected,
                                    ]}>
                                        {item.label}
                                    </Text>
                                    <View style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected,
                                    ]}>
                                        {isSelected && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                                    </View>
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
        lineHeight: 38,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#71717A',
        marginBottom: 32,
    },
    optionCard: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: '#161618',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#28282A',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 14,
    },
    optionCardSelected: {
        borderColor: '#3E63DD',
        backgroundColor: '#1a1b26',
    },
    emoji: {
        fontSize: 20,
    },
    optionLabel: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#A1A1AA',
    },
    optionLabelSelected: {
        color: '#FFFFFF',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#3F3F46',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    checkboxSelected: {
        backgroundColor: '#3E63DD',
        borderColor: '#3E63DD',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
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
