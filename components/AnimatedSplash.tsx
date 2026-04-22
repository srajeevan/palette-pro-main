import { AppText } from '@/components/AppText';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface AnimatedSplashProps {
    onFinish: () => void;
}

const GOLD = '#C4A44A';
const BLUE = '#3E63DD';
const VOLT = '#A3E635';

const easeOut = Easing.out(Easing.cubic);
const easeOutBack = Easing.out(Easing.back(1.05));
const easeIn = Easing.in(Easing.cubic);

export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
    const [visible, setVisible] = useState(true);

    // P lettermark
    const pOpacity = useSharedValue(0);
    const pScale = useSharedValue(0.7);
    const pTranslateY = useSharedValue(20);

    // Brush stroke accents
    const stroke1ScaleX = useSharedValue(0);
    const stroke2ScaleX = useSharedValue(0);
    const stroke3ScaleX = useSharedValue(0);
    const strokesOpacity = useSharedValue(1);

    // Gold underline
    const underlineScaleX = useSharedValue(0);

    // Wordmark
    const wordmarkOpacity = useSharedValue(0);
    const wordmarkTranslateY = useSharedValue(14);

    // Tagline
    const taglineOpacity = useSharedValue(0);

    // Container exit
    const containerOpacity = useSharedValue(1);
    const containerTranslateY = useSharedValue(0);
    const containerScale = useSharedValue(1);

    useEffect(() => {
        // Step 1: 200-800ms — P lettermark rises into place
        pOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: easeOut }));
        pScale.value = withDelay(200, withTiming(1, { duration: 600, easing: easeOutBack }));
        pTranslateY.value = withDelay(200, withTiming(0, { duration: 600, easing: easeOutBack }));

        // Light haptic when P lands
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 700);

        // Step 2: 700-1100ms — Brush accent lines sweep in
        stroke1ScaleX.value = withDelay(700, withTiming(1, { duration: 400, easing: easeOut }));
        stroke2ScaleX.value = withDelay(800, withTiming(1, { duration: 400, easing: easeOut }));
        stroke3ScaleX.value = withDelay(900, withTiming(1, { duration: 400, easing: easeOut }));

        // Step 3: 1000-1400ms — Gold underline
        underlineScaleX.value = withDelay(1000, withTiming(1, { duration: 400, easing: easeOut }));

        // Step 4: 1200-1650ms — Wordmark
        wordmarkOpacity.value = withDelay(1200, withTiming(1, { duration: 450, easing: easeOut }));
        wordmarkTranslateY.value = withDelay(1200, withTiming(0, { duration: 450, easing: easeOut }));

        // Step 5: 1500-1850ms — Tagline
        taglineOpacity.value = withDelay(1500, withTiming(1, { duration: 350, easing: easeOut }));

        // Hold: 1850-2600ms

        // Step 6: 2600-3300ms — Exit
        strokesOpacity.value = withDelay(2600, withTiming(0, { duration: 300, easing: easeIn }));

        containerOpacity.value = withDelay(2800, withTiming(0, { duration: 500, easing: easeIn }));
        containerTranslateY.value = withDelay(2800, withTiming(-30, { duration: 500, easing: easeIn }));
        containerScale.value = withDelay(2800, withTiming(1.02, { duration: 500, easing: easeIn }, (finished) => {
            if (finished) {
                runOnJS(handleFinish)();
            }
        }));

        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 2800);
    }, []);

    const handleFinish = () => {
        setVisible(false);
        onFinish();
    };

    const pStyle = useAnimatedStyle(() => ({
        opacity: pOpacity.value,
        transform: [
            { translateY: pTranslateY.value },
            { scale: pScale.value },
        ],
    }));

    const stroke1Style = useAnimatedStyle(() => ({
        transform: [{ scaleX: stroke1ScaleX.value }],
        opacity: strokesOpacity.value,
    }));
    const stroke2Style = useAnimatedStyle(() => ({
        transform: [{ scaleX: stroke2ScaleX.value }],
        opacity: strokesOpacity.value,
    }));
    const stroke3Style = useAnimatedStyle(() => ({
        transform: [{ scaleX: stroke3ScaleX.value }],
        opacity: strokesOpacity.value,
    }));

    const underlineStyle = useAnimatedStyle(() => ({
        transform: [{ scaleX: underlineScaleX.value }],
    }));

    const wordmarkStyle = useAnimatedStyle(() => ({
        opacity: wordmarkOpacity.value,
        transform: [{ translateY: wordmarkTranslateY.value }],
    }));

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
        transform: [
            { translateY: containerTranslateY.value },
            { scale: containerScale.value },
        ],
    }));

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {/* P Lettermark */}
            <Animated.View style={pStyle}>
                <Image
                    source={require('@/assets/images/splash-p.jpg')}
                    style={styles.pImage}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Brush Stroke Accent Lines */}
            <View style={styles.strokesContainer}>
                <Animated.View style={[styles.brushStroke, styles.strokeBlue, stroke1Style]} />
                <Animated.View style={[styles.brushStroke, styles.strokeGold, stroke2Style]} />
                <Animated.View style={[styles.brushStroke, styles.strokeVolt, stroke3Style]} />
            </View>

            {/* Gold Underline */}
            <Animated.View style={[styles.goldUnderline, underlineStyle]} />

            {/* Wordmark */}
            <Animated.View style={[styles.wordmarkContainer, wordmarkStyle]}>
                <AppText style={styles.wordmark}>PalettePro</AppText>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={[styles.taglineContainer, taglineStyle]}>
                <AppText style={styles.tagline}>Mix with mastery</AppText>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0A0A0B',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    pImage: {
        width: 140,
        height: 140,
        borderRadius: 32,
    },
    strokesContainer: {
        marginTop: 16,
        alignItems: 'center',
        gap: 6,
    },
    brushStroke: {
        height: 2,
        borderRadius: 1,
    },
    strokeBlue: {
        width: 50,
        backgroundColor: BLUE,
    },
    strokeGold: {
        width: 36,
        backgroundColor: GOLD,
    },
    strokeVolt: {
        width: 28,
        backgroundColor: VOLT,
    },
    goldUnderline: {
        width: 40,
        height: 2,
        backgroundColor: GOLD,
        borderRadius: 1,
        marginTop: 10,
    },
    wordmarkContainer: {
        marginTop: 20,
    },
    wordmark: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 28,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    taglineContainer: {
        marginTop: 8,
    },
    tagline: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: 'rgba(82, 82, 91, 0.6)',
    },
});
