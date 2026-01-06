import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding (16*3 spacing)

export interface GalleryItem {
    id: string;
    imageUrl: string;
    colors: string[];
}

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
        Haptics.selectionAsync();
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
                            source={{ uri: item.imageUrl }}
                            style={styles.image}
                            contentFit="cover"
                            transition={200}
                            onError={() => setHasError(true)}
                        />
                    )}

                    {/* Glass Footer Overlay */}
                    <View style={styles.glassFooter}>
                        <View style={styles.swatchContainer}>
                            {item.colors.slice(0, 5).map((color, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.swatch,
                                        {
                                            backgroundColor: color,
                                            zIndex: 5 - i,
                                            marginLeft: i === 0 ? 0 : -10 // Overlapping Venn-style
                                        }
                                    ]}
                                />
                            ))}
                        </View>
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
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: 12,
        // Glassmorphism simulation
        backgroundColor: 'rgba(28, 28, 30, 0.75)', // Surface L2 with Opacity
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)', // Works on web, ignored on native usually but good intent
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
});
