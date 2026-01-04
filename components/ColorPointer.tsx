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
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
}

const POINTER_SIZE = 80;
const HALF_POINTER = POINTER_SIZE / 2;

export const ColorPointer = ({
    canvasWidth,
    canvasHeight,
    onColorChange,
    onInteractionStart,
    onInteractionEnd,
}: ColorPointerProps) => {
    // Start in the center
    const translateX = useSharedValue(canvasWidth / 2 - HALF_POINTER);
    const translateY = useSharedValue(canvasHeight / 2 - HALF_POINTER);

    // Scale effect for touch feedback
    const scale = useSharedValue(1);

    const context = useSharedValue({ x: 0, y: 0 });

    const pan = Gesture.Pan()
        .onStart(() => {
            if (onInteractionStart) runOnJS(onInteractionStart)();
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
            if (onInteractionEnd) runOnJS(onInteractionEnd)();
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
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
        // Inner Glow / Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: 'rgba(255,255,255,0.05)', // Very subtle fill
        zIndex: 100,
    },
    // Removed Crosshairs
    crosshairVertical: {
        width: 0, height: 0
    },
    crosshairHorizontal: {
        width: 0, height: 0
    },
});
