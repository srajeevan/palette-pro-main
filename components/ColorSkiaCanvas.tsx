import { useProjectStore } from '@/store/useProjectStore';
import { Canvas, Image, Skia, SkImage, useCanvasRef } from '@shopify/react-native-skia';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Dimensions, PixelRatio, View } from 'react-native';
import { AppText } from './AppText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CANVAS_WIDTH = SCREEN_WIDTH;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.55;

export interface ColorSkiaCanvasRef {
    getPixelColor: (x: number, y: number) => { r: number, g: number, b: number } | null;
    getImageSnapshot: () => SkImage | null;
}

interface ColorSkiaCanvasProps {
    width?: number;
    height?: number;
    onImageLoaded?: () => void;
}

export const ColorSkiaCanvas = forwardRef<ColorSkiaCanvasRef, ColorSkiaCanvasProps>((props, ref) => {
    const { width = CANVAS_WIDTH, height = CANVAS_HEIGHT, onImageLoaded } = props;
    const { imageUri } = useProjectStore();

    // Manual Image Loading State
    const [skiaImage, setSkiaImage] = useState<SkImage | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const internalCanvasRef = useCanvasRef();

    React.useEffect(() => {
        if (!imageUri) return;

        console.log('🎨 ColorSkiaCanvas - Starting manual load for:', imageUri);
        setHasError(false);
        setErrorMessage('');
        setSkiaImage(null); // Reset previous image

        const load = async () => {
            try {
                // 1. Fetch Bytes
                console.log('🎨 ColorSkiaCanvas - Fetching bytes...');
                const response = await fetch(imageUri);
                if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

                const buffer = await response.arrayBuffer();
                console.log('🎨 ColorSkiaCanvas - Buffer received:', buffer.byteLength);

                // 2. Decode with Skia
                const data = Skia.Data.fromBytes(new Uint8Array(buffer));
                const img = Skia.Image.MakeImageFromEncoded(data);

                if (img) {
                    console.log('✅ ColorSkiaCanvas - Decoded successfully!');
                    setSkiaImage(img);
                } else {
                    throw new Error("Skia returned null (Invalid Image Format?)");
                }
            } catch (e: any) {
                console.error('❌ ColorSkiaCanvas Error:', e);
                setHasError(true);
                setErrorMessage(e.message || "Unknown error");
            }
        };

        load();
    }, [imageUri]);

    React.useEffect(() => {
        if (skiaImage && onImageLoaded) {
            onImageLoaded();
        }
    }, [skiaImage]);

    useImperativeHandle(ref, () => ({
        getImageSnapshot: () => {
            return skiaImage || null;
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
                const density = PixelRatio.get();
                const physicalX = Math.round(x * density);
                const physicalY = Math.round(y * density);

                if (physicalX < 0 || physicalX >= snapshot.width() || physicalY < 0 || physicalY >= snapshot.height()) {
                    return null;
                }

                const pixels = new Uint8Array(4); // RGBA
                const success = snapshot.readPixels(physicalX, physicalY, {
                    width: 1,
                    height: 1,
                    colorType: 4,
                    alphaType: 1,
                }, pixels);

                if (pixels[3] !== 0 || pixels[0] !== 0) {
                    return { r: pixels[0], g: pixels[1], b: pixels[2] };
                }
            }
            return null;
        }
    }));

    if (hasError) {
        return (
            <View
                style={{ width: props.width || CANVAS_WIDTH, height: props.height || CANVAS_HEIGHT }}
                className="justify-center items-center bg-[#1C1C1E] p-4"
            >
                <ActivityIndicator size="small" color="#EF4444" />
                <AppText className="text-red-500 mt-2 text-xs text-center">
                    Load Error: {errorMessage}
                </AppText>
            </View>
        );
    }

    if (!imageUri || !skiaImage) {
        return (
            <View
                style={{ width: props.width || CANVAS_WIDTH, height: props.height || CANVAS_HEIGHT }}
                className="justify-center items-center bg-[#1C1C1E]"
            >
                <ActivityIndicator size="large" color="#A1A1AA" />
                <AppText className="text-stone-500 mt-4 text-xs font-medium">Rendering...</AppText>
            </View>
        );
    }

    // Calculate layout for render
    const imgW = skiaImage.width();
    const imgH = skiaImage.height();
    const C_W = props.width || CANVAS_WIDTH;
    const C_H = props.height || CANVAS_HEIGHT;

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
