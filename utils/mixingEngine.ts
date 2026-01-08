import { Pigment, UNIVERSAL_PALETTE } from "@/constants/Pigments";
import { rgbToHex } from "./colorUtils";

export interface MixResult {
    closestColor: string; // Hex
    recipe: string;
    distance: number; // Lower is better
}

// Weighted Euclidean Distance
// Approximates human vision better than standard Euclidean
// Formula: 2*dR^2 + 4*dG^2 + 3*dB^2
const weightedColorDistance = (c1: { r: number, g: number, b: number }, c2: { r: number, g: number, b: number }) => {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
};

// Common mixing ratios artists use (Part A : Part B)
// 1:1, 2:1, 3:1, 4:1, 5:1, 10:1 (and inverses)
const RATIOS = [1, 2, 3, 4, 5, 10];

export const calculateMix = (targetRgb: { r: number; g: number; b: number }, palette: Pigment[] = UNIVERSAL_PALETTE): MixResult => {
    let bestMix: MixResult = {
        closestColor: '#000000',
        recipe: 'Analyzing...',
        distance: Infinity, // This will store the pure Color Distance
        // We track 'score' internally for sorting but don't need to export it
    };

    let bestScore = Infinity;

    // Helper to update best mix if better
    const checkMix = (rgb: { r: number, g: number, b: number }, recipe: string) => {
        const d = weightedColorDistance(targetRgb, rgb);
        // We prefer simpler recipes if distances are very close (within 5 units)
        // This acts as a tie-breaker for Occam's Razor
        const complexityPenalty = recipe.split('+').length; // Slight penalty for more paints
        const score = d + (complexityPenalty * 0.5);

        if (score < bestScore) {
            bestScore = score;
            bestMix = {
                closestColor: rgbToHex(rgb),
                recipe,
                distance: d // Store Pure Distance for UI Accuracy
            };
        }
    };

    // 1. Single Pigments
    for (const pigment of palette) {
        checkMix(pigment.rgb, `100% ${pigment.name}`);
    }

    // 2. Two-Color Mixes (Base Ratios)
    for (let i = 0; i < palette.length; i++) {
        for (let j = i + 1; j < palette.length; j++) {
            const p1 = palette[i];
            const p2 = palette[j];

            // Try all ratios
            for (const parts of RATIOS) {
                // Ratio: "parts" of P1 to 1 part of P2
                // Case A: More P1 (e.g., 3 parts P1 + 1 part P2)
                const totalA = parts + 1;
                const mixA = {
                    r: (p1.rgb.r * parts + p2.rgb.r) / totalA,
                    g: (p1.rgb.g * parts + p2.rgb.g) / totalA,
                    b: (p1.rgb.b * parts + p2.rgb.b) / totalA
                };
                const recipeA = parts === 1
                    ? `1 part ${p1.name} + 1 part ${p2.name}`
                    : `${parts} parts ${p1.name} + 1 part ${p2.name}`;
                checkMix(mixA, recipeA);

                // Case B: More P2 (e.g., 1 part P1 + 3 parts P2)
                if (parts > 1) { // 1:1 already covered
                    const totalB = 1 + parts;
                    const mixB = {
                        r: (p1.rgb.r + p2.rgb.r * parts) / totalB,
                        g: (p1.rgb.g + p2.rgb.g * parts) / totalB,
                        b: (p1.rgb.b + p2.rgb.b * parts) / totalB
                    };
                    const recipeB = `${parts} parts ${p2.name} + 1 part ${p1.name}`;
                    checkMix(mixB, recipeB);
                }
            }
        }
    }

    // 3. Tints & Shades (3-Color Mixes)
    // To optimization: Only add White or Black to the best simple mixes? 
    // Or iterate fully but limit 'Base' to 1:1 mixes to save time? 
    // Given N=12, P3 ~ 2 (White/Black), R ~ 5. Total iterations manageable.
    // Let's iterate adding White/Black to *every* single pigment first (simple tints).

    const whites = palette.filter(p => p.name.includes('White'));
    const blacks = palette.filter(p => p.name.includes('Black') || p.name.includes('Umber'));

    // 3a. Simple Tints (Color + White)
    for (const color of palette) {
        if (color.name.includes('White') || color.name.includes('Black')) continue;

        for (const white of whites) {
            for (const parts of RATIOS) {
                // More White (Tint)
                const total = parts + 1;
                const mix = {
                    r: (white.rgb.r * parts + color.rgb.r) / total,
                    g: (white.rgb.g * parts + color.rgb.g) / total,
                    b: (white.rgb.b * parts + color.rgb.b) / total
                };
                checkMix(mix, `${parts} parts ${white.name} + 1 part ${color.name}`);
            }
        }

        // Simple Shades (Color + Black)
        for (const black of blacks) {
            for (const parts of RATIOS) {
                // More Mix Color usually, less black? Or heavy black?
                // Let's try adding Small amount of Black to Color (Shade)
                // 1 part Black + X parts Color
                const total = 1 + parts;
                const mix = {
                    r: (black.rgb.r + color.rgb.r * parts) / total,
                    g: (black.rgb.g + color.rgb.g * parts) / total,
                    b: (black.rgb.b + color.rgb.b * parts) / total
                };
                checkMix(mix, `${parts} parts ${color.name} + 1 part ${black.name}`);
            }
        }
    }

    // 3b. Complex Tints (2 Colors + White)
    // Only running this if we haven't found a "good enough" match (< 15 distance) to save FPS?
    // Or restrict to 1:1 base mixes.
    if (bestMix.distance > 10) {
        for (let i = 0; i < palette.length; i++) {
            for (let j = i + 1; j < palette.length; j++) {
                const p1 = palette[i];
                const p2 = palette[j];
                // Skip if one is white/black (handled in 3a)
                if (p1.name.includes('White') || p2.name.includes('White')) continue;
                if (p1.name.includes('Black') || p2.name.includes('Black')) continue;

                // Base: 1 part P1 + 1 part P2 (Average)
                const baseRgb = {
                    r: (p1.rgb.r + p2.rgb.r) / 2,
                    g: (p1.rgb.g + p2.rgb.g) / 2,
                    b: (p1.rgb.b + p2.rgb.b) / 2
                };

                for (const white of whites) {
                    for (const parts of [1, 2, 3, 5]) { // Reduced ratios for speed
                        // 1 part Base + X parts White
                        const total = 1 + parts;
                        const mix = {
                            r: (baseRgb.r + white.rgb.r * parts) / total,
                            g: (baseRgb.g + white.rgb.g * parts) / total,
                            b: (baseRgb.b + white.rgb.b * parts) / total
                        };
                        // "1 part A + 1 part B + 2 parts White" (Simplified string)
                        checkMix(mix, `${parts} parts ${white.name} + 1 part ${p1.name} + 1 part ${p2.name}`);
                    }
                }
            }
        }
    }

    return bestMix;
};
