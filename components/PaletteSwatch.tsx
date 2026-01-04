import { getContrastColor } from '@/utils/colorUtils';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

interface PaletteSwatchProps {
    color: string;
    onPress?: (color: string) => void;
    onLongPress?: (color: string) => void;
    index: number;
}

export const PaletteSwatch = ({ color, onPress, onLongPress, index }: PaletteSwatchProps) => {
    // console.log(`Rendering swatch ${index} with color ${color}`);
    const textColor = getContrastColor(color);

    // Animation Values
    const scale = useSharedValue(1);
    const tooltipOpacity = useSharedValue(0);
    const tooltipTranslateY = useSharedValue(10);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const tooltipStyle = useAnimatedStyle(() => ({
        opacity: tooltipOpacity.value,
        transform: [{ translateY: tooltipTranslateY.value }]
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        // Trigger Tooltip Animation
        tooltipOpacity.value = withTiming(1, { duration: 200 });
        tooltipTranslateY.value = withSpring(-10); // Move up slightly

        // Reset after delay
        tooltipOpacity.value = withDelay(1000, withTiming(0, { duration: 200 }));
        tooltipTranslateY.value = withDelay(1000, withTiming(10)); // Reset pos

        onPress?.(color);
    };

    return (
        <View style={{ alignItems: 'center' }}>
            {/* Tooltip */}
            <Animated.View style={[styles.tooltip, tooltipStyle]}>
                <Text style={styles.tooltipText}>Copied!</Text>
            </Animated.View>

            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                onLongPress={() => onLongPress?.(color)}
            >
                <Animated.View
                    style={[
                        styles.swatch,
                        { backgroundColor: color },
                        animatedStyle
                    ]}
                >
                    <View style={styles.content}>
                        <Text style={[styles.hexText, { color: textColor }]}>
                            {color.toUpperCase()}
                        </Text>
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    swatch: {
        width: 80,
        height: 80,
        margin: 8,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 3,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    hexText: {
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    tooltip: {
        position: 'absolute',
        top: -20, // Position above the swatch
        zIndex: 10,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 5,
    },
    tooltipText: {
        color: 'white',
        fontSize: 10,
        fontFamily: 'Inter_700Bold', // Using the bold font we loaded
        textAlign: 'center',
    }
});
