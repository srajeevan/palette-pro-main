import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getContrastColor } from '@/utils/colorUtils';

interface PaletteSwatchProps {
    color: string;
    onPress?: (color: string) => void;
    onLongPress?: (color: string) => void;
    index: number;
}

export const PaletteSwatch = ({ color, onPress, onLongPress, index }: PaletteSwatchProps) => {
    console.log(`Rendering swatch ${index} with color ${color}`);
    const textColor = getContrastColor(color);

    return (
        <Pressable
            onPress={() => onPress?.(color)}
            onLongPress={() => onLongPress?.(color)}
            style={[
                styles.swatch,
                { backgroundColor: color }
            ]}
        >
            <View style={styles.content}>
                <Text style={[styles.hexText, { color: textColor }]}>
                    {color.toUpperCase()}
                </Text>
            </View>
        </Pressable>
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
    }
});
