/**
 * Kubelka-Munk Spectral Mixing Engine
 *
 * Replaces the old linear-RGB averaging with physically-accurate
 * subtractive pigment mixing using Kubelka-Munk theory.
 *
 * Pipeline:
 *   1. Single pigments — test all, return if ΔE₀₀ ≤ 2.0
 *   2. Two-pigment mixes — spectralMix2 at 5 ratio steps per pair
 *   3. Two-pigment tints/shades — color + white/dark modifier
 *   4. Three-pigment mixes — only if ΔE₀₀ > 5 (expensive)
 *   5. Tinting-strength–adjusted volume ratios for display
 *
 * Distance: CIEDE2000 (ΔE₀₀) — perceptually uniform
 * Score:    ΔE₀₀ + (N_ingredients × penalty)
 *   - Default penalty: 0.5 per ingredient (favors simpler recipes)
 *   - Reduced penalty: 0.15 when single-pigment match has wrong hue
 *     (favors accuracy for warm blacks, muted earths, light pastels)
 *
 * Performance: ~2,500–4,000 spectral ops (vs 29,000 unoptimized).
 * Prefiltering skips hue-incompatible pairs (bypassed when one
 * pigment is already close to target).
 */

import { Pigment, UNIVERSAL_PALETTE, getSpectral } from '@/constants/Pigments';
import { rgbToLab, deltaE00, Lab, labHue, labChroma, hueDifference } from './colorScience';
import { spectralMix, SpectralColor } from './spectralMixing';
import { rgbToHex } from './colorUtils';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MixResult {
    closestColor: string;   // Hex of the mixed result
    recipe: string;         // Human-readable recipe with CIN codes
    distance: number;       // ΔE₀₀ (0 = perfect, <2 imperceptible, <5 good)
    ingredients: RecipeIngredient[];
    reasoning: string | null; // Why this recipe was chosen (shown for single-pigment results)
}

