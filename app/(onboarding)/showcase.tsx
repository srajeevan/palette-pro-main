import { AppText } from '@/components/AppText';
import { OnboardingProgress } from '@/components/OnboardingProgress';
import { trackOnboardingStep } from '@/services/analytics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    View,
    ViewToken,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES = [
    {
        key: 'picker',
        title: 'Pick Any Color from Your Reference',
        subtitle: 'Tap anywhere on your photo to sample the exact color — compare it to your paint mix in real time.',
        image: require('@/assets/images/onboarding/color-picker.png'),
    },
    {
        key: 'palette',
        title: 'Extract a Full Color Palette',
        subtitle: 'Generate 4, 6, 8, or 12 dominant colors from any reference photo — instantly.',
        image: require('@/assets/images/onboarding/palette-gen.png'),
    },
    {
        key: 'recipe',
        title: 'Get Exact Paint Mixing Recipes',
        subtitle: 'Tap any color to see which oil pigments to mix, with ratios and accuracy score.',
        image: require('@/assets/images/onboarding/mixing-recipe.png'),
    },
    {
        key: 'squint',
        title: 'See the Shapes, Light & Shadow',
        subtitle: 'The Squint tool blurs your reference so you can block in big shapes without getting lost in details.',
        image: require('@/assets/images/onboarding/squint-tool.png'),
    },
    {
        key: 'valuemap',
        title: 'Understand Warm, Cool & Tonal Zones',
        subtitle: 'The Value Map reveals the temperature structure — see what the masters see.',
        image: require('@/assets/images/onboarding/value-map.png'),
    },
];

export default function ShowcaseScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [hasSeenEnough, setHasSeenEnough] = useState(false);
    const autoAdvanceTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { trackOnboardingStep('showcase'); }, []);

    // Auto-advance every 3.5s
    useEffect(() => {
        let currentIdx = 0;
        autoAdvanceTimer.current = setInterval(() => {
            currentIdx += 1;
            if (currentIdx < FEATURES.length) {
                setActiveIndex(currentIdx);
                flatListRef.current?.scrollToIndex({ index: currentIdx, animated: true });
            } else {
                if (autoAdvanceTimer.current) clearInterval(autoAdvanceTimer.current);
            }
        }, 3500);

        return () => {
            if (autoAdvanceTimer.current) clearInterval(autoAdvanceTimer.current);
        };
    }, []);

    // Enable button after viewing 2+ cards or 6s
    useEffect(() => {
        const timer = setTimeout(() => setHasSeenEnough(true), 6000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (activeIndex >= 1) setHasSeenEnough(true);
    }, [activeIndex]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const idx = viewableItems[0].index;
            if (idx != null) {
                setActiveIndex(idx);
                if (autoAdvanceTimer.current) {
                    clearInterval(autoAdvanceTimer.current);
                    autoAdvanceTimer.current = null;
                }
            }
        }
    }, []);

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleContinue = () => {
        router.push('/(onboarding)/socialproof');
    };

    const renderItem = ({ item }: { item: typeof FEATURES[0] }) => (
        <View style={styles.cardContainer}>
            <View style={styles.card}>
                <View style={styles.imageWrapper}>
                    <Image
                        source={item.image}
                        style={styles.cardImage}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.cardContent}>
                    <AppText className="text-white" style={styles.cardTitle}>{item.title}</AppText>
                    <AppText className="text-[#A1A1AA]" style={styles.cardSubtitle}>{item.subtitle}</AppText>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <OnboardingProgress current={4} total={9} />

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
                <AppText className="text-[#3E63DD]" style={styles.tagline}>YOUR COMPLETE PAINTING TOOLKIT</AppText>
                <AppText className="text-white" style={styles.title}>
                    Everything you need, in one app
                </AppText>
            </Animated.View>

            {/* Carousel */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.carouselContainer}>
                <FlatList
                    ref={flatListRef}
                    data={FEATURES}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.key}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={SCREEN_WIDTH}
                    decelerationRate="fast"
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                />

                {/* Dot Indicators */}
                <View style={styles.dotsContainer}>
                    {FEATURES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === activeIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>
            </Animated.View>

            {/* Continue Button */}
            <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.footer}>
                <Pressable
                    style={[
                        styles.continueButton,
                        !hasSeenEnough && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!hasSeenEnough}
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
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    tagline: {
        fontFamily: 'SpaceMono',
        fontSize: 11,
        color: '#3E63DD',
        letterSpacing: 2,
        marginBottom: 12,
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 26,
        color: '#FFFFFF',
        lineHeight: 34,
    },
    carouselContainer: {
        flex: 1,
    },
    cardContainer: {
        width: SCREEN_WIDTH,
        paddingHorizontal: 24,
    },
    card: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#161618',
        borderWidth: 1,
        borderColor: '#28282A',
    },
    imageWrapper: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#0A0A0B',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        padding: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    cardTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 24,
    },
    cardSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A1A1AA',
        lineHeight: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3F3F46',
    },
    dotActive: {
        backgroundColor: '#3E63DD',
        width: 24,
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
