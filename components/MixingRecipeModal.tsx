import { usePro } from '@/context/ProContext';
import { useUpgradeFlow } from '@/hooks/useUpgradeFlow';
import { checkDailyMixingLimit, incrementDailyMixingCount } from '@/utils/usage';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { MultiSegmentDonut } from './MultiSegmentDonut';
import { PaintTubeRow } from './PaintTubeRow';

import { Info } from 'lucide-react-native';
interface MixingRecipeModalProps {
    visible: boolean;
    recipeData: string; // e.g., "50% Burnt Umber + 50% White"
    reasoning?: string | null;
    onClose: () => void;
    onUnlock: () => void;
}

interface Ingredient {
    name: string;
    percentage: number;
    color: string;
}

// Helper to map pigment names to hex colors
import { UNIVERSAL_PALETTE } from '@/constants/Pigments';

const getPigmentColor = (name: string): string => {
    const n = name.trim().toLowerCase();

    // 1. Try exact/partial match in Universal Palette
    const match = UNIVERSAL_PALETTE.find(p => p.name.toLowerCase() === n || p.name.toLowerCase().includes(n));
    if (match) return match.hex;

    // 2. Fallbacks for generic names not in palette
    if (n.includes('white')) return '#F9FAFB';
    if (n.includes('black')) return '#1a1a1a';
    if (n.includes('burnt umber')) return '#4a3728';
    if (n.includes('umber')) return '#635147';
    if (n.includes('sienna')) return '#882D17';
    if (n.includes('ochre')) return '#CC7722';
    if (n.includes('red')) return '#DC143C';
    if (n.includes('blue')) return '#0047AB';
    if (n.includes('green')) return '#008000';
    if (n.includes('yellow')) return '#FFD700';
    if (n.includes('crimson')) return '#E32636'; // Fallback for crimson if not matched
    if (n.includes('magenta')) return '#9A1F4C';

    return '#9ca3af'; // default gray
};

const parseRecipe = (recipe: string): Ingredient[] => {
    if (!recipe || recipe === 'Touch image to mix...' || recipe === 'Analyzing...') return [];

    // Example format: "3 parts French Ultramarine (PB29) + 1 part Cadmium Yellow Pale (PY35)"
    // Also handles: "100% Titanium White (PW6)"
    const segments = recipe.split(' + ');

    // First pass: Parse parts and names
    const parsedItems = segments.map(segment => {
        const trimmed = segment.trim();

        // Match "100% Name (CIN)" for single pigments
        const singleMatch = trimmed.match(/^100%\s+(.+?)(?:\s+\([A-Z][A-Za-z0-9+]+\))?$/i);
        if (singleMatch) {
            const rawName = singleMatch[1].trim();
            const cleanName = rawName.replace(/\s*\([A-Z][A-Za-z0-9+]+\)\s*$/, '').trim();
            return {
                parts: 1,
                name: rawName,
                color: getPigmentColor(cleanName)
            };
        }

        // Match "3 parts Name (CIN)" or "1 part Name (CIN)"
        const partMatch = trimmed.match(/^(\d+)\s+parts?\s+(.+)$/i);
        if (partMatch) {
            const rawName = partMatch[2].trim();
            // Strip CIN code for color lookup but keep for display
            const cleanName = rawName.replace(/\s*\([A-Z][A-Za-z0-9+]+\)\s*$/, '').trim();
            return {
                parts: parseInt(partMatch[1], 10),
                name: rawName,
                color: getPigmentColor(cleanName)
            };
        }

        // Fallback
        return {
            parts: 1,
            name: trimmed,
            color: getPigmentColor(trimmed)
        };
    });

    // Calculate total for percentage
    const totalParts = parsedItems.reduce((sum, item) => sum + item.parts, 0);

    // Map to Ingredient interface with largest-remainder rounding (sums to exactly 100%)
    if (totalParts <= 0) {
        return parsedItems.map(item => ({
            name: item.parts > 1 ? `${item.parts} parts ${item.name}` : `1 part ${item.name}`,
            percentage: 0,
            color: item.color
        }));
    }

    const rawPercentages = parsedItems.map(item => (item.parts / totalParts) * 100);
    const floored = rawPercentages.map(p => Math.floor(p));
    let remainder = 100 - floored.reduce((a, b) => a + b, 0);
    // Distribute remainder to items with largest fractional parts
    const fractionals = rawPercentages.map((p, i) => ({ i, frac: p - floored[i] }));
    fractionals.sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < remainder; k++) {
        floored[fractionals[k].i] += 1;
    }

    return parsedItems.map((item, i) => ({
        name: item.parts > 1 ? `${item.parts} parts ${item.name}` : `1 part ${item.name}`,
        percentage: floored[i],
        color: item.color
    }));
};

