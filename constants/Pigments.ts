export interface Pigment {
    name: string;
    hex: string;
    rgb: { r: number; g: number; b: number };
    type: 'Primary' | 'Earth' | 'Neutral' | 'Secondary';
}

// REALISTIC OIL PIGMENT VALUES
// Sourced from standard digital approximations of physical pigments (e.g., Gamblin/Winsor & Newton averages)
// Note: Web colors are often too bright/saturated. These are deeper/more muted to reflect real paint.

export const UNIVERSAL_PALETTE: Pigment[] = [
    // WHITES
    // Titanium White: High opacity, very bright, neutral.
    { name: 'Titanium White', hex: '#F9FAF9', rgb: { r: 249, g: 250, b: 249 }, type: 'Neutral' },
    // Zinc White: Transparent, cool white. Good for mixing tints without chalkiness.
    { name: 'Zinc White', hex: '#FCFCFC', rgb: { r: 252, g: 252, b: 252 }, type: 'Neutral' },

    // YELLOWS
    // Cadmium Yellow Light: Bright, cool lemon yellow.
    { name: 'Cadmium Yellow Light', hex: '#FFF600', rgb: { r: 255, g: 246, b: 0 }, type: 'Primary' },
    // Cadmium Yellow Deep: Warm, golden yellow.
    { name: 'Cadmium Yellow Deep', hex: '#FFB200', rgb: { r: 255, g: 178, b: 0 }, type: 'Primary' },
    // Yellow Ochre: Earth yellow, much browner/duller than "web gold".
    { name: 'Yellow Ochre', hex: '#C69C08', rgb: { r: 198, g: 156, b: 8 }, type: 'Earth' },

    // REDS
    // Cadmium Red Medium: Opaque, warm red.
    { name: 'Cadmium Red Medium', hex: '#D92121', rgb: { r: 217, g: 33, b: 33 }, type: 'Primary' },
    // Cadmium Red Deep: Darker, cooler red.
    { name: 'Cadmium Red Deep', hex: '#AB1F25', rgb: { r: 171, g: 31, b: 37 }, type: 'Primary' },
    // Alizarin Crimson: Deep, transparent, cool red.
    { name: 'Alizarin Crimson', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 }, type: 'Primary' },
    // Quinacridone Magenta: Bright, cool magenta-red. Essential for violets.
    { name: 'Quinacridone Magenta', hex: '#9A1F4C', rgb: { r: 154, g: 31, b: 76 }, type: 'Primary' },
    // Burnt Sienna: Reddish-brown earth.
    { name: 'Burnt Sienna', hex: '#8A3816', rgb: { r: 138, g: 56, b: 22 }, type: 'Earth' },
    // Raw Sienna: Lighter, yellower earth tone.
    { name: 'Raw Sienna', hex: '#D69F54', rgb: { r: 214, g: 159, b: 84 }, type: 'Earth' },

    // BLUES
    // French Ultramarine: Deep, warm blue, slightly violet.
    { name: 'French Ultramarine', hex: '#1C05B3', rgb: { r: 28, g: 5, b: 179 }, type: 'Primary' },
    // Phthalo Blue: Intense, deep cyan-blue.
    { name: 'Phthalo Blue', hex: '#0D3370', rgb: { r: 13, g: 51, b: 112 }, type: 'Primary' },
    // Cerulean Blue: Sky blue, slightly greenish/cool.
    { name: 'Cerulean Blue', hex: '#027BA8', rgb: { r: 2, g: 123, b: 168 }, type: 'Primary' },

    // GREENS
    // Viridian: Deep, cool blue-green.
    { name: 'Viridian Green', hex: '#006B54', rgb: { r: 0, g: 107, b: 84 }, type: 'Secondary' },
    // Phthalo Green: Very intense, dark cool green.
    { name: 'Phthalo Green', hex: '#123524', rgb: { r: 18, g: 53, b: 36 }, type: 'Secondary' },
    // Sap Green: Warm, yellow-green.
    { name: 'Sap Green', hex: '#446420', rgb: { r: 68, g: 100, b: 32 }, type: 'Secondary' },

    // BROWNS / BLACKS
    // Raw Umber: Cool, greenish-brown shadow color.
    { name: 'Raw Umber', hex: '#574A36', rgb: { r: 87, g: 74, b: 54 }, type: 'Earth' },
    // Burnt Umber: Very dark chocolate brown.
    { name: 'Burnt Umber', hex: '#3B2820', rgb: { r: 59, g: 40, b: 32 }, type: 'Earth' },
    // Ivory Black: Warm black (charcoal).
    { name: 'Ivory Black', hex: '#181818', rgb: { r: 24, g: 24, b: 24 }, type: 'Neutral' },
    // Mars Black: Opaque, cooler black (Iron Oxide).
    { name: 'Mars Black', hex: '#262626', rgb: { r: 38, g: 38, b: 38 }, type: 'Neutral' },
];
