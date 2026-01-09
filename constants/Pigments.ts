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

    // YELLOWS
    // Cadmium Yellow Light: Bright, cool yellow.
    { name: 'Cadmium Yellow Light', hex: '#FFF600', rgb: { r: 255, g: 246, b: 0 }, type: 'Primary' },
    // Yellow Ochre: Earth yellow, much browner/duller than "web gold".
    { name: 'Yellow Ochre', hex: '#C69C08', rgb: { r: 198, g: 156, b: 8 }, type: 'Earth' },

    // REDS
    // Cadmium Red Medium: Opaque, warm red.
    { name: 'Cadmium Red Medium', hex: '#D92121', rgb: { r: 217, g: 33, b: 33 }, type: 'Primary' },
    // Alizarin Crimson: Deep, transparent, cool red. MUCH darker than "web red".
    { name: 'Alizarin Crimson', hex: '#8E1E25', rgb: { r: 142, g: 30, b: 37 }, type: 'Primary' },
    // Burnt Sienna: Reddish-brown earth.
    { name: 'Burnt Sienna', hex: '#8A3816', rgb: { r: 138, g: 56, b: 22 }, type: 'Earth' },

    // BLUES
    // French Ultramarine: Deep, warm blue, slightly violet.
    { name: 'French Ultramarine', hex: '#1C05B3', rgb: { r: 28, g: 5, b: 179 }, type: 'Primary' },
    // Cerulean Blue: Sky blue, slightly greenish/cool.
    { name: 'Cerulean Blue', hex: '#027BA8', rgb: { r: 2, g: 123, b: 168 }, type: 'Primary' },

    // GREENS
    // Viridian: Deep, cool blue-green.
    { name: 'Viridian Green', hex: '#006B54', rgb: { r: 0, g: 107, b: 84 }, type: 'Secondary' },
    // Sap Green: Warm, yellow-green.
    { name: 'Sap Green', hex: '#446420', rgb: { r: 68, g: 100, b: 32 }, type: 'Secondary' },

    // BROWNS / BLACKS
    // Burnt Umber: Very dark chocolate brown.
    { name: 'Burnt Umber', hex: '#3B2820', rgb: { r: 59, g: 40, b: 32 }, type: 'Earth' },
    // Ivory Black: Warm black (historically form charred bone), slightly brownish compared to Lamp Black, but very dark.
    { name: 'Ivory Black', hex: '#181818', rgb: { r: 24, g: 24, b: 24 }, type: 'Neutral' },
];
