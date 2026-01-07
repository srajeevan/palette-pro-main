import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface SceneTransitionProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function SceneTransition({ children, style }: SceneTransitionProps) {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isFocused) {
            opacity.value = 0;
            opacity.value = withTiming(1, { duration: 800 });
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        flex: 1,
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
}
