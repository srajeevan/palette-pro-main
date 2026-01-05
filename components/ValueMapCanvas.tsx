import { useProjectStore } from '@/store/useProjectStore';
import { Canvas, ColorMatrix, Group, Image, Paint, useImage } from '@shopify/react-native-skia';
import React, { forwardRef, useMemo } from 'react';
import { Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_WIDTH = SCREEN_WIDTH;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.5;

interface ValueMapCanvasProps {
    grayscaleEnabled: boolean;
    posterizeLevels: number;
    width?: number;
    height?: number;
}

export const ValueMapCanvas = forwardRef<any, ValueMapCanvasProps>(
    ({ grayscaleEnabled, posterizeLevels, width, height }, ref) => {
        const { imageUri } = useProjectStore();
        const skiaImage = useImage(imageUri || '');

        const C_W = width || DEFAULT_WIDTH;
        const C_H = height || DEFAULT_HEIGHT;

        // Grayscale color matrix
        const grayscaleMatrix = useMemo(() => {
            if (!grayscaleEnabled) return null;
            return [
                0.2126, 0.7152, 0.0722, 0, 0, // Red channel
                0.2126, 0.7152, 0.0722, 0, 0, // Green channel
                0.2126, 0.7152, 0.0722, 0, 0, // Blue channel
                0, 0, 0, 1, 0, // Alpha channel
            ];
        }, [grayscaleEnabled]);

        // Posterization effect using contrast and brightness adjustments
        // This creates a tonal reduction effect
        const posterizeEffect = useMemo(() => {
            if (posterizeLevels <= 1) return 1;
            return posterizeLevels;
        }, [posterizeLevels]);

        // Create posterization matrix BEFORE early return to maintain hooks order
        // Approximates posterization by amplifying contrast
        const combinedMatrix = useMemo(() => {
            if (!grayscaleMatrix && posterizeEffect === 1) {
                return null;
            }

            if (grayscaleMatrix && posterizeEffect > 1) {
                // Combine grayscale with contrast boost for posterization effect
                const contrast = 1 + (posterizeEffect / 12) * 1.5; // Reduced multiplier from 2 to 1.5
                const translate = (1 - contrast) / 2 * 255;

                return [
                    0.2126 * contrast, 0.7152 * contrast, 0.0722 * contrast, 0, translate,
                    0.2126 * contrast, 0.7152 * contrast, 0.0722 * contrast, 0, translate,
                    0.2126 * contrast, 0.7152 * contrast, 0.0722 * contrast, 0, translate,
                    0, 0, 0, 1, 0,
                ];
            }

            if (grayscaleMatrix) {
                return grayscaleMatrix;
            }

            if (posterizeEffect > 1) {
                // Just posterization (contrast boost)
                const contrast = 1 + (posterizeEffect / 12) * 1.5; // Reduced multiplier
                const translate = (1 - contrast) / 2 * 255;

                return [
                    contrast, 0, 0, 0, translate,
                    0, contrast, 0, 0, translate,
                    0, 0, contrast, 0, translate,
                    0, 0, 0, 1, 0,
                ];
            }

            return null;
        }, [grayscaleMatrix, posterizeEffect]);

        if (!imageUri || !skiaImage) {
            return (
                <View
                    style={{
                        width: C_W,
                        height: C_H,
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
                    backgroundColor: '#f5f5f4',
                    borderRadius: 12,
                    overflow: 'hidden'
                }}
            >
                <Canvas style={{ width: C_W, height: C_H }}>
                    {combinedMatrix ? (
                        <Group
                            layer={
                                <Paint>
                                    <ColorMatrix matrix={combinedMatrix} />
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
                    ) : (
                        <Image
                            image={skiaImage}
                            x={x}
                            y={y}
                            width={displayW}
                            height={displayH}
                            fit="contain"
                        />
                    )}
                </Canvas>
            </View>
        );
    }
);
