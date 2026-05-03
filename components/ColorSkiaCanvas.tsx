import { useProjectStore } from '@/store/useProjectStore';
import { Canvas, Image, Skia, SkImage } from '@shopify/react-native-skia';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, LayoutChangeEvent, View } from 'react-native';
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
    const { width: rawWidth = CANVAS_WIDTH, height: rawHeight = CANVAS_HEIGHT, onImageLoaded } = props;
    const { imageUri } = useProjectStore();

    // Guard: Metal will SIGABRT if texture dimensions are 0, negative, or NaN.
    const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 1;
    const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 1;

    // Defer <Canvas> mount until the wrapper View has been laid out natively.
    // JS props may be valid numbers, but the native view may not have dimensions yet.
    // If Skia's RNSkOffscreenCanvasProvider reads 0 from the native layout,
    // Metal receives UINT64_MAX and SIGABRT.
    const [nativeLayoutReady, setNativeLayoutReady] = useState(false);
    const handleLayout = React.useCallback((e: LayoutChangeEvent) => {
        const { width: lw, height: lh } = e.nativeEvent.layout;
        if (lw > 0 && lh > 0) {
            setNativeLayoutReady(true);
        }
    }, []);

    // Manual Image Loading State
    const [skiaImage, setSkiaImage] = useState<SkImage | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const internalCanvasRef = useRef<any>(null);

    React.useEffect(() => {
        if (!imageUri) return;

        console.log('🎨 ColorSkiaCanvas - Starting manual load for:', imageUri);
        setHasError(false);
        setErrorMessage('');
        setSkiaImage(null); // Reset previous image — unmounts Canvas
        // Note: do NOT reset nativeLayoutReady here. onLayout only fires when
        // dimensions change, not on re-render. The layout was already validated
        // on first mount — resetting it would cause the component to get stuck
        // waiting for an onLayout that never fires.

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
            if (!skiaImage) return null;

            // 1. Calculate Layout Metrics
            const imgW = skiaImage.width();
            const imgH = skiaImage.height();
            const C_W = width;
            const C_H = height;
            const scale = Math.min(C_W / imgW, C_H / imgH);
            const displayW = imgW * scale;
            const displayH = imgH * scale;
            const offsetX = (C_W - displayW) / 2;
            const offsetY = (C_H - displayH) / 2;

            // 2. Check Bounds
            if (x < offsetX || x > offsetX + displayW || y < offsetY || y > offsetY + displayH) {
                return null;
            }

            // 3. Read pixel directly from the source SkImage.
            //    Previously this used makeImageSnapshot() on the Canvas, which
            //    creates an offscreen Metal surface — if the Canvas view has
            //    invalid native dimensions (0 or uninitialised), Metal receives
            //    UINT64_MAX and triggers a SIGABRT that JS cannot catch.
            //    Reading from the SkImage itself avoids Metal entirely.
            const srcX = Math.round(((x - offsetX) / displayW) * imgW);
            const srcY = Math.round(((y - offsetY) / displayH) * imgH);

            if (srcX < 0 || srcX >= imgW || srcY < 0 || srcY >= imgH) {
                return null;
            }

            try {
                const pixelData = skiaImage.readPixels(srcX, srcY, {
                    width: 1,
                    height: 1,
                    colorType: 4, // RGBA 8888
                    alphaType: 1, // premul
                } as any);
                const pixels = pixelData ? new Uint8Array(pixelData.buffer ?? pixelData) : null;
                if (!pixels || pixels.length < 3) return null;

                if (pixels[3] !== 0 || pixels[0] !== 0) {
                    return { r: pixels[0], g: pixels[1], b: pixels[2] };
                }
            } catch {
                return null;
            }
            return null;
        }
    }), [skiaImage, width, height]);

    // Gate Canvas mount on native layout only — NOT on skiaImage.
    // Once mounted, the Canvas stays mounted and we swap the <Image> inside it.
    // This avoids destroying/recreating Metal textures on every image change,
    // which is what triggers the SIGABRT when the new Canvas view hasn't been
    // laid out yet by the native layout system.
    const canMountCanvas = nativeLayoutReady && width > 1 && height > 1;

    if (hasError) {
        return (
            <View
                onLayout={handleLayout}
                style={{ width, height }}
                className="justify-center items-center bg-[#1C1C1E] p-4"
            >
                <ActivityIndicator size="small" color="#EF4444" />
                <AppText className="text-red-500 mt-2 text-xs text-center">
                    Load Error: {errorMessage}
                </AppText>
            </View>
        );
    }

    if (!canMountCanvas) {
        return (
            <View
                onLayout={handleLayout}
                style={{ width, height }}
                className="justify-center items-center bg-[#1C1C1E]"
            >
                <ActivityIndicator size="large" color="#A1A1AA" />
                <AppText className="text-stone-500 mt-4 text-xs font-medium">Rendering...</AppText>
            </View>
        );
    }

    return (
        <View onLayout={handleLayout} style={{ width, height }} className="overflow-hidden relative">
            {/* Loading overlay while image is decoding */}
            {(!imageUri || !skiaImage) && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} className="justify-center items-center bg-[#1C1C1E]">
                    <ActivityIndicator size="large" color="#A1A1AA" />
                    <AppText className="text-stone-500 mt-4 text-xs font-medium">Rendering...</AppText>
                </View>
            )}
            <Canvas
                ref={internalCanvasRef}
                style={{ width, height }}
            >
                {skiaImage && (
                    <Image
                        image={skiaImage}
                        fit="contain"
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                    />
                )}
            </Canvas>
        </View>
    );
});
