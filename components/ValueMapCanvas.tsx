
import { useProjectStore } from '@/store/useProjectStore';
import { Canvas, ColorMatrix, Group, Image, Paint, useImage } from '@shopify/react-native-skia';
import React, { forwardRef, useMemo } from 'react';
import { Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_WIDTH = SCREEN_WIDTH;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.5;

interface ValueMapCanvasProps {
    grayscaleEnabled: boolean;
    temperatureEnabled: boolean;
    width?: number;
    height?: number;
}

export const ValueMapCanvas = forwardRef<any, ValueMapCanvasProps>(
    ({ grayscaleEnabled, temperatureEnabled, width, height }, ref) => {
        const { imageUri } = useProjectStore();
        const skiaImage = useImage(imageUri || '');

        const C_W = width || DEFAULT_WIDTH;
        const C_H = height || DEFAULT_HEIGHT;

        // Grayscale Matrix
        const grayscaleMatrix = useMemo(() => {
            if (!grayscaleEnabled) return null;
            return [
                0.2126, 0.7152, 0.0722, 0, 0,
                0.2126, 0.7152, 0.0722, 0, 0,
                0.2126, 0.7152, 0.0722, 0, 0,
                0, 0, 0, 1, 0,
            ];
        }, [grayscaleEnabled]);

        // Temperature Map Matrix (Fallback to ColorMatrix)
        // Since Shaders are unstable on this device, we use a Channel Difference Matrix.
        // Concept: 
        // Red Channel = Red - Blue (Shows Warmth)
        // Blue Channel = Blue - Red (Shows Coolness)
        // Green Channel = Dampened for contrast
        const temperatureMatrix = useMemo(() => {
            if (!temperatureEnabled) return null;
            return [
                2.0, 0, -1.0, 0, 0,  // R' = 2R - B (Boost Warmth)
                0, 0.5, 0, 0, 0,     // G' = 0.5G (Keep some luminance)
                -1.0, 0, 2.0, 0, 0,  // B' = 2B - R (Boost Coolness)
                0, 0, 0, 1, 0        // A' = A
            ];
        }, [temperatureEnabled]);

        // Calculate layout for render (fit image within canvas)
        let imgW = 0, imgH = 0, scale = 1, displayW = 0, displayH = 0, x = 0, y = 0;

        if (skiaImage) {
            imgW = skiaImage.width();
            imgH = skiaImage.height();
            scale = Math.min(C_W / imgW, C_H / imgH);
            displayW = imgW * scale;
            displayH = imgH * scale;
            x = (C_W - displayW) / 2;
            y = (C_H - displayH) / 2;
        }

        if (!imageUri || !skiaImage) {
            return (
                <View
                    style={{
                        width: C_W,
                        height: C_H,
                        backgroundColor: '#1C1C1E',
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                />
            );
        }

        return (
            <View
                style={{
                    width: C_W,
                    height: C_H,
                    backgroundColor: '#1C1C1E', // Dark background
                    borderRadius: 12,
                    overflow: 'hidden'
                }}
            >
                <Canvas style={{ width: C_W, height: C_H }}>
                    {/* Position the drawing group */}
                    <Group
                        transform={[
                            { translateX: x },
                            { translateY: y },
                            { scale: scale }
                        ]}
                    >
                        {/* 
                            Layering:
                            We apply composed filters via nested Groups/Paints or sequenced logic.
                            Since we have two matrices (Grayscale and Temperature), we can't easily chain them
                            in a single ColorMatrix prop (unless we multiply them).
                            Nesting Groups is the safest declarative way.
                        */}

                        {/* Layer 1: Grayscale (Inner) */}
                        <Group layer={
                            <Paint>
                                {grayscaleMatrix && <ColorMatrix matrix={grayscaleMatrix} />}
                            </Paint>
                        }>
                            {/* Layer 2: Temperature (Outer) */}
                            {/* Note: Temperature usually wants color info, so maybe it should apply first? 
                                Actually, if we grayscale first, R=G=B, so R-B = 0.
                                Temperature Map needs COLOR data. 
                                So Temperature must apply FIRST (Inner), or be mutually exclusive?
                                The UI allows both. If both ON, grayscale of a heatmap?
                                Let's nest Temperature INSIDE Grayscale.
                            */}

                            <Group layer={
                                <Paint>
                                    {temperatureMatrix && <ColorMatrix matrix={temperatureMatrix} />}
                                </Paint>
                            }>
                                <Image
                                    image={skiaImage}
                                    x={0}
                                    y={0}
                                    width={imgW}
                                    height={imgH}
                                    fit="none"
                                />
                            </Group>
                        </Group>
                    </Group>
                </Canvas>
            </View>
        );
    }
);
