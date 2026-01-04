import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ColorTooltipProps {
    hex: string;
    rgb: string;
    color: string;
    onPress: () => void;
}

export const ColorTooltip: React.FC<ColorTooltipProps> = ({
    hex,
    rgb,
    color,
    onPress,
}) => {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.containerShadow}
        >
            <View style={styles.bubbleContainer}>
                {/* Color Swatch */}
                <View style={[styles.swatch, { backgroundColor: color }]} />

                {/* Text Info */}
                <View style={styles.textContainer}>
                    <Text style={styles.hexText}>{hex}</Text>
                    <Text style={styles.rgbText}>{rgb}</Text>
                </View>
            </View>

            {/* Arrow / Tail */}
            <View style={styles.arrowContainer}>
                <View style={styles.arrow} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    containerShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        alignItems: 'center',
    },
    bubbleContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
    },
    swatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb', // gray-200
    },
    textContainer: {
        flexDirection: 'column',
    },
    hexText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937', // gray-800
    },
    rgbText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6b7280', // gray-500
    },
    arrowContainer: {
        marginTop: -1, // Overlap slightly to merge
        zIndex: 0,
        alignItems: 'center',
    },
    arrow: {
        width: 14,
        height: 14,
        backgroundColor: 'white',
        transform: [{ rotate: '45deg' }],
        marginTop: -8, // Pull up into the bubble
        // We don't apply shadow to the arrow directly to avoid double shadow artifact
        // The container shadow handles general elevation, but arrow shadow might be tricky
        // For now, this visual is clean.
    },
});
