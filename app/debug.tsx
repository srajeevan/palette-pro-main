import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Link } from 'expo-router';

export default function DebugScreen() {
    const isPressed = useSharedValue(false);
    const offset = useSharedValue({ x: 0, y: 0 });

    const start = useSharedValue({ x: 0, y: 0 });

    const gesture = Gesture.Pan()
        .onBegin(() => {
            isPressed.value = true;
        })
        .onUpdate((e) => {
            offset.value = {
                x: e.translationX + start.value.x,
                y: e.translationY + start.value.y,
            };
        })
        .onEnd(() => {
            start.value = {
                x: offset.value.x,
                y: offset.value.y,
            };
            isPressed.value = false;
        });

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: offset.value.x },
                { translateY: offset.value.y },
                { scale: withSpring(isPressed.value ? 1.2 : 1) },
            ],
            backgroundColor: isPressed.value ? '#e07a5f' : '#292524', // paint-accent or stone-800
        };
    });

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Debug Screen</Text>
                <Text style={styles.subtitle}>Drag the box below to test Reanimated & Gestures</Text>

                <GestureDetector gesture={gesture}>
                    <Animated.View style={[styles.box, animatedStyles]} />
                </GestureDetector>

                <Link href="/" style={styles.link}>
                    <Text style={styles.linkText}>Go back to tabs</Text>
                </Link>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f4', // stone-100
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1c1917', // stone-900
    },
    subtitle: {
        fontSize: 16,
        color: '#57534e', // stone-600
        marginBottom: 40,
    },
    box: {
        width: 100,
        height: 100,
        borderRadius: 20,
        cursor: 'grab',
    },
    link: {
        marginTop: 40,
        padding: 10,
    },
    linkText: {
        color: '#e07a5f',
        fontSize: 18
    }
});
