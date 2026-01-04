import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface PaintTubeRowProps {
    color: string;
    percentage: number;
    name: string;
}

const PaintTubeIcon = ({ color }: { color: string }) => {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            {/* Tube Body - slightly tapered rectangle */}
            <Path
                d="M6 8 L18 8 L16 20 L8 20 Z"
                fill={color}
                stroke="#d1d5db"
                strokeWidth={1}
            />
            {/* Tube Cap - Gray rectangle on top */}
            <Rect
                x="9"
                y="4"
                width="6"
                height="4"
                fill="#4b5563"
                rx={1}
            />
            {/* Optional: A small "shine" or highlight */}
            <Path d="M8 9 L10 18" stroke="white" strokeOpacity={0.3} strokeWidth={2} />
        </Svg>
    );
};

export const PaintTubeRow = ({ color, percentage, name }: PaintTubeRowProps) => {
    return (
        <View className="flex-row items-center mb-4">
            {/* Icon Container */}
            <View className="mr-3">
                <PaintTubeIcon color={color} />
            </View>

            {/* Text Info */}
            <View className="flex-row items-baseline flex-1">
                <Text className="text-lg text-stone-900 w-14" style={{ fontFamily: 'Inter_700Bold' }}>
                    {percentage}%
                </Text>
                <Text className="text-base text-stone-600 flex-1 flex-wrap" numberOfLines={2} style={{ fontFamily: 'Inter_400Regular' }}>
                    {name}
                </Text>
            </View>
        </View>
    );
};
