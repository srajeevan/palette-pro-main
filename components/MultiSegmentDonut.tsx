import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
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

/** Individual segment component — hooks are called at the top level */
const DonutSegment = ({
    center,
    radius,
    strokeWidth,
    color,
    targetLength,
    circumference,
    offset,
    progress,
}: {
    center: number;
    radius: number;
    strokeWidth: number;
    color: string;
    targetLength: number;
    circumference: number;
    offset: number;
    progress: SharedValue<number>;
}) => {
    const animatedProps = useAnimatedProps(() => {
        const currentLength = targetLength * progress.value;
        return {
            strokeDasharray: [currentLength, circumference],
            strokeDashoffset: offset,
        };
    });

    return (
        <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="transparent"
        />
    );
};

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

    const safeData = data && data.length > 0 ? data : [{ color: '#e5e7eb', percentage: 100 }];

    // Pre-compute offsets
    const segments: { color: string; targetLength: number; offset: number }[] = [];
    let accumulated = 0;
    for (const item of safeData) {
        const targetLength = (circumference * item.percentage) / 100;
        const offset = -1 * (circumference * accumulated) / 100;
        segments.push({ color: item.color, targetLength, offset });
        accumulated += item.percentage;
    }

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Background Track */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#F3F4F6"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />

                    {segments.map((seg, index) => (
                        <DonutSegment
                            key={`${index}-${seg.color}`}
                            center={center}
                            radius={radius}
                            strokeWidth={strokeWidth}
                            color={seg.color}
                            targetLength={seg.targetLength}
                            circumference={circumference}
                            offset={seg.offset}
                            progress={progress}
                        />
                    ))}
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
