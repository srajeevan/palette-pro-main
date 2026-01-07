import { AppText } from '@/components/AppText';
import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ToastRef {
    show: (message: string, duration?: number) => void;
}

export const Toast = forwardRef<ToastRef>((props, ref) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-100);
    const [message, setMessage] = useState('');

    const show = useCallback((msg: string, duration: number = 2000) => {
        setMessage(msg);
        translateY.value = withSequence(
            withSpring(insets.top + 10, { damping: 12 }),
            withDelay(duration, withTiming(-100, { duration: 300 }))
        );
    }, [insets.top]);

    useImperativeHandle(ref, () => ({
        show
    }));

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }]
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.content}>
                <AppText style={styles.text}>{message}</AppText>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        // Ensure it doesn't block touches when hidden (though translateY moves it offscreen)
    },
    content: {
        backgroundColor: '#161618',
        borderColor: '#3E63DD',
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    text: {
        color: 'white',
        fontFamily: 'SpaceMono',
        fontSize: 12,
        textAlign: 'center',
    }
});
