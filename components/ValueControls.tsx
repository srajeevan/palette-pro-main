
import { AppText } from '@/components/AppText';
import { Droplets, Layers } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

interface ValueControlsProps {
    grayscaleEnabled: boolean;
    setGrayscaleEnabled: (value: boolean) => void;
    temperatureEnabled: boolean;
    setTemperatureEnabled: (value: boolean) => void;
}

export const ValueControls = ({
    grayscaleEnabled,
    setGrayscaleEnabled,
    temperatureEnabled,
    setTemperatureEnabled
}: ValueControlsProps) => {
    const [activeTab, setActiveTab] = useState<'adjust' | 'insights'>('adjust');

    return (
        <View style={styles.card}>
            {/* Tab Header */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'adjust' && styles.activeTab]}
                    onPress={() => setActiveTab('adjust')}
                >
                    <AppText style={[styles.tabText, activeTab === 'adjust' && styles.activeTabText]}>Adjust</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
                    onPress={() => setActiveTab('insights')}
                >
                    <AppText style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>Insights</AppText>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            {activeTab === 'adjust' ? (
                <View style={styles.contentContainer}>
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

                    {/* Row 2: Temperature Map Toggle */}
                    <View style={styles.row}>
                        <View style={styles.labelContainer}>
                            <Layers size={18} color="#A1A1AA" />
                            <AppText style={styles.label}>Temperature Map</AppText>
                        </View>
                        <Switch
                            value={temperatureEnabled}
                            onValueChange={setTemperatureEnabled}
                            trackColor={{ false: '#28282A', true: '#FF6B6B' }} // Dark track, Warm Red active
                            thumbColor={'#FFFFFF'}
                            ios_backgroundColor="#28282A"
                        />
                    </View>
                </View>
            ) : (
                <View style={styles.insightsContainer}>
                    {/* Warm Colors Section */}
                    <View style={styles.insightSection}>
                        <View style={styles.insightHeader}>
                            <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
                            <AppText style={styles.insightTitle}>Warm Colors</AppText>
                        </View>
                        <AppText style={styles.insightText}>
                            • Reds, oranges, yellows - advance forward{'\n'}
                            • Light sources, skin tones
                        </AppText>
                    </View>

                    {/* Cool Colors Section */}
                    <View style={styles.insightSection}>
                        <View style={styles.insightHeader}>
                            <View style={[styles.dot, { backgroundColor: '#3E63DD' }]} />
                            <AppText style={styles.insightTitle}>Cool Colors</AppText>
                        </View>
                        <AppText style={styles.insightText}>
                            • Blues, greens, purples - recede back{'\n'}
                            • Shadows, sky, water
                        </AppText>
                    </View>

                    {/* Mixing Tips Section */}
                    <View style={styles.insightSection}>
                        <View style={styles.insightHeader}>
                            <Droplets size={14} color="#EDE0D4" />
                            <AppText style={styles.insightTitle}>Mixing Tips</AppText>
                        </View>
                        <AppText style={styles.insightText}>
                            • Warm shadows: Add burnt umber{'\n'}
                            • Cool lights: Add ultramarine{'\n'}
                            • Tip: Warm/cool contrast creates depth
                        </AppText>
                    </View>

                    {/* Temperature Scale Gradient */}
                    <View style={styles.scaleContainer}>
                        <AppText style={styles.scaleLabel}>Warm</AppText>
                        <View style={styles.gradientBar} />
                        <AppText style={styles.scaleLabel}>Cool</AppText>
                    </View>
                </View>
            )}
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
    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#28282A',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#3E63DD', // Cobalt Blue
        shadowColor: 'rgba(62, 99, 221, 0.4)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    tabText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#A1A1AA',
    },
    activeTabText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold',
    },
    // Content Styles
    contentContainer: {
        minHeight: 120, // Keep height consistent
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
    separator: {
        height: 1,
        backgroundColor: '#28282A',
        marginVertical: 16,
    },
    // Insights Styles
    insightsContainer: {
        gap: 16,
    },
    insightSection: {
        gap: 6,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    insightTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: '#E4E4E5',
    },
    insightText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12, // Small for density
        color: '#A1A1AA',
        lineHeight: 18,
        paddingLeft: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // Scale
    scaleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    scaleLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: '#71717A',
    },
    gradientBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#333', // Placeholder for gradient, can be styled with View styles if native gradient not available or simple backgroundColor
        // Simulate gradient with borders or background color? 
        // Best to use a simple multi-colored View or just a solid color for now
        // Or render a tiny skia canvas? Overkill.
        // CSS gradient not supported in RN View. 
        // We will just use a view with 'overflow: hidden' and two views inside for now or just a gray bar with colored ends.
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
    }
});
