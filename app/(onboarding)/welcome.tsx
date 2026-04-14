import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingStep } from '@/services/analytics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_STEPS = 9;

export default function WelcomeScreen() {
    const router = useRouter();

    useEffect(() => { trackOnboardingStep('welcome'); }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={1} total={TOTAL_STEPS} />

            <View style={styles.content}>
                {/* Hero Image */}
                <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.imageContainer}>
                    <Image
                        source={require('@/assets/images/onboarding/welcome-hero.jpg')}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                    <View style={styles.imageOverlay} />
                </Animated.View>

                {/* Text Content */}
                <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.textContent}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>PALETTE PRO</AppText>
                    <AppText className="text-white" style={styles.title}>
                        Paint with confidence
                    </AppText>
                    <AppText className="text-[#A1A1AA]" style={styles.subtitle}>
                        Match any color. Mix any shade.{'\n'}See your reference like a master.
                    </AppText>
                </Animated.View>
            </View>

            {/* CTA */}
            <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.footer}>
                <Pressable
                    style={styles.ctaButton}
                    onPress={() => router.push('/(onboarding)/goals')}
                >
                    <AppText className="text-white" style={styles.ctaText}>Get Started</AppText>
                </Pressable>
                <AppText className="text-[#52525B]" style={styles.loginText}>
                    Already have an account? Log in
                </AppText>
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
        justifyContent: 'center',
    },
    imageContainer: {
        height: 320,
        marginHorizontal: 24,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 32,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 10, 11, 0.15)',
    },
    textContent: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    tagline: {
        fontFamily: 'SpaceMono',
        fontSize: 12,
        color: '#3E63DD',
        letterSpacing: 3,
        marginBottom: 14,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 32,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 42,
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#A1A1AA',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        alignItems: 'center',
        gap: 16,
    },
    ctaButton: {
        width: '100%',
        backgroundColor: '#3E63DD',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    ctaText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: '#FFFFFF',
    },
    loginText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: '#52525B',
    },
});
