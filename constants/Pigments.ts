export interface Pigment {
    name: string;
    hex: string;
    rgb: { r: number; g: number; b: number };
    type: 'Primary' | 'Earth' | 'Neutral' | 'Secondary';
}

export const UNIVERSAL_PALETTE: Pigment[] = [
    // WHITES
    { name: 'Titanium White', hex: '#F9FAF9', rgb: { r: 249, g: 250, b: 249 }, type: 'Neutral' },

    // YELLOWS
    { name: 'Cadmium Yellow Light', hex: '#FFF200', rgb: { r: 255, g: 242, b: 0 }, type: 'Primary' },
    { name: 'Yellow Ochre', hex: '#CC9911', rgb: { r: 204, g: 153, b: 17 }, type: 'Earth' },

    // REDS
    { name: 'Cadmium Red Medium', hex: '#E30022', rgb: { r: 227, g: 0, b: 34 }, type: 'Primary' },
    { name: 'Alizarin Crimson', hex: '#E32636', rgb: { r: 227, g: 38, b: 54 }, type: 'Primary' }, // Cool red
    { name: 'Burnt Sienna', hex: '#E97451', rgb: { r: 233, g: 116, b: 81 }, type: 'Earth' },

    // BLUES
    { name: 'French Ultramarine', hex: '#120A8F', rgb: { r: 18, g: 10, b: 143 }, type: 'Primary' }, // Warm blue
    { name: 'Cerulean Blue', hex: '#007BA7', rgb: { r: 0, g: 123, b: 167 }, type: 'Primary' }, // Cool blue

    // GREENS
    { name: 'Viridian Green', hex: '#40826D', rgb: { r: 64, g: 130, b: 109 }, type: 'Secondary' },
    { name: 'Sap Green', hex: '#507D2A', rgb: { r: 80, g: 125, b: 42 }, type: 'Secondary' },

    // BROWNS / BLACKS
    { name: 'Burnt Umber', hex: '#8A3324', rgb: { r: 138, g: 51, b: 36 }, type: 'Earth' },
    { name: 'Ivory Black', hex: '#231F20', rgb: { r: 35, g: 31, b: 32 }, type: 'Neutral' },
];
