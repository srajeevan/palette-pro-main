import { Pigment, UNIVERSAL_PALETTE } from "@/constants/Pigments";
import { rgbToHex } from "./colorUtils";

export interface MixResult {
    closestColor: string; // Hex
    recipe: string;
    distance: number; // Lower is better
}

// Simple Euclidean distance in RGB space
// In a production app, we would translate to LAB space for perceptual uniformity
const colorDistance = (c1: { r: number, g: number, b: number }, c2: { r: number, g: number, b: number }) => {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
};

export const calculateMix = (targetRgb: { r: number; g: number; b: number }, palette: Pigment[] = UNIVERSAL_PALETTE): MixResult => {
    let bestMix: MixResult = {
        closestColor: '#000000',
        recipe: 'Analyzing...',
        distance: Infinity
    };

    // 1. Check Single Pigments
    for (const pigment of palette) {
        const d = colorDistance(targetRgb, pigment.rgb);
        if (d < bestMix.distance) {
            bestMix = {
                closestColor: pigment.hex,
                recipe: `100% ${pigment.name}`,
                distance: d
            };
        }
    }

    // 2. Check Simple 50/50 Mixes (Iterate pairs)
    // Limitation: This is O(N^2), but N is small (12 pigments) -> 144 iterations, very fast.
    for (let i = 0; i < palette.length; i++) {
        for (let j = i + 1; j < palette.length; j++) {
            const p1 = palette[i];
            const p2 = palette[j];

            const mixedRgb = {
                r: (p1.rgb.r + p2.rgb.r) / 2,
                g: (p1.rgb.g + p2.rgb.g) / 2,
                b: (p1.rgb.b + p2.rgb.b) / 2
            };

            const d = colorDistance(targetRgb, mixedRgb);
            if (d < bestMix.distance) {
                bestMix = {
                    closestColor: rgbToHex(mixedRgb),
                    recipe: `50% ${p1.name} + 50% ${p2.name}`,
                    distance: d
                };
            }
        }
    }

    // 3. Tints (Adding White) - Very common in oil painting
    const white = palette.find(p => p.name === 'Titanium White');
    if (white) {
        for (const pigment of palette) {
            if (pigment.name === 'Titanium White') continue;

            // 75% White + 25% Color (High Key)
            const tintRgb = {
                r: (white.rgb.r * 3 + pigment.rgb.r) / 4,
                g: (white.rgb.g * 3 + pigment.rgb.g) / 4,
                b: (white.rgb.b * 3 + pigment.rgb.b) / 4
            };

            const d = colorDistance(targetRgb, tintRgb);
            if (d < bestMix.distance) {
                bestMix = {
                    closestColor: rgbToHex(tintRgb),
                    recipe: `75% White + 25% ${pigment.name}`,
                    distance: d
                };
            }
        }
    }

    return bestMix;
};
