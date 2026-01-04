import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface ColorPointerProps {
    canvasWidth: number;
    canvasHeight: number;
    onColorChange?: (x: number, y: number) => void;
    // We keep these props optional to avoid breaking the interface, but we don't display them in the reticle itself
    color?: string;
    hex?: string;
    rgb?: string;
    onPress?: () => void;
}

const POINTER_SIZE = 60;
const HALF_POINTER = POINTER_SIZE / 2;

export const ColorPointer = ({
    canvasWidth,
    canvasHeight,
    onColorChange,
}: ColorPointerProps) => {
    // Start in the center
    const translateX = useSharedValue(canvasWidth / 2 - HALF_POINTER);
    const translateY = useSharedValue(canvasHeight / 2 - HALF_POINTER);

    // Scale effect for touch feedback
    const scale = useSharedValue(1);

    const context = useSharedValue({ x: 0, y: 0 });

    const pan = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
            scale.value = withSpring(1.2);
        })
        .onUpdate((event) => {
            let newX = context.value.x + event.translationX;
            let newY = context.value.y + event.translationY;

            // Clamp correctly
            const minX = -HALF_POINTER;
            const maxX = canvasWidth - HALF_POINTER;
            const minY = -HALF_POINTER;
            const maxY = canvasHeight - HALF_POINTER;

            if (newX < minX) newX = minX;
            if (newX > maxX) newX = maxX;
            if (newY < minY) newY = minY;
            if (newY > maxY) newY = maxY;

            translateX.value = newX;
            translateY.value = newY;

            // Calculate center coordinates
            const centerX = newX + HALF_POINTER;
            const centerY = newY + HALF_POINTER;

            if (onColorChange) {
                runOnJS(onColorChange)(centerX, centerY);
            }
        })
        .onEnd(() => {
            scale.value = withSpring(1);
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.pointer, animatedStyle]}>
                <View style={styles.crosshairVertical} />
                <View style={styles.crosshairHorizontal} />
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    pointer: {
        width: POINTER_SIZE,
        height: POINTER_SIZE,
        borderRadius: POINTER_SIZE / 2,
        borderWidth: 2,
        borderColor: 'white',
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        backgroundColor: 'rgba(255,255,255,0.2)', // Transparent fill
        zIndex: 100,
    },
    crosshairVertical: {
        width: 1,
        height: 14,
        backgroundColor: '#ef4444', // Red
        position: 'absolute',
    },
    crosshairHorizontal: {
        width: 14,
        height: 1,
        backgroundColor: '#ef4444', // Red
        position: 'absolute',
    },
});
