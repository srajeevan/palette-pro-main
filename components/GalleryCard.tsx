import { SaveType } from '@/services/paletteService';
import { safeHaptics } from '@/utils/haptics';
import { Image } from 'expo-image';
import { Eye, ImageOff, Pipette, SlidersHorizontal, Thermometer } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { AppText } from './AppText';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding (16*3 spacing)

export interface GalleryItem {
    id: string;
    name: string;
    imageUrl: string;
    colors: string[] | null;
    type: SaveType;
    effects?: Record<string, any> | null;
}

const TYPE_BADGE: Record<SaveType, { label: string; icon: React.ReactNode; bg: string }> = {
    palette: { label: 'Palette', icon: null, bg: '' }, // no badge for palettes
    studio: { label: 'Studio', icon: <Pipette size={10} color="#FFFFFF" />, bg: '#3E63DD' },
    squint: { label: 'Squint', icon: <Eye size={10} color="#FFFFFF" />, bg: '#EA580C' },
    valuemap: { label: 'Values', icon: <SlidersHorizontal size={10} color="#FFFFFF" />, bg: '#8B5CF6' },
};

interface GalleryCardProps {
    item: GalleryItem;
    index: number;
    onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GalleryCard = ({ item, index, onPress }: GalleryCardProps) => {
    const scale = useSharedValue(1);
    const [hasError, setHasError] = useState(false);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        safeHaptics.selection();
        onPress();
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify().damping(15)}
            style={[styles.containerShadow, { marginBottom: 16 }]}
        >
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.card, animatedStyle]}
            >
                {/* Image Section */}
                <View style={styles.imageContainer}>
                    {hasError || !item.imageUrl ? (
                        <View className="flex-1 items-center justify-center bg-[#27272A]">
                            <ImageOff size={24} color="#52525B" />
                        </View>
                    ) : (
                        <Image
                            source={{ uri: item.effects?.thumbnail_url || item.imageUrl }}
                            style={styles.image}
                            contentFit="cover"
                            transition={200}
                            onError={() => setHasError(true)}
                        />
                    )}

                    {/* Glass Footer Overlay */}
                    <View style={styles.glassFooter}>
                        <View style={styles.footerLeft}>
                            {item.colors && item.colors.length > 0 ? (
                                <View style={styles.swatchContainer}>
                                    {item.colors.slice(0, 5).map((color, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.swatch,
                                                {
                                                    backgroundColor: color,
                                                    zIndex: 5 - i,
                                                    marginLeft: i === 0 ? 0 : -10
                                                }
                                            ]}
                                        />
                                    ))}
                                </View>
                            ) : (
                                // Badge for non-palette saves
                                item.type !== 'palette' && TYPE_BADGE[item.type] ? (
                                    <View style={[styles.typeBadge, { backgroundColor: TYPE_BADGE[item.type].bg }]}>
                                        {TYPE_BADGE[item.type].icon}
                                        <AppText style={styles.typeBadgeText}>{TYPE_BADGE[item.type].label}</AppText>
                                    </View>
                                ) : null
                            )}
                        </View>
                        <AppText style={styles.cardName} numberOfLines={1}>{item.name}</AppText>
                    </View>
                </View>
            </AnimatedPressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    containerShadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#1C1C1E', // Dark Card
        borderRadius: 20, // 20pt radius as per spec
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#28282A', // Subtle border
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 0.8, // Taller portrait ratio
        backgroundColor: '#0A0A0B',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    glassFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 10,
        paddingHorizontal: 12,
        // Glassmorphism simulation
        backgroundColor: 'rgba(28, 28, 30, 0.85)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardName: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        color: '#E4E4E7',
        marginTop: 6,
    },
    swatchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    swatch: {
        width: 32, // Larger circles
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#1C1C1E', // Match card bg for "cutout" look
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    typeBadgeText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});
