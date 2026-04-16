/**
 * Color Science Utilities
 *
 * sRGB ↔ Linear RGB ↔ CIE XYZ (D65) ↔ CIELAB conversions
 * CIEDE2000 (ΔE₀₀) perceptual color distance
 *
 * All constants from IEC 61966-2-1 (sRGB) and CIE standards.
 * CIEDE2000 validated against Sharma, Wu, Dalal (2005) test data.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface RGB { r: number; g: number; b: number }
export interface Lab { L: number; a: number; b: number }

// ── sRGB ↔ Linear RGB ────────────────────────────────────────────────────

const GAMMA = 2.4;

export function srgbToLinear(c: number): number {
    const s = c / 255;
    return s > 0.04045
        ? Math.pow((s + 0.055) / 1.055, GAMMA)
        : s / 12.92;
}

export function linearToSrgb(c: number): number {
    const s = c > 0.0031308
        ? 1.055 * Math.pow(c, 1 / GAMMA) - 0.055
        : c * 12.92;
    return Math.round(Math.max(0, Math.min(255, s * 255)));
}

// ── Linear RGB ↔ CIE XYZ (D65) ──────────────────────────────────────────

export function linearRgbToXyz(r: number, g: number, b: number): [number, number, number] {
    return [
        r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
        r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
        r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
    ];
}

export function xyzToLinearRgb(x: number, y: number, z: number): [number, number, number] {
    return [
        x * 3.2404542 + y * -1.5371385 + z * -0.4985314,
        x * -0.9692660 + y * 1.8760108 + z * 0.0415560,
        x * 0.0556434 + y * -0.2040259 + z * 1.0572252,
    ];
}

// ── XYZ ↔ CIELAB ─────────────────────────────────────────────────────────

// D65 reference white
const REF_X = 0.95047;
const REF_Y = 1.00000;
const REF_Z = 1.08883;

const EPSILON = 0.008856; // (6/29)^3
const KAPPA = 903.3;      // (29/3)^3

function labF(t: number): number {
    return t > EPSILON
        ? Math.cbrt(t)
        : (KAPPA * t + 16) / 116;
}

function labFInv(t: number): number {
    return t > 6 / 29
        ? t * t * t
        : (116 * t - 16) / KAPPA;
}

export function xyzToLab(x: number, y: number, z: number): Lab {
    const fx = labF(x / REF_X);
    const fy = labF(y / REF_Y);
    const fz = labF(z / REF_Z);
    return {
        L: 116 * fy - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz),
    };
}

export function labToXyz(lab: Lab): [number, number, number] {
    const fy = (lab.L + 16) / 116;
    const fx = lab.a / 500 + fy;
    const fz = fy - lab.b / 200;
    return [
        REF_X * labFInv(fx),
        REF_Y * labFInv(fy),
        REF_Z * labFInv(fz),
    ];
}

// ── Convenience: RGB → Lab ───────────────────────────────────────────────

export function rgbToLab(rgb: RGB): Lab {
    const lr = srgbToLinear(rgb.r);
    const lg = srgbToLinear(rgb.g);
    const lb = srgbToLinear(rgb.b);
    const [x, y, z] = linearRgbToXyz(lr, lg, lb);
    return xyzToLab(x, y, z);
}

export function labToRgb(lab: Lab): RGB {
    const [x, y, z] = labToXyz(lab);
    const [lr, lg, lb] = xyzToLinearRgb(x, y, z);
    return {
        r: linearToSrgb(lr),
        g: linearToSrgb(lg),
        b: linearToSrgb(lb),
    };
}

// ── CIEDE2000 (ΔE₀₀) ────────────────────────────────────────────────────
// Reference: Sharma, Wu, Dalal (2005)
// Validated against all 34 canonical test pairs.

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const POW25_7 = 6103515625; // 25^7

// ── Hue & Chroma utilities ──────────────────────────────────────────────

/** Returns Lab hue angle in degrees [0, 360). Returns 0 for achromatic. */
export function labHue(lab: Lab): number {
    let h = Math.atan2(lab.b, lab.a) * DEG;
    if (h < 0) h += 360;
    return h;
}

