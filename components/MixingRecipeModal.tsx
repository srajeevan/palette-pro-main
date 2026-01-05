import { PaywallModal } from '@/components/PaywallModal';
import { usePro } from '@/context/ProContext';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { MultiSegmentDonut } from './MultiSegmentDonut';
import { PaintTubeRow } from './PaintTubeRow';

interface MixingRecipeModalProps {
    visible: boolean;
    recipeData: string; // e.g., "50% Burnt Umber + 50% White"
    onClose: () => void;
}

interface Ingredient {
    name: string;
    percentage: number;
    color: string;
}

// Helper to map pigment names to hex colors
const getPigmentColor = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('white')) return '#F9FAFB'; // Slightly off-white for visibility against white bg
    if (n.includes('black')) return '#1a1a1a';
    if (n.includes('burnt umber')) return '#4a3728';
    if (n.includes('umber')) return '#635147';
    if (n.includes('sienna')) return '#882D17';
    if (n.includes('ochre')) return '#CC7722';
    if (n.includes('red')) return '#DC143C';
    if (n.includes('blue')) return '#0047AB';
    if (n.includes('green')) return '#008000';
    if (n.includes('yellow')) return '#FFD700';
    return '#9ca3af'; // default gray
};

const parseRecipe = (recipe: string): Ingredient[] => {
    if (!recipe || recipe === 'Touch image to mix...') return [];

    // Example format: "50% Burnt Umber + 30% White"
    const parts = recipe.split('+');

    return parts.map(part => {
        const trimmed = part.trim();
        const percentMatch = trimmed.match(/(\d+)%/);
        const percentage = percentMatch ? parseInt(percentMatch[1], 10) : 0;
        const name = trimmed.replace(/(\d+)%/, '').trim();

        return {
            name,
            percentage,
            color: getPigmentColor(name),
        };
    });
};

export const MixingRecipeModal = ({ visible, recipeData, onClose }: MixingRecipeModalProps) => {
    const ingredients = useMemo(() => parseRecipe(recipeData), [recipeData]);
    const { isPro } = usePro();
    const paywallRef = React.useRef<BottomSheetModal>(null);

    const handleUnlockPress = () => {
        paywallRef.current?.present();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <Animated.View
                    entering={FadeInDown.springify().damping(15)}
                    style={styles.cardContainer}
                >
                    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                    <View style={styles.card}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { fontFamily: 'PlayfairDisplay_700Bold' }]}>Mixing Recipe</Text>
                            <Text style={[styles.subtitle, { fontFamily: 'Inter_400Regular' }]}>Oil Pigment Mix</Text>
                        </View>

                        {/* Content Row: Left (Donut) + Right (List) */}
                        <View style={styles.contentRow}>
                            {ingredients.length > 0 ? (
                                <>
                                    {/* Left Column: Chart */}
                                    <View style={[styles.chartColumn, !isPro && { opacity: 0.3, blurRadius: 4 }]}>
                                        <MultiSegmentDonut data={ingredients} size={140} strokeWidth={16} />
                                    </View>

                                    {/* Right Column: List */}
                                    <View style={styles.listColumn}>
                                        {ingredients.map((ing, index) => (
                                            <Animated.View
                                                key={index}
                                                entering={FadeInRight.delay(index * 100).springify().damping(12)}
                                            >
                                                <PaintTubeRow
                                                    color={ing.color}
                                                    percentage={isPro ? ing.percentage : 0} // Hide percentage
                                                    name={isPro ? ing.name : ing.name} // Show name but maybe hide specific brand if wanted, for now name is fine
                                                    isLocked={!isPro}
                                                />
                                            </Animated.View>
                                        ))}
                                    </View>

                                    {/* Locked Overlay */}
                                    {!isPro && (
                                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                            <TouchableOpacity
                                                onPress={handleUnlockPress}
                                                style={{ backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
                                            >
                                                <Text style={{ fontWeight: 'bold', color: 'black', marginRight: 6 }}>🔒 Unlock Recipe</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={[styles.emptyState, { flex: 1 }]}>
                                    <Text style={styles.emptyText}>Select a color to see the recipe.</Text>
                                </View>
                            )}
                        </View>

                        {/* Footer - Close Button */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>

            <PaywallModal ref={paywallRef} />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Slightly lighter backdrop to show off glass effect
    },
    cardContainer: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        // High Quality iOS Shadows
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.6)",
    },
    card: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
        paddingBottom: 24,
    },
    header: {
        paddingTop: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        marginBottom: 8,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 24,
        minHeight: 200,
    },
    chartColumn: {
        flex: 0.45, // Slightly less than half
        alignItems: 'center',
        justifyContent: 'center',
    },
    listColumn: {
        flex: 0.55,
        justifyContent: 'center',
        paddingLeft: 12,
    },
    footer: {
        paddingHorizontal: 24,
    },
    closeButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 0, // contentRow handles padding
    },
    closeButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
    }
});
