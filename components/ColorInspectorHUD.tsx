import { AppText } from '@/components/AppText';
import { MixResult } from '@/utils/mixingEngine';
import { Save } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface ColorInspectorHUDProps {
    color: string; // Hex
    rgb: { r: number; g: number; b: number };
    mix: MixResult;
}

export const ColorInspectorHUD = ({ color, rgb, mix }: ColorInspectorHUDProps) => {
    // Shared value for background color animation
    // Reanimated doens't support interpolating string colors in shared values easily without processColor
    // But we can just use the prop directly in style or useAnimatedProps if we needed high perf 
    // For now, React update is likely fast enough for the HUD background, or we use a simple style.
    // Actually, let's use a specialized animated view for smooth color transition if possible.

    // Simplest approach for "smoothness" is to let the parent drive 60fps updates, 
    // but React re-renders might be slow for drag.
    // Ideally we pass SharedValues to this component, but the Mixing Engine is JS based.
    // So we are bound to JS thread speed anyway. We will rely on fast React updates.

    return (
        <View className="absolute bottom-24 left-4 right-4 bg-white/95 rounded-3xl p-5 shadow-xl border border-stone-200 backdrop-blur-md">
            <View className="flex-row items-center space-x-4">
                {/* Large Color Swatch */}
                <View
                    style={{ backgroundColor: color }}
                    className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
                />

                {/* Info Column */}
                <View className="flex-1">
                    <AppText className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">
                        Picked Color
                    </AppText>
                    <View className="flex-row items-baseline space-x-2">
                        <AppText className="text-2xl font-black text-stone-800 tabular-nums">
                            {color.toUpperCase()}
                        </AppText>
                    </View>
                    <AppText className="text-xs text-stone-500 font-medium tabular-nums">
                        R:{rgb.r} G:{rgb.g} B:{rgb.b}
                    </AppText>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    className="w-12 h-12 bg-stone-100 rounded-full items-center justify-center border border-stone-200 active:bg-stone-200"
                    onPress={() => console.log('Save color triggered')}
                >
                    <Save size={20} color="#57534e" />
                </TouchableOpacity>
            </View>

            {/* Mixing Recipe Section */}
            <View className="mt-4 pt-4 border-t border-stone-100">
                <View className="flex-row justify-between items-center mb-2">
                    <AppText className="text-xs text-stone-400 font-bold uppercase tracking-widest">
                        Oil Mix Recipe
                    </AppText>
                    {/* Visual confidence or distance indicator could go here */}
                    {mix.distance < 10 && (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full">
                            <AppText className="text-[10px] text-green-700 font-bold">EXACT MATCH</AppText>
                        </View>
                    )}
                </View>

                <AppText className="text-stone-700 font-medium text-base leading-snug">
                    {mix.recipe}
                </AppText>

                <AppText className="text-stone-400 text-xs mt-1">
                    Closest pigment: {mix.closestColor}
                </AppText>
            </View>
        </View>
    );
};
