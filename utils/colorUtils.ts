/**
 * Convert HEX color to RGB object
 * @param hex - Hex color string (e.g., "#ff5733" or "ff5733")
 * @returns RGB object with r, g, b values (0-255)
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
        console.warn(`Invalid hex color: ${hex}`);
        return null;
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return { r, g, b };
};

/**
 * Convert RGB object to HEX string
 * @param rgb - RGB object with r, g, b values (0-255)
 * @returns HEX color string (e.g., "#ff5733")
 */
export const rgbToHex = (rgb: { r: number; g: number; b: number }): string => {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

/**
 * Get contrasting text color (black or white) for a given background color
 * @param hex - Hex color string
 * @returns "#000000" or "#FFFFFF"
 */
export const getContrastColor = (hex: string): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000';

    // Calculate relative luminance using sRGB color space
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};
