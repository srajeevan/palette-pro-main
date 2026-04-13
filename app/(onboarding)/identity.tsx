import { AppText } from '@/components/AppText';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'expo-router';
import { Compass, Palette, Sparkles, ScanEye } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const OPTIONS = [
    {
        key: 'colors',
        label: 'Matching the right colors',
        subtitle: 'Getting the mix just right feels impossible',
        icon: Palette,
    },
    {
        key: 'values',
        label: 'Seeing values and shapes',
        subtitle: 'Hard to separate light from shadow',
        icon: ScanEye,
    },
    {
        key: 'starting',
        label: 'Knowing where to start',
        subtitle: 'The blank canvas overwhelms me',
        icon: Compass,
    },
    {
        key: 'all',
        label: 'All of the above',
        subtitle: 'I need help with everything',
        icon: Sparkles,
    },
];

export default function IdentityScreen() {
    const router = useRouter();
    const setIdentityAnswer = useOnboardingStore((s) => s.setIdentityAnswer);
    const handleSelect = (key: string) => {
        setIdentityAnswer(key);
        router.push('/(onboarding)/showcase');
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'bottom']}>
            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <AppText className="text-[#3E63DD]" style={{ fontFamily: 'SpaceMono', fontSize: 12, letterSpacing: 2, marginBottom: 16 }}>
                        BEFORE WE START
                    </AppText>
                    <AppText className="text-white" style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, lineHeight: 38, marginBottom: 8 }}>
                        What's hardest when you paint from a reference?
                    </AppText>
                    <AppText className="text-[#71717A]" style={{ fontFamily: 'Inter_400Regular', fontSize: 15, marginBottom: 40 }}>
                        This helps us personalize your experience
                    </AppText>
                </Animated.View>

                {/* Options */}
                <View style={{ gap: 12 }}>
                    {OPTIONS.map((option, index) => {
                        const Icon = option.icon;
                        return (
                            <Animated.View
                                key={option.key}
                                entering={FadeInDown.duration(400).delay(300 + index * 100)}
                            >
                                <Pressable
                                    style={styles.optionCard}
                                    onPress={() => handleSelect(option.key)}
                                >
                                    <View style={styles.iconContainer}>
                                        <Icon size={22} color="#3E63DD" strokeWidth={1.8} />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.optionLabel}>
                                            {option.label}
                                        </Text>
                                        <Text style={styles.optionSubtitle}>
                                            {option.subtitle}
                                        </Text>
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
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
