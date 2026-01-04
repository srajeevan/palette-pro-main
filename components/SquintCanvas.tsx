import { useProjectStore } from '@/store/useProjectStore';
import { Blur, Canvas, Image, useImage, Group, Paint } from '@shopify/react-native-skia';
import React, { forwardRef } from 'react';
import { Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Generous canvas sizing for squint view
const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.6;

interface SquintCanvasProps {
    blurIntensity: number;
}

export const SquintCanvas = forwardRef<any, SquintCanvasProps>(({ blurIntensity }, ref) => {
    const { imageUri } = useProjectStore();
    const skiaImage = useImage(imageUri || '');

    if (!imageUri || !skiaImage) {
        return (
            <View
                style={{
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    backgroundColor: '#fafaf9',
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
    const scale = Math.min(CANVAS_WIDTH / imgW, CANVAS_HEIGHT / imgH);
    const displayW = imgW * scale;
    const displayH = imgH * scale;
    const x = (CANVAS_WIDTH - displayW) / 2;
    const y = (CANVAS_HEIGHT - displayH) / 2;

    return (
        <View
            style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: '#f5f5f4',
                borderRadius: 12,
                overflow: 'hidden'
            }}
        >
            <Canvas
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
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
