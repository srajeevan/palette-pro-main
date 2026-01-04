import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Canvas, Circle, Image, Rect, Text, useFont, useImage } from '@shopify/react-native-skia';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

// Dimensions for 4:5 Portrait (Instagram standard)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

interface ShareCardGeneratorProps {
    imageUri: string | null;
    colors: string[];
}

export interface ShareCardGeneratorRef {
    generate: () => Promise<string | null>;
}

export const ShareCardGenerator = forwardRef<ShareCardGeneratorRef, ShareCardGeneratorProps>(
    ({ imageUri, colors }, ref) => {
        const skiaImage = useImage(imageUri || undefined);

        // Load fonts using the module IDs from @expo-google-fonts
        const interFont = useFont(Inter_500Medium, 32);
        const playfairFont = useFont(PlayfairDisplay_700Bold, 48);
        const hexFont = useFont(Inter_400Regular, 24);

        const canvasRef = useRef<any>(null);

        useImperativeHandle(ref, () => ({
            generate: async () => {
                if (!canvasRef.current) return null;

                try {
                    // Slight delay to ensure render? Skia is usually synchronous once resources loaded.
                    // But `makeImageSnapshot` is the imperative way on the Skia Ref.
                    // However, react-native-skia imperative snapshot on <Canvas> ref:
                    const image = await canvasRef.current.makeImageSnapshot();
                    if (image) {
                        const base64 = image.encodeToBase64();
                        return `data:image/png;base64,${base64}`;
                    }
                } catch (e) {
                    console.error("Snapshot failed", e);
                }
                return null;
            }
        }));

        if (!skiaImage || !interFont || !playfairFont || !hexFont) {
            return null;
        }

        // Layout Calculations
        const imageSectionHeight = CANVAS_HEIGHT * 0.75;
        const footerHeight = CANVAS_HEIGHT * 0.25;

        // Image centering (Aspect Fill logic manually)
        const imgW = skiaImage.width();
        const imgH = skiaImage.height();
        const targetRatio = CANVAS_WIDTH / imageSectionHeight;
        const imgRatio = imgW / imgH;

        let drawW, drawH, drawX, drawY;

        if (imgRatio > targetRatio) {
            // Image is wider than target
            drawH = imageSectionHeight;
            drawW = drawH * imgRatio;
            drawY = 0;
            drawX = (CANVAS_WIDTH - drawW) / 2;
        } else {
            // Image is taller than target
            drawW = CANVAS_WIDTH;
            drawH = drawW / imgRatio;
            drawX = 0;
            drawY = (imageSectionHeight - drawH) / 2;
        }

        // Palette Layout
        const swatchSize = 120; // Big circles
        const gap = 40;
        const totalSwatchesW = (swatchSize * 5) + (gap * 4);
        const startX = (CANVAS_WIDTH - totalSwatchesW) / 2;
        const swatchY = imageSectionHeight + (footerHeight / 2) - (swatchSize / 2) - 40;

        return (
            <View style={styles.hiddenContainer} pointerEvents="none">
                <Canvas
                    ref={canvasRef}
                    style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                >
                    {/* Background */}
                    <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} color="#F9F7F1" />

                    {/* Image Section */}
                    {/* Clip to top 75% */}
                    <Rect x={0} y={0} width={CANVAS_WIDTH} height={imageSectionHeight} color="#E5E5E5" />

                    {/* We can use save/restore or clip to rect logic for the image */}
                    {/* Simpler: Draw image, then draw footer background over the bottom part if it overflows? 
                        Actually aspect fill might draw outside, so we should clip.
                    */}
                    {/* Clip Image Area */}
                    {/* NOTE: Skia's Group with clip is best. */}

                    {/* Draw Image */}
                    {/* Actually, let's just clip everything to the image rect */}
                    <Image
                        image={skiaImage}
                        x={drawX}
                        y={drawY}
                        width={drawW}
                        height={drawH}
                        fit="cover" // Logic handled mostly by manual calc above visually, but 'cover' prop not strictly on Image primitive in basic Skia? 
                    // It is on local Image component? No, primitive <Image> takes rect.
                    // Wait, <Image> primitive doesn't do "fit". <Image> component from Skia does? 
                    // Let's use the primitive render. Code above manual calcs simulate 'cover'.
                    />

                    {/* Footer Background (covers any image overflow at bottom) */}
                    <Rect x={0} y={imageSectionHeight} width={CANVAS_WIDTH} height={footerHeight} color="#F9F7F1" />

                    {/* Divider Line */}
                    <Rect x={40} y={imageSectionHeight} width={CANVAS_WIDTH - 80} height={2} color="#E5E5E5" />

                    {/* Swatches */}
                    {colors.slice(0, 5).map((color, index) => {
                        const x = startX + index * (swatchSize + gap);
                        return (
                            <React.Fragment key={index}>
                                {/* Shadow for swatch */}
                                <Circle cx={x + swatchSize / 2} cy={swatchY + swatchSize / 2 + 4} r={swatchSize / 2} color="rgba(0,0,0,0.1)" />
                                {/* Swatch */}
                                <Circle cx={x + swatchSize / 2} cy={swatchY + swatchSize / 2} r={swatchSize / 2} color={color} />

                                {/* Hex Code */}
                                <Text
                                    text={color.toUpperCase()}
                                    x={x + swatchSize / 2 - (hexFont.getTextWidth(color.toUpperCase()) / 2)}
                                    y={swatchY + swatchSize + 50}
                                    font={hexFont}
                                    color="#555"
                                />
                            </React.Fragment>
                        );
                    })}

                    {/* Logo / Branding */}
                    <Text
                        text="Palette Pro"
                        x={CANVAS_WIDTH / 2 - (playfairFont.getTextWidth("Palette Pro") / 2)}
                        y={CANVAS_HEIGHT - 60}
                        font={playfairFont}
                        color="#1A1A1A"
                    />
                </Canvas>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    hiddenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0, // Hidden visually but rendered
        width: 1, // Minimize impact on layout? No, canvas needs size.
        height: 1,
        overflow: 'hidden',
        zIndex: -100
    }
});
