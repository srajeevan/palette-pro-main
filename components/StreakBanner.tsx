
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useEngagementStore } from '@/store/useEngagementStore';

export function StreakBanner() {
    const currentStreak = useEngagementStore((s) => s.currentStreak);
    const [dismissed, setDismissed] = useState(false);

    if (currentStreak < 2 || dismissed) {
        return null;
    }

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
            <View style={styles.pill}>
                <Text style={styles.text}>
                    🔥{' '}
                    <Text style={styles.streakNumber}>{currentStreak}</Text>
                    -day painting streak! Keep it going.
                </Text>
                <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
                    <Text style={styles.dismiss}>×</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161618',
        borderColor: '#28282A',
        borderWidth: 1,
        borderRadius: 9999,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    text: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#A1A1AA',
        flexShrink: 1,
    },
    streakNumber: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#FFFFFF',
    },
    dismiss: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#A1A1AA',
        marginLeft: 12,
    },
});
