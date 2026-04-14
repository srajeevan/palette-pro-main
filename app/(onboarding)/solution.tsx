import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingStep } from '@/services/analytics';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 9;

interface SolutionItem {
    pain: string;
    solution: string;
}

const SOLUTION_MAP: Record<string, SolutionItem> = {
    waste_paint: {
        pain: 'Wasting paint on wrong mixes',
        solution: 'Get exact pigment ratios before you squeeze a tube',
    },
    mixes_off: {
        pain: 'Mixes that never match',
        solution: 'AI-powered recipes using real oil pigments with 94% accuracy',
    },
    cant_see_values: {
        pain: "Can't read values clearly",
        solution: 'Squint tool reveals light and shadow structure instantly',
    },
    wrong_pigments: {
        pain: 'Not knowing which pigments to use',
        solution: 'Every recipe uses your actual palette — Ultramarine, Burnt Sienna, and more',
    },
    too_long_mixing: {
        pain: 'More time mixing than painting',
        solution: 'Go from reference to palette in under 10 seconds',
    },
    overwhelmed: {
        pain: 'Blank canvas paralysis',
        solution: 'Value maps and composition tools show you exactly where to start',
    },
};

// Fallback solutions if user somehow has no pain points
const DEFAULT_SOLUTIONS: SolutionItem[] = [
    {
        pain: 'Color guessing',
        solution: 'Extract the exact palette from any reference photo',
    },
    {
        pain: 'Mixing uncertainty',
        solution: 'Get precise pigment ratios for every color you see',
    },
    {
        pain: 'Struggling with values',
        solution: 'See light, shadow, and temperature like a trained eye',
    },
];

export default function SolutionScreen() {
    const router = useRouter();
    const painPoints = useOnboardingStore((s) => s.painPoints);

    useEffect(() => { trackOnboardingStep('solution'); }, []);

    const solutions = useMemo(() => {
        if (painPoints.length === 0) return DEFAULT_SOLUTIONS;
        return painPoints
            .map((key) => SOLUTION_MAP[key])
            .filter(Boolean)
            .slice(0, 4);
    }, [painPoints]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={6} total={TOTAL_STEPS} />

            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>YOUR SOLUTION</AppText>
                    <AppText className="text-white" style={styles.title}>
                        Here's how Palette Pro helps you
                    </AppText>
                </Animated.View>

                {/* Solution Items */}
                <View style={{ gap: 16, marginTop: 8 }}>
                    {solutions.map((item, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.duration(400).delay(300 + index * 120)}
                        >
                            <View style={styles.solutionCard}>
                                <View style={styles.painRow}>
                                    <Text style={styles.painText}>{item.pain}</Text>
                                </View>
                                <View style={styles.solutionRow}>
                                    <View style={styles.checkCircle}>
                                        <Check size={14} color="#22C55E" strokeWidth={3} />
                                    </View>
                                    <Text style={styles.solutionText}>{item.solution}</Text>
                                </View>
                            </View>
                        </Animated.View>
                    ))}
                </View>
            </View>

            {/* Continue */}
            <Animated.View entering={FadeInUp.duration(400).delay(700)} style={styles.footer}>
                <Pressable
                    style={styles.continueButton}
                    onPress={() => router.push('/(onboarding)/usecase')}
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
        marginBottom: 16,
    },
    solutionCard: {
        backgroundColor: '#161618',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#28282A',
        padding: 18,
        gap: 12,
    },
    painRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    painText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#71717A',
        textDecorationLine: 'line-through',
        textDecorationColor: '#52525B',
    },
    solutionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0f2a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    solutionText: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#FFFFFF',
        lineHeight: 22,
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
    continueText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: '#FFFFFF',
    },
});