export interface RecipeIngredient {
    name: string;
    cin: string;
    parts: number;          // Display parts (tinting-strength adjusted)
    hex: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SINGLE_PIGMENT_THRESHOLD = 2.0;
const BASE_COMPLEXITY_PENALTY = 0.5;

/**
 * Hue difference threshold (degrees) beyond which the complexity penalty
 * is reduced for multi-pigment recipes. This prevents a "close-ΔE but
 * wrong-hue" single pigment from winning over a better-hued 2-pigment mix.
 */
const HUE_MISMATCH_THRESHOLD = 15;

/** Minimum chroma for hue comparison to be meaningful (below this = achromatic). */
const ACHROMATIC_CHROMA = 2.0;

/** Two-pigment ratio steps — includes extremes for dominated mixes */
const TWO_RATIO_STEPS = [0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95];

/** Modifier fractions for tints/shades */
const MODIFIER_FRACTIONS = [0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95];

// ── Fast Pre-filter ────────────────────────────────────────────────────────

/**
 * Quick Euclidean distance in Lab space (no perceptual weighting).
 * Used only as a pre-filter to skip obviously wrong candidates.
 * Much cheaper than full ΔE₀₀.
 */
function fastLabDist(a: Lab, b: Lab): number {
    const dL = a.L - b.L;
    const da = a.a - b.a;
    const db = a.b - b.b;
    return dL * dL + da * da + db * db; // squared — no sqrt needed for comparison
}

// ── Helpers ────────────────────────────────────────────────────────────────

function factorsToDisplayParts(
    factors: number[],
    pigments: Pigment[],
): number[] {
    const rawVolumes = factors.map((f, i) => f / pigments[i].tintingStrength);
    const minVol = Math.min(...rawVolumes.filter(v => v > 0.001));
    if (minVol <= 0) return rawVolumes.map(() => 1);

    const normalized = rawVolumes.map(v => v / minVol);

    const multipliers = [1, 2, 4, 6, 10];
    for (const mult of multipliers) {
        const scaled = normalized.map(v => Math.round(v * mult));
        if (scaled.every(v => v >= 1 && v <= 20)) {
            const gcd = scaled.reduce(gcdFn);
            return scaled.map(v => v / gcd);
        }
    }

    return normalized.map(v => Math.max(1, Math.round(v)));
}

function gcdFn(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
}

function buildRecipeString(ingredients: RecipeIngredient[]): string {
    return ingredients
        .map(ing => {
            const partsStr = ing.parts === 1 ? '1 part' : `${ing.parts} parts`;
            return `${partsStr} ${ing.name} (${ing.cin})`;
        })
        .join(' + ');
}

function buildIngredients(
    pigments: Pigment[],
    factors: number[],
): RecipeIngredient[] {
    const parts = factorsToDisplayParts(factors, pigments);
    return pigments.map((p, i) => ({
        name: p.name,
        cin: p.cin,
        parts: parts[i],
        hex: p.hex,
    }));
}

// ── Reasoning Generator ───────────────────────────────────────────────────

/**
 * Generates a human-readable explanation for why a specific recipe was chosen.
 * Only produces non-null output for single-pigment results — multi-pigment
 * recipes are self-explanatory.
 */
function generateReasoning(
    targetLab: Lab,
    result: { ingredients: RecipeIngredient[]; distance: number },
    pigmentLab: Lab | null,
): string | null {
    if (result.ingredients.length !== 1 || !pigmentLab) return null;

    const pigment = result.ingredients[0];
    const targetL = targetLab.L;
    const targetC = labChroma(targetLab);
    const pigmentC = labChroma(pigmentLab);
    const dE = result.distance;

    // Very dark target — single pigment result means the engine's best
    // chromatic mix still landed on a single dark pigment (e.g. Payne's Gray).
    if (targetL < 5) {
        return `Very dark color. ${pigment.name} is the closest match at ΔE ${dE.toFixed(1)}.`;
    }

    // Near-white
    if (targetL > 95 && targetC < ACHROMATIC_CHROMA) {
        return `Near-pure white with minimal tint. ${pigment.name} alone achieves ΔE ${dE.toFixed(1)} — adding a second pigment would not improve the match.`;
    }

    // Saturated / chromatic — single pigment genuinely matches
    if (targetC > 20 && dE < 3) {
        return `This is a saturated color that closely matches ${pigment.name} (${pigment.cin}) straight from the tube — no mixing needed.`;
    }

    // Moderate chroma, good match
    if (dE <= SINGLE_PIGMENT_THRESHOLD) {
        return `${pigment.name} is a near-perfect match (ΔE ${dE.toFixed(1)} — imperceptible difference). Mixing additional pigments would not improve accuracy.`;
    }

    // Decent match, complexity penalty favored simplicity
    if (dE < 5) {
        const matchQuality = dE < 3 ? 'close' : 'reasonable';
        return `${pigment.name} provides a ${matchQuality} match (ΔE ${dE.toFixed(1)}). Multi-pigment mixes were tested but didn't improve enough to justify added complexity.`;
    }

    // Fallback — best we could do
    return `${pigment.name} is the closest available match (ΔE ${dE.toFixed(1)}). The target falls outside the range where mixing other pigments improves accuracy.`;
}

// ── Main Engine ────────────────────────────────────────────────────────────

export const calculateMix = (
    targetRgb: { r: number; g: number; b: number },
    palette: Pigment[] = UNIVERSAL_PALETTE,
): MixResult => {
    const targetLab = rgbToLab(targetRgb);
    const targetHue = labHue(targetLab);
    const targetChroma = labChroma(targetLab);
    const targetIsChromatic = targetChroma >= ACHROMATIC_CHROMA;

    let bestResult: MixResult = {
        closestColor: '#000000',
        recipe: 'Analyzing...',
        distance: Infinity,
        ingredients: [],
        reasoning: null,
    };
    let bestScore = Infinity;

    // Track whether the best single pigment has a hue mismatch.
    // If so, we reduce the complexity penalty for multi-pigment recipes
    // so a better-hued 2-pigment mix can win.
    let singlePigmentHueMismatch = false;

    /**
     * Dynamic complexity penalty.
     * - Normal: 0.5 per ingredient (favors simpler recipes)
     * - Reduced: 0.15 per ingredient when the best single pigment
     *   has a hue mismatch with the target (favors accuracy over simplicity)
     */
    const getComplexityPenalty = (nIngredients: number): number => {
        const penalty = singlePigmentHueMismatch ? 0.15 : BASE_COMPLEXITY_PENALTY;
        return nIngredients * penalty;
    };

    const updateBest = (
        mixedRgb: { r: number; g: number; b: number },
        pigments: Pigment[],
        factors: number[],
    ) => {
        const mixedLab = rgbToLab(mixedRgb);
        const dE = deltaE00(targetLab, mixedLab);
        const score = dE + getComplexityPenalty(pigments.length);

        if (score < bestScore) {
            bestScore = score;
            const ingredients = buildIngredients(pigments, factors);
            bestResult = {
                closestColor: rgbToHex(mixedRgb),
                recipe: buildRecipeString(ingredients),
                distance: dE,
                ingredients,
                reasoning: null,
            };
        }
    };

    // ── Precompute Lab values for all pigments ─────────────────────────────
    const pigmentLabs: Lab[] = palette.map(p => rgbToLab(p.rgb));

    // ── Step 1: Single Pigments ────────────────────────────────────────────

    let bestSingleDe = Infinity;

    for (let i = 0; i < palette.length; i++) {
        const pigment = palette[i];
        const dE = deltaE00(targetLab, pigmentLabs[i]);
        const score = dE + BASE_COMPLEXITY_PENALTY;

        if (score < bestScore) {
            bestScore = score;
            bestSingleDe = dE;
            bestResult = {
                closestColor: pigment.hex,
                recipe: `100% ${pigment.name} (${pigment.cin})`,
                distance: dE,
                ingredients: [{
                    name: pigment.name,
                    cin: pigment.cin,
                    parts: 1,
                    hex: pigment.hex,
                }],
                reasoning: null,
            };
        }
    }

    // Check if the best single pigment has a hue mismatch with the target.
    // If target is chromatic (has a real hue) but the best match either:
    //   a) is achromatic (neutral black/white/gray), or
    //   b) has a hue angle > 15° away from target
    // Then we flag this so multi-pigment recipes get a reduced penalty.
    //
    // For dark colors (L* < 15): if the best single pigment is a neutral black,
    // ALWAYS flag hue mismatch — even if the target appears achromatic on screen.
    // Painters mix darks from chromatic pigments; pure black looks dead on canvas.
    // Only exception: truly pure black (L* < 1) handled by early-return above.
    if (bestResult.ingredients.length === 1) {
        const bestPigmentIdx = palette.findIndex(p => p.hex === bestResult.closestColor);
        if (bestPigmentIdx >= 0) {
            const pigmentChroma = labChroma(pigmentLabs[bestPigmentIdx]);
            const pigmentHue = labHue(pigmentLabs[bestPigmentIdx]);

            if (targetLab.L < 15 && pigmentChroma < ACHROMATIC_CHROMA) {
                // Dark target + neutral black pigment — always prefer a chromatic mix
                singlePigmentHueMismatch = true;
            } else if (targetIsChromatic && pigmentChroma < ACHROMATIC_CHROMA) {
                // Achromatic pigment for a chromatic target — always a hue mismatch
                singlePigmentHueMismatch = true;
            } else if (targetIsChromatic && hueDifference(targetHue, pigmentHue) > HUE_MISMATCH_THRESHOLD) {
                singlePigmentHueMismatch = true;
            }
        }
    }

    // Also flag near-white targets (L > 90) — pure white is never the right
    // answer for a pastel; it always needs a tinting pigment.
    if (targetLab.L > 90 && targetIsChromatic) {
        singlePigmentHueMismatch = true;
    }

    /** Attach reasoning to single-pigment results before returning */
    const finalize = (result: MixResult): MixResult => {
        if (result.ingredients.length === 1) {
            const idx = palette.findIndex(p => p.hex === result.closestColor);
            result.reasoning = generateReasoning(
                targetLab,
                result,
                idx >= 0 ? pigmentLabs[idx] : null,
            );
        }
        return result;
    };

    // Only early-return on perfect single-pigment match if there's no hue issue.
    // A ΔE₀₀ ≤ 2.0 is imperceptible — BUT only if the hue is also right.
    if (bestSingleDe <= SINGLE_PIGMENT_THRESHOLD && !singlePigmentHueMismatch) {
        return finalize(bestResult);
    }

    // ── Precompute spectral data (lazy-cached on pigment objects) ──────────
    const spectralData: SpectralColor[] = palette.map(p => getSpectral(p));

    // ── Step 2: Two-Pigment Mixes ──────────────────────────────────────────
    // Pre-filter: skip pairs where NEITHER pigment is close AND the midpoint
    // is very far from target. For pairs where one pigment is already close
    // (e.g., black near a dark target), always test dominated ratios — the
    // midpoint heuristic fails badly for 95/5 mixes.

    const PREFILTER_THRESHOLD_SQ = 10000; // ~100 ΔE_lab squared
    const CLOSE_PIGMENT_SQ = 2500; // one pigment within ~50 ΔE_lab of target

    for (let i = 0; i < palette.length; i++) {
        for (let j = i + 1; j < palette.length; j++) {
            // Skip if BOTH pigments are far AND midpoint is far
            const iClose = fastLabDist(targetLab, pigmentLabs[i]) < CLOSE_PIGMENT_SQ;
            const jClose = fastLabDist(targetLab, pigmentLabs[j]) < CLOSE_PIGMENT_SQ;

            if (!iClose && !jClose) {
                const midLab: Lab = {
                    L: (pigmentLabs[i].L + pigmentLabs[j].L) / 2,
                    a: (pigmentLabs[i].a + pigmentLabs[j].a) / 2,
                    b: (pigmentLabs[i].b + pigmentLabs[j].b) / 2,
                };
                if (fastLabDist(targetLab, midLab) > PREFILTER_THRESHOLD_SQ) continue;
            }

            const s1 = spectralData[i];
            const s2 = spectralData[j];

            for (const fA of TWO_RATIO_STEPS) {
                const fB = 1 - fA;
                const mixed = spectralMix([s1, s2], [fA, fB]);
                updateBest(mixed, [palette[i], palette[j]], [fA, fB]);
            }
        }
    }

    if (bestResult.distance <= SINGLE_PIGMENT_THRESHOLD) {
        return finalize(bestResult);
    }

    // ── Step 3: Tints & Shades (color + white/dark modifier) ──────────────

    const modifierIndices: number[] = [];
    const colorIndices: number[] = [];
    for (let i = 0; i < palette.length; i++) {
        const n = palette[i].name;
        if (n.includes('White') || n === "Payne's Gray") {
            modifierIndices.push(i);
        } else {
            colorIndices.push(i);
            // Dark earth tones and deep blues double as modifiers for chromatic darks
            if (n === 'Burnt Umber' || n === 'Raw Umber' || n === 'Prussian Blue') {
                modifierIndices.push(i);
            }
        }
    }

    for (const ci of colorIndices) {
        for (const mi of modifierIndices) {
            const sColor = spectralData[ci];
            const sMod = spectralData[mi];

            for (const modFrac of MODIFIER_FRACTIONS) {
                const colorFrac = 1 - modFrac;
                const mixed = spectralMix([sColor, sMod], [colorFrac, modFrac]);
                updateBest(mixed, [palette[ci], palette[mi]], [colorFrac, modFrac]);
            }
        }
    }

    if (bestResult.distance <= SINGLE_PIGMENT_THRESHOLD) {
        return finalize(bestResult);
    }

    // ── Step 4: Three-Pigment Mixes ────────────────────────────────────────
    // Only if we still don't have a good match (ΔE₀₀ > 5)
    // Two colors + one modifier, reduced grid

    if (bestResult.distance > 4) {
        const baseRatios = [0.3, 0.5, 0.7];
        const modAmounts = [0.15, 0.3, 0.5];

        for (let i = 0; i < colorIndices.length; i++) {
            const ci = colorIndices[i];

            for (let j = i + 1; j < colorIndices.length; j++) {
                const cj = colorIndices[j];

                // Pre-filter: skip if midpoint is far from target
                const midLab: Lab = {
                    L: (pigmentLabs[ci].L + pigmentLabs[cj].L) / 2,
                    a: (pigmentLabs[ci].a + pigmentLabs[cj].a) / 2,
                    b: (pigmentLabs[ci].b + pigmentLabs[cj].b) / 2,
                };
                if (fastLabDist(targetLab, midLab) > PREFILTER_THRESHOLD_SQ) continue;

                const s1 = spectralData[ci];
                const s2 = spectralData[cj];

                for (const mi of modifierIndices) {
                    const sMod = spectralData[mi];

                    for (const baseA of baseRatios) {
                        for (const modAmt of modAmounts) {
                            const remaining = 1 - modAmt;
                            const fA = baseA * remaining;
                            const fB = (1 - baseA) * remaining;

                            const mixed = spectralMix([s1, s2, sMod], [fA, fB, modAmt]);
                            updateBest(
                                mixed,
                                [palette[ci], palette[cj], palette[mi]],
                                [fA, fB, modAmt],
                            );
                        }
                    }
                }
            }
        }
    }

    return finalize(bestResult);
};
