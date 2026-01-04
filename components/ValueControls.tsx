import { AppText } from '@/components/AppText';
import Slider from '@react-native-community/slider';
import { Layers } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';

interface ValueControlsProps {
    grayscaleEnabled: boolean;
    setGrayscaleEnabled: (value: boolean) => void;
    posterizeLevels: number;
    setPosterizeLevels: (value: number) => void;
    minLevels: number;
    maxLevels: number;
}

export const ValueControls = ({
    grayscaleEnabled,
    setGrayscaleEnabled,
    posterizeLevels,
    setPosterizeLevels,
    minLevels,
    maxLevels
}: ValueControlsProps) => {
    return (
        <View style={styles.card}>
            {/* Row 1: Grayscale Toggle */}
            <View style={styles.row}>
                <View style={styles.labelContainer}>
                    <Layers size={18} color="#A1A1AA" />
                    <AppText style={styles.label}>Grayscale Mode</AppText>
                </View>
                <Switch
                    value={grayscaleEnabled}
                    onValueChange={setGrayscaleEnabled}
                    trackColor={{ false: '#28282A', true: '#3E63DD' }} // Dark track, Cobalt active
                    thumbColor={'#FFFFFF'}
                    ios_backgroundColor="#28282A"
                />
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Row 2: Posterization Slider */}
            <View style={styles.sliderSection}>
                <View style={styles.row}>
                    <AppText style={styles.label}>Posterization Levels</AppText>
                    <AppText style={styles.value}>
                        {posterizeLevels === 1 ? 'Off' : posterizeLevels}
                    </AppText>
                </View>

                <Slider
                    style={{ width: '100%', height: 40, marginTop: 8 }}
                    minimumValue={minLevels}
                    maximumValue={maxLevels}
                    step={1}
                    value={posterizeLevels}
                    onValueChange={setPosterizeLevels}
                    minimumTrackTintColor="#FFFFFF" // Active: White
                    maximumTrackTintColor="#28282A" // Inactive: Dark
                    thumbTintColor="#FFFFFF"
                />
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
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#A1A1AA', // Zinc-400
    },
    value: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#FFFFFF',
        textShadowColor: 'rgba(62, 99, 221, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    separator: {
        height: 1,
        backgroundColor: '#28282A',
        marginVertical: 16,
    },
    sliderSection: {
        // paddingVertical handled by row separation
    },
});