/** Returns Lab chroma (saturation distance from neutral axis). */
export function labChroma(lab: Lab): number {
    return Math.sqrt(lab.a * lab.a + lab.b * lab.b);
}

/** Angular distance between two hue angles, always in [0, 180]. */
export function hueDifference(h1: number, h2: number): number {
    let d = Math.abs(h1 - h2);
    if (d > 180) d = 360 - d;
    return d;
}

export function deltaE00(lab1: Lab, lab2: Lab, kL = 1, kC = 1, kH = 1): number {
    const { L: L1, a: a1, b: b1 } = lab1;
    const { L: L2, a: a2, b: b2 } = lab2;

    // (2) Original Chroma
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);

    // (3) Mean Chroma
    const C_bar = (C1 + C2) / 2;

    // (4) G factor
    const C_bar_7 = Math.pow(C_bar, 7);
    const G = 0.5 * (1 - Math.sqrt(C_bar_7 / (C_bar_7 + POW25_7)));

    // (5) a' (adjusted)
    const a1p = (1 + G) * a1;
    const a2p = (1 + G) * a2;

    // (6) C' (adjusted chroma)
    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);

    // (7) h' (hue angle in degrees)
    let h1p = Math.atan2(b1, a1p) * DEG;
    if (h1p < 0) h1p += 360;
    let h2p = Math.atan2(b2, a2p) * DEG;
    if (h2p < 0) h2p += 360;

    // (8) ΔL'
    const dLp = L2 - L1;

    // (9) ΔC'
    const dCp = C2p - C1p;

    // (10) Δh'
    let dhp: number;
    const C1pC2p = C1p * C2p;
    if (C1pC2p === 0) {
        dhp = 0;
    } else if (Math.abs(h2p - h1p) <= 180) {
        dhp = h2p - h1p;
    } else if (h2p - h1p > 180) {
        dhp = h2p - h1p - 360;
    } else {
        dhp = h2p - h1p + 360;
    }

    // (11) ΔH'
    const dHp = 2 * Math.sqrt(C1pC2p) * Math.sin((dhp / 2) * RAD);

    // (12) L̄
    const Lp_bar = (L1 + L2) / 2;

    // (13) C̄'
    const Cp_bar = (C1p + C2p) / 2;

    // (14) h̄'
    let hp_bar: number;
    if (C1pC2p === 0) {
        hp_bar = h1p + h2p;
    } else if (Math.abs(h1p - h2p) <= 180) {
        hp_bar = (h1p + h2p) / 2;
    } else if (h1p + h2p < 360) {
        hp_bar = (h1p + h2p + 360) / 2;
    } else {
        hp_bar = (h1p + h2p - 360) / 2;
    }

    // (15) T
    const T = 1
        - 0.17 * Math.cos((hp_bar - 30) * RAD)
        + 0.24 * Math.cos(2 * hp_bar * RAD)
        + 0.32 * Math.cos((3 * hp_bar + 6) * RAD)
        - 0.20 * Math.cos((4 * hp_bar - 63) * RAD);

    // (16) Δθ
    const d_theta = 30 * Math.exp(-Math.pow((hp_bar - 275) / 25, 2));

    // (17) RC
    const Cp_bar_7 = Math.pow(Cp_bar, 7);
    const RC = 2 * Math.sqrt(Cp_bar_7 / (Cp_bar_7 + POW25_7));

    // (18) SL
    const Lp_bar_50 = Lp_bar - 50;
    const SL = 1 + (0.015 * Lp_bar_50 * Lp_bar_50) / Math.sqrt(20 + Lp_bar_50 * Lp_bar_50);

    // (19) SC
    const SC = 1 + 0.045 * Cp_bar;

    // (20) SH
    const SH = 1 + 0.015 * Cp_bar * T;

    // (21) RT
    const RT = -Math.sin(2 * d_theta * RAD) * RC;

    // (22) ΔE₀₀
    const dLpSL = dLp / (kL * SL);
    const dCpSC = dCp / (kC * SC);
    const dHpSH = dHp / (kH * SH);

    return Math.sqrt(
        dLpSL * dLpSL +
        dCpSC * dCpSC +
        dHpSH * dHpSH +
        RT * dCpSC * dHpSH
    );
}
