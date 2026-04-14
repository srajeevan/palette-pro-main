import React from 'react';
import { StyleSheet, View } from 'react-native';

interface OnboardingProgressProps {
    current: number;
    total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.segment,
                        i < current ? styles.segmentFilled : styles.segmentEmpty,
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 4,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
    },
    segment: {
        flex: 1,
        height: 3,
        borderRadius: 2,
    },
    segmentFilled: {
        backgroundColor: '#3E63DD',
    },
    segmentEmpty: {
        backgroundColor: '#28282A',
    },
});
