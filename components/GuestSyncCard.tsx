import { AppText } from '@/components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Cloud } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface GuestSyncCardProps {
    onPressSync: () => void;
}

export const GuestSyncCard = ({ onPressSync }: GuestSyncCardProps) => {
    return (
        <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={{ marginBottom: 24 }}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPressSync}
            >
                <LinearGradient
                    colors={['#3E63DD', '#892CDC']} // Cobalt to Purple
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <View style={styles.textContainer}>
                            <AppText style={styles.title}>Sync your Studio</AppText>
                            <AppText style={styles.subtitle}>
                                Sign up to save your palettes forever.
                            </AppText>
                        </View>
                        <View style={styles.iconContainer}>
                            <Cloud size={24} color="#FFFFFF" />
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    textContainer: {
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)', // Increased opacity for contrast
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 18,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)', // White with opacity
        lineHeight: 20,
    },
});
