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
            {/* Animated Indicator */}
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

                return (
                    <TabItem
                        key={route.key}
                        route={route}
                        isFocused={isFocused}
                        options={options}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        icon={getIcon(route.name, isFocused ? '#1A1A1A' : '#A1A1A1')}
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
        height: 65,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        // Elevation for Android
        elevation: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        width: 50,
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
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F2F2F7',
    },
});
