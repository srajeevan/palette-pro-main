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
                    <Eye size={18} color="#78716c" />
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
                    minimumTrackTintColor="#1A1A1A" // Active Color: Black/Dark Gray
                    maximumTrackTintColor="#E0E0E0" // Inactive Color: Light Gray
                    thumbTintColor="#1A1A1A" // Minimalist solid black thumb
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 24,
        // Floating Card Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
        marginTop: -40, // Pull up to overlap slightly with canvas or sit tight against it if needed. 
        // Actually, prompt says "sit nicely above navbar". 
        // Let's stick to standard marginTop for now, or maybe 16 to separate from canvas.
        // Prompt says "Integration: Place... at the bottom of content area".
        // I'll leave margin handling to the parent or standard flow.
        marginBottom: 10, // Slight breathing room
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
        color: '#44403c', // Stone-700ish
        fontSize: 14,
    },
    value: {
        fontFamily: 'Inter_700Bold',
        color: '#1A1A1A',
        fontSize: 14,
    },
    sliderContainer: {
        marginBottom: 20,
    },
    infoBox: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 12,
    },
    infoText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
        textAlign: 'center',
    },
});
