import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PaintTubeRowProps {
    color: string;
    percentage: number;
    name: string;
    isLocked?: boolean;
}

export const PaintTubeRow = ({ color, percentage, name, isLocked }: PaintTubeRowProps) => {
    return (
        <View style={styles.row}>
            {/* Color Swatch */}
            <View style={[styles.swatch, { backgroundColor: color }]} />

            {/* Details */}
            <View style={styles.details}>
                <Text style={styles.name}>{name}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    swatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    details: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    percentage: {
        fontSize: 12,
        color: '#6b7280',
    }
});
