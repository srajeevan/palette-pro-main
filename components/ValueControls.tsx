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
                    <Layers size={18} color="#78716c" />
                    <AppText style={styles.label}>Grayscale Mode</AppText>
                </View>
                <Switch
                    value={grayscaleEnabled}
                    onValueChange={setGrayscaleEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#1A1A1A' }}
                    thumbColor={'#FFFFFF'}
                    ios_backgroundColor="#E0E0E0"
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
                    minimumTrackTintColor="#1A1A1A"
                    maximumTrackTintColor="#E0E0E0"
                    thumbTintColor="#1A1A1A"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 20,
        // Floating Card Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
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
        color: '#333',
    },
    value: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: '#1A1A1A',
    },
    separator: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginVertical: 16,
    },
    sliderSection: {
        // paddingVertical handled by row separation
    },
});
