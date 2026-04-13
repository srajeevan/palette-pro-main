import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackGoalSelected, trackOnboardingStep } from '@/services/analytics';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'expo-router';
import { Eye, FlaskConical, Palette, Sparkles, Sun } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 9;

const GOALS = [
    {
        key: 'match_colors',
        label: 'Match colors on the first try',
        subtitle: 'No more guessing at the palette',
        icon: Palette,
    },
    {
        key: 'understand_values',
        label: 'Understand values and light',
        subtitle: 'See what makes a painting work',
        icon: Sun,
    },
    {
        key: 'know_pigments',
        label: 'Know exactly which pigments to mix',
        subtitle: 'Precise recipes, zero waste',
        icon: FlaskConical,
    },
    {
        key: 'see_like_master',
        label: 'See composition like a trained eye',
        subtitle: 'Shapes, temperature, and structure',
        icon: Eye,
    },
    {
        key: 'all',
        label: 'All of the above',
        subtitle: 'I want the full toolkit',
        icon: Sparkles,
    },
];

export default function GoalsScreen() {
    const router = useRouter();
    const setIdentityAnswer = useOnboardingStore((s) => s.setIdentityAnswer);

    useEffect(() => { trackOnboardingStep('goals'); }, []);

    const handleSelect = (key: string) => {
        setIdentityAnswer(key);
        trackGoalSelected(key);
        router.push('/(onboarding)/painpoints');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={2} total={TOTAL_STEPS} />

            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>TELL US ABOUT YOU</AppText>
                    <AppText className="text-white" style={styles.title}>
                        What would change your painting the most?
                    </AppText>
                    <AppText className="text-[#71717A]" style={styles.subtitle}>
                        This helps us personalize your experience
                    </AppText>
                </Animated.View>

                {/* Options */}
                <View style={{ gap: 12 }}>
                    {GOALS.map((goal, index) => {
                        const Icon = goal.icon;
                        return (
                            <Animated.View
                                key={goal.key}
                                entering={FadeInDown.duration(400).delay(300 + index * 80)}
                            >
                                <Pressable
                                    style={styles.optionCard}
                                    onPress={() => handleSelect(goal.key)}
                                >
                                    <View style={styles.iconContainer}>
                                        <Icon size={22} color="#3E63DD" strokeWidth={1.8} />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.optionLabel}>{goal.label}</Text>
                                        <Text style={styles.optionSubtitle}>{goal.subtitle}</Text>
                                    </View>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>
            </View>
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
        marginBottom: 36,
    },
    optionCard: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: '#161618',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#28282A',
        padding: 18,
        gap: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#1a1b26',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#71717A',
    },
});