export const MixingRecipeModal = ({ visible, recipeData, reasoning, onClose, onUnlock }: MixingRecipeModalProps) => {
    const ingredients = useMemo(() => parseRecipe(recipeData), [recipeData]);
    const { isPro } = usePro();
    const [isViewAllowed, setIsViewAllowed] = React.useState(false);
    const [dailyLimitReached, setDailyLimitReached] = React.useState(false);

    React.useEffect(() => {
        if (visible) {
            const checkLimit = async () => {
                if (isPro) {
                    setIsViewAllowed(true);
                    setDailyLimitReached(false);
                } else {
                    const { allowed } = await checkDailyMixingLimit('studio');
                    if (allowed) {
                        setIsViewAllowed(true);
                        setDailyLimitReached(false);
                        await incrementDailyMixingCount('studio');
                    } else {
                        setIsViewAllowed(false);
                        setDailyLimitReached(true);
                    }
                }
            };
            checkLimit();
        } else {
            // Reset on close
            setIsViewAllowed(false);
        }
    }, [visible, isPro]);

    const { triggerUpgradeFlow } = useUpgradeFlow();

    const handleUnlockPress = () => {
        triggerUpgradeFlow(() => {
            onClose();
            // Small delay to allow fade out before triggering external unlock action
            setTimeout(() => {
                onUnlock();
            }, 300);
        }, {
            onGuestIntent: onClose
        });
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
                                    <View style={styles.chartColumn}>
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
                                                    percentage={isViewAllowed ? ing.percentage : 0} // Hide percentage
                                                    name={isViewAllowed ? ing.name : ing.name} // Show name 
                                                    isLocked={!isViewAllowed}
                                                />
                                            </Animated.View>
                                        ))}
                                    </View>

                                    {/* Locked Overlay with Blur */}
                                    {!isViewAllowed && (
                                        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 12 }]}>
                                            <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                                <TouchableOpacity
                                                    onPress={handleUnlockPress}
                                                    style={{ backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
                                                >
                                                    <Text style={{ fontWeight: 'bold', color: 'black', marginRight: 6 }}>
                                                        {dailyLimitReached ? "🔒 Daily Limit Reached" : "🔒 Unlock Recipe"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={[styles.emptyState, { flex: 1 }]}>
                                    <Text style={styles.emptyText}>Select a color to see the recipe.</Text>
                                </View>
                            )}
                        </View>

                        {/* Reasoning (shown for single-pigment results) */}
                        {isViewAllowed && reasoning && ingredients.length > 0 && (
                            <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', gap: 8, backgroundColor: 'rgba(59,130,246,0.06)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.12)' }}>
                                    <Info size={14} color="#3B82F6" style={{ marginTop: 2 }} />
                                    <Text style={{ flex: 1, fontSize: 12, color: '#4B5563', lineHeight: 17, fontFamily: 'Inter_400Regular' }}>
                                        {reasoning}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Disclaimer */}
                        {ingredients.length > 0 && (
                            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', gap: 8, backgroundColor: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12 }}>
                                    <Info size={14} color="#6B7280" style={{ marginTop: 2 }} />
                                    <Text style={{ flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 16, fontFamily: 'Inter_400Regular' }}>
                                        Results may vary slightly depending on specific pigment brands used.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Footer - Close Button */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
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
