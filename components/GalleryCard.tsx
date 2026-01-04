import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React from 'react';
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
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                    />
                </View>

                {/* Palette Footer */}
                <View style={styles.footer}>
                    <View style={styles.swatchContainer}>
                        {item.colors.slice(0, 5).map((color, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.swatch,
                                    { backgroundColor: color, zIndex: 5 - i }
                                ]}
                            />
                        ))}
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
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden', // Ensure content clips to border radius
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1, // Square for now
        backgroundColor: '#f5f5f4',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    footer: {
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
    },
    swatchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    swatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginRight: -8, // Stacked look
    },
});
