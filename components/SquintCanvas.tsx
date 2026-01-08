import { useProjectStore } from '@/store/useProjectStore';
import { Blur, Canvas, Group, Image, Paint, useImage } from '@shopify/react-native-skia';
import React, { forwardRef } from 'react';
import { Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default sizing if not provided
const DEFAULT_WIDTH = SCREEN_WIDTH;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.5;

interface SquintCanvasProps {
    blurIntensity: number;
    width?: number;
    height?: number;
}

export const SquintCanvas = forwardRef<any, SquintCanvasProps>(({ blurIntensity, width, height }, ref) => {
    const { imageUri } = useProjectStore();
    const skiaImage = useImage(imageUri || '');

    const C_W = width || DEFAULT_WIDTH;
    const C_H = height || DEFAULT_HEIGHT;

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

    // Calculate layout for render (fit image within canvas)
    const imgW = skiaImage.width();
    const imgH = skiaImage.height();
    const scale = Math.min(C_W / imgW, C_H / imgH);
    const displayW = imgW * scale;
    const displayH = imgH * scale;
    const x = (C_W - displayW) / 2;
    const y = (C_H - displayH) / 2;

    return (
        <View
            style={{
                width: C_W,
                height: C_H,
                backgroundColor: '#1C1C1E',
                borderRadius: 12,
                overflow: 'hidden'
            }}
        >
            <Canvas
                style={{ width: C_W, height: C_H }}
            >
                {/* Image with Blur Filter */}
                <Group
                    layer={
                        <Paint>
                            <Blur blur={blurIntensity} />
                        </Paint>
                    }
                >
                    <Image
                        image={skiaImage}
                        x={x}
                        y={y}
                        width={displayW}
                        height={displayH}
                        fit="contain"
                    />
                </Group>
            </Canvas>
        </View>
    );
});
