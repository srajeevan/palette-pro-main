import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingStep } from '@/services/analytics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 9;

const TESTIMONIALS = [
    {
        quote: "I used to spend 20 minutes mixing one color. Now I nail it on the first try.",
        name: 'Sarah M.',
        persona: 'Oil painter, 3 years',
        stars: 5,
    },
    {
        quote: "The squint tool changed how I see my references. I finally understand values.",
        name: 'James K.',
        persona: 'Landscape artist',
        stars: 5,
    },
    {
        quote: "Worth every penny. My palette accuracy went from guessing to precise.",
        name: 'Emily R.',
        persona: 'Portrait painter',
        stars: 5,
    },
];

export default function SocialProofScreen() {
    const router = useRouter();

    useEffect(() => { trackOnboardingStep('socialproof'); }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={5} total={TOTAL_STEPS} />

            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>LOVED BY ARTISTS</AppText>
                    <AppText className="text-white" style={styles.title}>
                        Trusted by 500+ painters worldwide
                    </AppText>
                    <Text style={styles.stars}>
                        {'\u2B50\u2B50\u2B50\u2B50\u2B50'}
                    </Text>
                    <Text style={styles.ratingText}>4.9 average rating</Text>
                </Animated.View>

                {/* Testimonials */}
                <View style={{ gap: 14 }}>
                    {TESTIMONIALS.map((t, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.duration(400).delay(300 + index * 120)}
                        >
                            <View style={styles.testimonialCard}>
                                <Text style={styles.quote}>"{t.quote}"</Text>
                                <View style={styles.authorRow}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {t.name.charAt(0)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.authorName}>{t.name}</Text>
                                        <Text style={styles.authorPersona}>{t.persona}</Text>
                                    </View>
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
                    onPress={() => router.push('/(onboarding)/solution')}
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
    header: {
        alignItems: 'center',
        marginBottom: 32,
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
        fontSize: 26,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 16,
    },
    stars: {
        fontSize: 22,
        letterSpacing: 4,
        marginBottom: 6,
    },
    ratingText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#71717A',
    },
    testimonialCard: {
        backgroundColor: '#161618',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#28282A',
        padding: 20,
        gap: 14,
    },
    quote: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#E4E4E7',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1a1b26',
        borderWidth: 1,
        borderColor: '#3E63DD',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#3E63DD',
    },
    authorName: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#FFFFFF',
    },
    authorPersona: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#71717A',
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
