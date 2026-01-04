import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Eye, Layers, Palette, Pipette, User } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabItem = ({
    route,
    isFocused,
    options,
    onPress,
    onLongPress,
    icon
}: {
    route: any,
    isFocused: boolean,
    options: any,
    onPress: () => void,
    onLongPress: () => void,
    icon: React.ReactNode
}) => {
    const scale = useSharedValue(isFocused ? 1.1 : 1);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 15, stiffness: 200 });
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 15, stiffness: 200 });
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.tabItem}
        >
            <Animated.View style={animatedStyle}>
                {icon}
            </Animated.View>
        </Pressable>
    );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const [layout, setLayout] = React.useState({ width: 0, height: 0 });
    const translateX = useSharedValue(0);

    const getIcon = (routeName: string, color: string) => {
        switch (routeName) {
            case 'index': return <Pipette size={24} color={color} />;
            case 'palette': return <Palette size={24} color={color} />;
            case 'squint': return <Eye size={24} color={color} />;
            case 'valuemap': return <Layers size={24} color={color} />;
            case 'profile': return <User size={24} color={color} />;
            default: return <Pipette size={24} color={color} />;
        }
    };

    React.useEffect(() => {
        if (layout.width > 0) {
            const tabWidth = (layout.width - 20) / state.routes.length;
            translateX.value = withSpring(state.index * tabWidth, {
                damping: 15,
                stiffness: 100,
            });
        }
    }, [state.index, layout.width]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    return (
        <View
            style={[styles.container, { bottom: insets.bottom + 20 }]}
            onLayout={(e) => setLayout(e.nativeEvent.layout)}
        >
            {/* Dark Glass Background via BlurView is hard to do with absolute positioning on just the container if we want strict border control.
                Instead, we'll use a semi-transparent view with backdrop blur if available, or just the color.
                React Native BlurView needs to wrap content or be absolute filled.
                Let's wrap the whole inner content in a View that simulates the surface.
             */}

            {/* Active Indicator (Glow) */}
            {layout.width > 0 && (
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            width: (layout.width - 20) / state.routes.length,
                        },
                        animatedStyle,
                    ]}
                >
                    <View style={styles.indicatorInner} />
                </Animated.View>
            )}

            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                // Active: Electric Cobalt #3E63DD, Inactive: #525255
                const iconColor = isFocused ? '#3E63DD' : '#525255';

                return (
                    <TabItem
                        key={route.key}
                        route={route}
                        isFocused={isFocused}
                        options={options}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        icon={getIcon(route.name, iconColor)}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 72, // Slightly taller for touch targets
        backgroundColor: 'rgba(22, 22, 24, 0.85)', // #161618 @ 85%
        borderRadius: 36, // Pill
        borderWidth: 1,
        borderColor: 'rgba(62, 99, 221, 0.2)', // #3E63DD @ 20%
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        // Shadow for "Hover" feel
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
    indicator: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        // Active Glow Effect
        backgroundColor: 'rgba(62, 99, 221, 0.15)', // Subtle Cobalt fill
        shadowColor: '#00FFFF', // Cyan Outer Bloom
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        // We'll mimic the bloom with shadow
    },
});
