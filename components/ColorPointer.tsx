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
                {/* Full-Screen Crosshairs (Scope Style) */}
                <View style={[styles.fullCrosshair, styles.verticalLine]} />
                <View style={[styles.fullCrosshair, styles.horizontalLine]} />

                {/* Outer Ring */}
                <View style={styles.ring} />

                {/* Center Dot */}
                <View style={styles.centerDot} />
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    pointer: {
        width: 80,
        height: 80,
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    ring: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#000000',
        backgroundColor: 'rgba(255,255,255,0.0)',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 20,
    },
    fullCrosshair: {
        position: 'absolute',
        backgroundColor: '#000000',
        opacity: 0.8,
        zIndex: 10,
    },
    verticalLine: {
        width: 1.5,
        height: 4000,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
    },
    horizontalLine: {
        height: 1.5,
        width: 4000,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
    },
    centerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FF0000',
        position: 'absolute',
        zIndex: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 1,
    },
    // Legacy removed
});
