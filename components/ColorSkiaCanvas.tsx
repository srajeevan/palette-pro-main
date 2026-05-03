import { useProjectStore } from '@/store/useProjectStore';
import { Skia, SkImage } from '@shopify/react-native-skia';
import { Image as ExpoImage } from 'expo-image';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Dimensions, View } from 'react-native';
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

    const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 1;
    const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 1;

    // Skia image loaded in background — used only for pixel reading and palette generation.
    // NOT used for display. ExpoImage handles display with native P3 color fidelity.
    const [skiaImage, setSkiaImage] = useState<SkImage | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    React.useEffect(() => {
        if (!imageUri) return;

        console.log('🎨 ColorSkiaCanvas - Starting manual load for:', imageUri);
        setHasError(false);
        setErrorMessage('');
        setSkiaImage(null);

        const load = async () => {
            try {
                console.log('🎨 ColorSkiaCanvas - Fetching bytes...');
                const response = await fetch(imageUri);
                if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

                const buffer = await response.arrayBuffer();
                console.log('🎨 ColorSkiaCanvas - Buffer received:', buffer.byteLength);

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

            const imgW = skiaImage.width();
            const imgH = skiaImage.height();
            const C_W = width;
            const C_H = height;
            const scale = Math.min(C_W / imgW, C_H / imgH);
            const displayW = imgW * scale;
            const displayH = imgH * scale;
            const offsetX = (C_W - displayW) / 2;
            const offsetY = (C_H - displayH) / 2;

            if (x < offsetX || x > offsetX + displayW || y < offsetY || y > offsetY + displayH) {
                return null;
            }

            const srcX = Math.round(((x - offsetX) / displayW) * imgW);
            const srcY = Math.round(((y - offsetY) / displayH) * imgH);

            if (srcX < 0 || srcX >= imgW || srcY < 0 || srcY >= imgH) {
                return null;
            }

            try {
                const pixelData = skiaImage.readPixels(srcX, srcY, {
                    width: 1,
                    height: 1,
                    colorType: 4,
                    alphaType: 1,
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

    if (hasError) {
        return (
            <View
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

    if (!imageUri) {
        return (
            <View
                style={{ width, height }}
                className="justify-center items-center bg-[#1C1C1E]"
            >
                <ActivityIndicator size="large" color="#A1A1AA" />
                <AppText className="text-stone-500 mt-4 text-xs font-medium">Rendering...</AppText>
            </View>
        );
    }

    return (
        <View style={{ width, height }} className="overflow-hidden relative">
            <ExpoImage
                source={{ uri: imageUri }}
                style={{ width, height }}
                contentFit="contain"
                cachePolicy="memory-disk"
            />
            {/* Loading overlay while Skia image is decoding in background */}
            {!skiaImage && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} className="justify-center items-center">
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                </View>
            )}
        </View>
    );
});
