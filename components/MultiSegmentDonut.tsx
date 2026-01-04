import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Segment {
    color: string;
    percentage: number;
}

interface MultiSegmentDonutProps {
    data: Segment[];
    size?: number;
    strokeWidth?: number;
}

export const MultiSegmentDonut = ({ data, size = 160, strokeWidth = 14 }: MultiSegmentDonutProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, {
            duration: 1000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
    }, [data]);

    // Use a valid default if data is empty or missing
    const safeData = data && data.length > 0 ? data : [{ color: '#e5e7eb', percentage: 100 }];

    let accumulatedPercentage = 0;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Background Track */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#F3F4F6" // gray-100/200 approximation
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />

                    {safeData.map((item, index) => {
                        const targetLength = (circumference * item.percentage) / 100;
                        const finalOffset = -1 * (circumference * accumulatedPercentage) / 100;

                        accumulatedPercentage += item.percentage;

                        // Create animated props for each segment
                        // Note: To make them "grow" around the ring, we can simply animate the strokeDasharray
                        // from [0, circumference] to [targetLength, circumference].

                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        const animatedProps = useAnimatedProps(() => {
                            const currentLength = targetLength * progress.value;
                            return {
                                strokeDasharray: [currentLength, circumference],
                                // DashOffset remains constant for position, but we need to ensure they start at the right place.
                                strokeDashoffset: finalOffset,
                            };
                        });

                        return (
                            <AnimatedCircle
                                key={index}
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                animatedProps={animatedProps}
                                strokeLinecap="round"
                                fill="transparent"
                            />
                        );
                    })}
                </G>
            </Svg>

            {/* Center Content */}
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                <Animated.Text
                    style={{
                        fontFamily: 'Inter_700Bold',
                        fontSize: 14,
                        color: '#9ca3af',
                        letterSpacing: 2,
                        textTransform: 'uppercase'
                    }}
                >
                    MIX
                </Animated.Text>
            </View>
        </View>
    );
};
