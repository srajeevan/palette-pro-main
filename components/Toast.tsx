import { AppText } from '@/components/AppText';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    cancelAnimation,
    runOnJS,
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

export const Toast = forwardRef<ToastRef>((_, ref) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-100);
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const hide = useCallback(() => {
        cancelAnimation(translateY);
        translateY.value = withTiming(-100, { duration: 200 }, (finished) => {
            if (finished) runOnJS(setVisible)(false);
        });
    }, []);

    const show = useCallback((msg: string, duration: number = 2000) => {
        // Cancel any in-flight animation and timer
        cancelAnimation(translateY);
        if (hideTimer.current) clearTimeout(hideTimer.current);

        setMessage(msg);
        setVisible(true);

        // Animate in
        translateY.value = withSpring(insets.top + 10, { damping: 14, stiffness: 150 });

        // Schedule auto-hide
        hideTimer.current = setTimeout(hide, duration);
    }, [insets.top, hide]);

    useImperativeHandle(ref, () => ({
        show
    }));

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }]
        };
    });

    return (
        <Animated.View
            style={[styles.container, animatedStyle]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            <Pressable onPress={hide}>
                <View style={styles.content}>
                    <AppText style={styles.text}>{message}</AppText>
                </View>
            </Pressable>
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
        pointerEvents: 'box-none',
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
