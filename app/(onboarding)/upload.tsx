import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingStep } from '@/services/analytics';
import { useImagePicker } from '@/services/useImagePicker';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useRouter } from 'expo-router';
import { Camera, ImagePlus } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UploadScreen() {
    const router = useRouter();
    const { pickImage, takePhoto } = useImagePicker();
    const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
    const imageUri = useProjectStore((s) => s.imageUri);
    const hasNavigated = useRef(false);

    useEffect(() => { trackOnboardingStep('upload'); }, []);

    // Pulsing border animation
    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false,
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        borderColor: `rgba(62, 99, 221, ${0.3 + pulse.value * 0.5})`,
        shadowOpacity: 0.1 + pulse.value * 0.2,
    }));

    // Navigate to paywall when image is picked
    useEffect(() => {
        if (imageUri && !hasNavigated.current) {
            hasNavigated.current = true;
            router.push('/(onboarding)/paywall');
        }
    }, [imageUri]);

    const handlePickImage = async () => {
        await pickImage();
    };

    const handleTakePhoto = async () => {
        await takePhoto();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={8} total={9} />

            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <AppText className="text-[#3E63DD]" style={styles.tagline}>LET'S BEGIN</AppText>
                    <AppText className="text-white" style={styles.title}>
                        Upload your reference photo
                    </AppText>
                    <AppText className="text-[#71717A]" style={styles.subtitle}>
                        See the magic happen — your palette is seconds away
                    </AppText>
                </Animated.View>

                {/* Upload Area */}
                <Animated.View entering={FadeInDown.duration(500).delay(300)}>
                    <Pressable onPress={handlePickImage}>
                        <Animated.View style={[styles.uploadArea, pulseStyle]}>
                            <View style={styles.uploadIconContainer}>
                                <ImagePlus size={48} color="#3E63DD" strokeWidth={1.2} />
                            </View>
                            <AppText className="text-white" style={styles.uploadTitle}>
                                Choose from Library
                            </AppText>
                            <AppText className="text-[#71717A]" style={styles.uploadHint}>
                                Pick any painting reference, photo, or artwork
                            </AppText>
                        </Animated.View>
                    </Pressable>
                </Animated.View>

                {/* Camera Option */}
                <Animated.View entering={FadeInDown.duration(400).delay(500)}>
                    <Pressable
                        style={styles.cameraButton}
                        onPress={handleTakePhoto}
                    >
                        <Camera size={20} color="#A1A1AA" strokeWidth={1.8} />
                        <AppText className="text-[#A1A1AA]" style={styles.cameraText}>Or take a photo</AppText>
                    </Pressable>
                </Animated.View>
            </View>

            {/* Bottom motivation text */}
            <Animated.View entering={FadeInUp.duration(400).delay(700)} style={styles.footer}>
                <AppText className="text-[#52525B]" style={styles.footerText}>
                    Your image stays on your device until you choose to save
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
        paddingHorizontal: 24,
        justifyContent: 'center',
        gap: 20,
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
        marginBottom: 24,
    },
    uploadArea: {
        backgroundColor: '#161618',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#3E63DD50',
        borderStyle: 'dashed',
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 16,
        shadowColor: '#3E63DD',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 20,
        elevation: 8,
    },
    uploadIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#1a1b26',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    uploadTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    uploadHint: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#71717A',
        textAlign: 'center',
    },
    cameraButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#28282A',
        backgroundColor: '#161618',
    },
    cameraText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#A1A1AA',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#52525B',
        textAlign: 'center',
    },
});
