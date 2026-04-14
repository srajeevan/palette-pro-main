import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { usePro } from '@/context/ProContext';
import { getPaletteCount } from '@/services/paletteService';
import { useEngagementStore } from '@/store/useEngagementStore';

export function UnsavedPaletteBanner() {
    const unsavedPaletteTimestamp = useEngagementStore((s) => s.unsavedPaletteTimestamp);
    const { isPro } = usePro();
    const [dismissed, setDismissed] = useState(false);
    const [savedCount, setSavedCount] = useState<number | null>(null);

    useEffect(() => {
        if (!isPro && unsavedPaletteTimestamp) {
            getPaletteCount().then(setSavedCount).catch(() => {});
        }
    }, [isPro, unsavedPaletteTimestamp]);

    if (!unsavedPaletteTimestamp || dismissed) {
        return null;
    }

    // Only show if the unsaved palette is within the last 24 hours
    const timestamp = new Date(unsavedPaletteTimestamp).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - timestamp > twentyFourHours) {
        return null;
    }

    // Free user who has hit the 3-palette limit
    const freeAtLimit = !isPro && savedCount !== null && savedCount >= 3;

    const message = freeAtLimit
        ? "You've used all 3 free saves. Upgrade to keep this palette."
        : isPro
            ? "You have an unsaved palette — don't lose it!"
            : `You have an unsaved palette — ${3 - (savedCount ?? 0)} of 3 free saves left.`;

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
            <View style={[styles.pill, freeAtLimit && styles.pillWarning]}>
                <Text style={styles.text}>
                    <Text style={styles.emoji}>{freeAtLimit ? '\u26A0\uFE0F ' : '\uD83C\uDFA8 '}</Text>
                    {message}
                </Text>
                <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
                    <Text style={styles.dismiss}>{'\u00D7'}</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1b26',
        borderColor: '#3E63DD40',
        borderWidth: 1,
        borderRadius: 9999,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    pillWarning: {
        borderColor: '#F59E0B40',
    },
    emoji: {
        fontSize: 14,
    },
    text: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#A1A1AA',
        flexShrink: 1,
    },
    dismiss: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#A1A1AA',
        marginLeft: 12,
    },
});
