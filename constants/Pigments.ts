import { prepareColor, SpectralColor } from '@/utils/spectralMixing';

export interface Pigment {
    name: string;
    cin: string;           // Color Index Name (e.g., PB29)
    hex: string;
    rgb: { r: number; g: number; b: number };
    type: 'Primary' | 'Earth' | 'Neutral' | 'Secondary';
    tintingStrength: number;  // 0.3 (weak) to 3.0 (very strong)
    opacity: number;          // 0.0 (transparent) to 1.0 (opaque)
    spectral?: SpectralColor; // Lazily computed
}

/**
 * Get or compute the SpectralColor for a pigment.
 * Cached after first call for performance.
 */
export function getSpectral(p: Pigment): SpectralColor {
    if (!p.spectral) {
        p.spectral = prepareColor(p.rgb.r, p.rgb.g, p.rgb.b, p.tintingStrength, p.opacity);
    }
    return p.spectral;
}

// ─────────────────────────────────────────────────────────────────────────
// Professional Oil Pigment Database
//
// RGB values calibrated from real paint swatches (Gamblin, W&N, Rembrandt).
// Tinting strength from published pigment data and manufacturer guides.
// CIN codes from Color Index International.
// ─────────────────────────────────────────────────────────────────────────

export const UNIVERSAL_PALETTE: Pigment[] = [
    // ── WHITES ──────────────────────────────────────────────────────────
    {
        name: 'Titanium White', cin: 'PW6',
        hex: '#F5F3EE', rgb: { r: 245, g: 243, b: 238 },
        type: 'Neutral', tintingStrength: 1.0, opacity: 1.0,
    },
    {
        name: 'Zinc White', cin: 'PW4',
        hex: '#F8F8FA', rgb: { r: 248, g: 248, b: 250 },
        type: 'Neutral', tintingStrength: 0.4, opacity: 0.3,
    },
    {
        name: 'Lead White', cin: 'PW1',
        hex: '#F2EFE4', rgb: { r: 242, g: 239, b: 228 },
        type: 'Neutral', tintingStrength: 1.0, opacity: 1.0,
    },

    // ── YELLOWS ─────────────────────────────────────────────────────────
    {
        name: 'Cadmium Yellow Pale', cin: 'PY35',
        hex: '#FCDD30', rgb: { r: 252, g: 221, b: 48 },
        type: 'Primary', tintingStrength: 1.0, opacity: 1.0,
    },
    {
        name: 'Cadmium Yellow Deep', cin: 'PY37',
        hex: '#F5A623', rgb: { r: 245, g: 166, b: 35 },
        type: 'Primary', tintingStrength: 1.0, opacity: 1.0,
    },
    {
        name: 'Hansa Yellow', cin: 'PY97',
        hex: '#F8D84C', rgb: { r: 248, g: 216, b: 76 },
        type: 'Primary', tintingStrength: 0.8, opacity: 0.4,
    },
    {
        name: 'Yellow Ochre', cin: 'PY43',
        hex: '#C49A24', rgb: { r: 196, g: 154, b: 36 },
        type: 'Earth', tintingStrength: 0.5, opacity: 0.7,
    },
    {
        name: 'Naples Yellow', cin: 'PBr24',
        hex: '#E8C87A', rgb: { r: 232, g: 200, b: 122 },
        type: 'Earth', tintingStrength: 0.5, opacity: 1.0,
    },

    // ── ORANGES ─────────────────────────────────────────────────────────
    {
        name: 'Cadmium Orange', cin: 'PO20',
        hex: '#E8751A', rgb: { r: 232, g: 117, b: 26 },
        type: 'Primary', tintingStrength: 1.0, opacity: 1.0,
    },

    // ── REDS ────────────────────────────────────────────────────────────
    {
        name: 'Cadmium Red Light', cin: 'PR108',
        hex: '#D93526', rgb: { r: 217, g: 53, b: 38 },
        type: 'Primary', tintingStrength: 1.0, opacity: 1.0,
    },
    {
        name: 'Cadmium Red Deep', cin: 'PR108',
        hex: '#A62025', rgb: { r: 166, g: 32, b: 37 },
        type: 'Primary', tintingStrength: 1.0, opacity: 1.0,
    },
    {
        name: 'Naphthol Red', cin: 'PR170',
        hex: '#C4282D', rgb: { r: 196, g: 40, b: 45 },
        type: 'Primary', tintingStrength: 1.5, opacity: 0.5,
    },
    {
        name: 'Alizarin Crimson', cin: 'PR83',
        hex: '#A01B30', rgb: { r: 160, g: 27, b: 48 },
        type: 'Primary', tintingStrength: 1.5, opacity: 0.2,
    },
    {
        name: 'Quinacridone Magenta', cin: 'PV19',
        hex: '#8C1C4A', rgb: { r: 140, g: 28, b: 74 },
        type: 'Primary', tintingStrength: 1.5, opacity: 0.2,
    },
    {
        name: 'Venetian Red', cin: 'PR101',
        hex: '#7A3228', rgb: { r: 122, g: 50, b: 40 },
        type: 'Earth', tintingStrength: 1.0, opacity: 1.0,
    },

    // ── EARTH TONES ─────────────────────────────────────────────────────
    {
        name: 'Raw Sienna', cin: 'PBr7',
        hex: '#C8963C', rgb: { r: 200, g: 150, b: 60 },
        type: 'Earth', tintingStrength: 0.5, opacity: 0.5,
    },
    {
        name: 'Burnt Sienna', cin: 'PBr7',
        hex: '#8A3C18', rgb: { r: 138, g: 60, b: 24 },
        type: 'Earth', tintingStrength: 0.8, opacity: 0.5,
    },
    {
        name: 'Raw Umber', cin: 'PBr7',
        hex: '#56482E', rgb: { r: 86, g: 72, b: 46 },
        type: 'Earth', tintingStrength: 0.5, opacity: 0.5,
    },
    {
        name: 'Burnt Umber', cin: 'PBr7',
        hex: '#3D2A1C', rgb: { r: 61, g: 42, b: 28 },
        type: 'Earth', tintingStrength: 0.7, opacity: 0.6,
    },
    {
        name: 'Transparent Red Oxide', cin: 'PR101',
        hex: '#7A2E14', rgb: { r: 122, g: 46, b: 20 },
        type: 'Earth', tintingStrength: 0.8, opacity: 0.2,
    },

    // ── BLUES ───────────────────────────────────────────────────────────
    {
        name: 'French Ultramarine', cin: 'PB29',
        hex: '#1E22AA', rgb: { r: 30, g: 34, b: 170 },
        type: 'Primary', tintingStrength: 1.2, opacity: 0.5,
    },
    {
        name: 'Cobalt Blue', cin: 'PB28',
        hex: '#1848A0', rgb: { r: 24, g: 72, b: 160 },
        type: 'Primary', tintingStrength: 1.0, opacity: 0.6,
    },
    {
        name: 'Cerulean Blue', cin: 'PB35',
        hex: '#0074A8', rgb: { r: 0, g: 116, b: 168 },
        type: 'Primary', tintingStrength: 0.6, opacity: 1.0,
    },
    {
        name: 'Phthalo Blue', cin: 'PB15',
        hex: '#0A2E6E', rgb: { r: 10, g: 46, b: 110 },
        type: 'Primary', tintingStrength: 3.0, opacity: 0.2,
    },
    {
        name: 'Prussian Blue', cin: 'PB27',
        hex: '#0C2340', rgb: { r: 12, g: 35, b: 64 },
        type: 'Primary', tintingStrength: 2.5, opacity: 0.3,
    },

    // ── GREENS ──────────────────────────────────────────────────────────
    {
        name: 'Viridian', cin: 'PG18',
        hex: '#0A6652', rgb: { r: 10, g: 102, b: 82 },
        type: 'Secondary', tintingStrength: 0.8, opacity: 0.3,
    },
    {
        name: 'Phthalo Green', cin: 'PG7',
        hex: '#0C3824', rgb: { r: 12, g: 56, b: 36 },
        type: 'Secondary', tintingStrength: 3.0, opacity: 0.2,
    },
    {
        name: 'Sap Green', cin: 'PG36+PY138',
        hex: '#3E6420', rgb: { r: 62, g: 100, b: 32 },
        type: 'Secondary', tintingStrength: 1.2, opacity: 0.3,
    },
    {
        name: 'Chromium Oxide Green', cin: 'PG17',
        hex: '#4A6E3C', rgb: { r: 74, g: 110, b: 60 },
        type: 'Secondary', tintingStrength: 0.5, opacity: 1.0,
    },

    // ── BLACKS ──────────────────────────────────────────────────────────
    {
        name: 'Ivory Black', cin: 'PBk9',
        hex: '#1A1A1A', rgb: { r: 26, g: 26, b: 26 },
        type: 'Neutral', tintingStrength: 1.0, opacity: 1.0,
    },
    {
        name: 'Mars Black', cin: 'PBk11',
        hex: '#262420', rgb: { r: 38, g: 36, b: 32 },
        type: 'Neutral', tintingStrength: 1.0, opacity: 1.0,
    },
    {
        name: "Payne's Gray", cin: 'PBk9+PB29',
        hex: '#2C3040', rgb: { r: 44, g: 48, b: 64 },
        type: 'Neutral', tintingStrength: 1.2, opacity: 0.3,
    },
];
