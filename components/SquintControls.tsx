import { AppText } from '@/components/AppText';
import Slider from '@react-native-community/slider';
import { Eye } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SquintControlsProps {
    blurIntensity: number;
    setBlurIntensity: (value: number) => void;
    maxBlur: number;
}

export const SquintControls = ({ blurIntensity, setBlurIntensity, maxBlur }: SquintControlsProps) => {
    return (
        <View style={styles.card}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <Eye size={18} color="#A1A1AA" />
                    <AppText style={styles.title}>Blur Intensity</AppText>
                </View>
                <AppText style={styles.value}>
                    {Math.round((blurIntensity / maxBlur) * 100)}%
                </AppText>
            </View>

            {/* Slider */}
            <View style={styles.sliderContainer}>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={maxBlur}
                    value={blurIntensity}
                    onValueChange={setBlurIntensity}
                    minimumTrackTintColor="#FFFFFF" // Active Color: White
                    maximumTrackTintColor="#28282A" // Inactive Color: Dark Gray
                    thumbTintColor="#FFFFFF" // White thumb
                />
            </View>

            {/* Info Tip */}
            <View style={styles.infoBox}>
                <AppText style={styles.infoText}>
                    Squinting helps artists see the big shapes and values without getting lost in details.
                </AppText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#161618', // Surface L1
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#28282A',
        // Floating Card Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontFamily: 'Inter_500Medium',
        color: '#A1A1AA', // Zinc-400
        fontSize: 14,
    },
    value: {
        fontFamily: 'Inter_700Bold',
        color: '#FFFFFF', // White
        fontSize: 14,
        textShadowColor: 'rgba(62, 99, 221, 0.6)', // Electric Cobalt Halo
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    sliderContainer: {
        marginBottom: 20,
    },
    infoBox: {
        backgroundColor: '#1C1C1E', // Slightly lighter inner box
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#28282A',
    },
    infoText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#A1A1AA',
        lineHeight: 18,
        textAlign: 'center',
    },
});
