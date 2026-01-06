import { useProjectStore } from '@/store/useProjectStore';
import { Canvas, Image, useCanvasRef, useImage } from '@shopify/react-native-skia';
import React, { forwardRef, useImperativeHandle } from 'react';
import { ActivityIndicator, Dimensions, PixelRatio, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.55;

export interface ColorSkiaCanvasRef {
    getPixelColor: (x: number, y: number) => { r: number, g: number, b: number } | null;
    getImageSnapshot: () => import("@shopify/react-native-skia").SkImage | null;
}

interface ColorSkiaCanvasProps {
    width?: number;
    height?: number;
    onImageLoaded?: () => void;
}

export const ColorSkiaCanvas = forwardRef<ColorSkiaCanvasRef, ColorSkiaCanvasProps>((props, ref) => {
    const { width = CANVAS_WIDTH, height = CANVAS_HEIGHT, onImageLoaded } = props;
    const { imageUri } = useProjectStore();
    const skiaImage = useImage(imageUri || '');
    const internalCanvasRef = useCanvasRef();

    React.useEffect(() => {
        if (skiaImage && onImageLoaded) {
            onImageLoaded();
        }
    }, [skiaImage]);

    useImperativeHandle(ref, () => ({
        getImageSnapshot: () => {
            // Note: Returning the *original* loaded image is better for palette generation than the canvas snapshot
            // because canvas snapshot includes whitespace/letterboxing if the aspect ratio differs!
            // We want the pure source image colors.
            return skiaImage || null;

            // Alternative: If we specifically WANT the canvas snapshot (what is seen):
            // return internalCanvasRef.current?.makeImageSnapshot() || null;
        },
        getPixelColor: (x: number, y: number) => {
            if (!skiaImage || !internalCanvasRef.current) return null;

            // 1. Calculate Layout Metrics
            const imgW = skiaImage.width();
            const imgH = skiaImage.height();
            const C_W = props.width || CANVAS_WIDTH;
            const C_H = props.height || CANVAS_HEIGHT;
            const scale = Math.min(C_W / imgW, C_H / imgH);
            const displayW = imgW * scale;
            const displayH = imgH * scale;
            const offsetX = (C_W - displayW) / 2;
            const offsetY = (C_H - displayH) / 2;

            // 2. Check Bounds
            if (x < offsetX || x > offsetX + displayW || y < offsetY || y > offsetY + displayH) {
                return null;
            }

            // 3. Read Pixel from Canvas Snapshot
            const snapshot = internalCanvasRef.current.makeImageSnapshot();
            if (snapshot) {
                // Skia Snapshot is in Physical Pixels on Retina screens
                // We must scale logical 'x, y' to physical coordinates
                const density = PixelRatio.get();
                const physicalX = Math.round(x * density);
                const physicalY = Math.round(y * density);

                // Ensure we don't go out of bounds
                if (physicalX < 0 || physicalX >= snapshot.width() || physicalY < 0 || physicalY >= snapshot.height()) {
                    return null;
                }

                const pixels = snapshot.readPixels(physicalX, physicalY, {
                    width: 1,
                    height: 1,
                    colorType: 4, // 4 = generic 8888 (usually rgba or bgra depending on platform)
                    alphaType: 1, // 1 = premul
                });

                if (pixels && pixels.length >= 3) {
                    return { r: pixels[0], g: pixels[1], b: pixels[2] };
                }
            }
            return null;
        }
    }));

    if (!imageUri || !skiaImage) {
        return (
            <View
                style={{ width: props.width || CANVAS_WIDTH, height: props.height || CANVAS_HEIGHT }}
                className="justify-center items-center bg-[#1C1C1E]"
            >
                <ActivityIndicator size="large" color="#A1A1AA" />
            </View>
        );
    }

    // Calculate layout for render
    const imgW = skiaImage.width();
    const imgH = skiaImage.height();
    const C_W = props.width || CANVAS_WIDTH;
    const C_H = props.height || CANVAS_HEIGHT;
    const scale = Math.min(C_W / imgW, C_H / imgH);
    const displayW = imgW * scale;
    const displayH = imgH * scale;
    const x = (C_W - displayW) / 2;
    const y = (C_H - displayH) / 2;

    return (
        <View style={{ width: C_W, height: C_H }} className="overflow-hidden relative">
            <Canvas
                ref={internalCanvasRef}
                style={{ width: C_W, height: C_H }}
            >
                {skiaImage && (
                    <Image
                        image={skiaImage}
                        fit="contain" // Changed from cover to contain to show full image
                        x={0}
                        y={0}
                        width={C_W}
                        height={C_H}
                    />
                )}
            </Canvas>
        </View>
    );
});
