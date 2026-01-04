import { getContrastColor } from '@/utils/colorUtils';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ColorComparisonBarProps {
    color: string;
    rgb: string;
    onPress: () => void;
}

export const ColorComparisonBar: React.FC<ColorComparisonBarProps> = ({
    color,
    rgb,
    onPress,
}) => {
    // Determine text color based on brightness roughly, or just use white/black pill
    // For simplicity and style, a semi-transparent pill is nice.
    // Or just white text with shadow if dark, black if light. 
    // Let's use a pill for guaranteed legibility.

    const textColor = getContrastColor(color);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.container, { backgroundColor: color }]}
        >
            <View style={[styles.textPill, { borderColor: textColor + '40' }]}>
                <Text
                    style={{
                        fontFamily: 'monospace', // Using system monospace or 'Courier'
                        color: textColor,
                        fontSize: 12,
                        fontWeight: '600',
                        letterSpacing: 0.5
                    }}
                >
                    {color}  |  RGB: {rgb}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 60, // Fixed height for the bar
        borderRadius: 30, // Pill shape
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 8,
        marginHorizontal: 20,
        marginBottom: 34, // Safe Area padding
        // Modern Soft Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        // Border
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    textPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)', // Glassmorphism-ish
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoText: {
        color: '#fff', // Assuming user picks mostly colors where white is okay or the glass helps
        // Ideally we'd calculate contrast, but white + text shadow usually works on most except very light
        // If very light, the border helps.
        fontSize: 14,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
