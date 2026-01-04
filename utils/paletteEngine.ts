import { SkImage } from "@shopify/react-native-skia";

/**
 * A simpler RGB type for internal calculations
 */
type RGB = { r: number; g: number; b: number };

/**
 * Extract pixel data from Skia Image.
 * For performance, we can skip pixels if the image is large (naive downsampling).
 * 
 * @param image The source Skia Image
 * @param sampleRate 1 = read all, 10 = read every 10th pixel (approx)
 */
export const extractPixels = (image: SkImage, sampleRate: number = 10): Uint8Array | null => {
    // Basic read of the whole image or a scaled version. 
    // Since RN Skia doesn't have a simple "resize" method for SkImage without a surface,
    // we will read all pixels (if possible) and then sample in the loop.
    // WARNING: Reading 12MP image to JS might be too heavy. 
    // Ideally we should scale down using a Surface before this function if strictly needed.
    // For now, we assume reasonable image sizes or that readPixels is fast enough.

    // readPixels returns a Uint8Array [R, G, B, A, R, G, B, A...]
    const pixels = image.readPixels(0, 0, {
        width: image.width(),
        height: image.height(),
        colorType: 4, // rgba-8888
        alphaType: 1, // premul
    });

    return pixels;
};

/**
 * K-Means Clustering Algorithm.
 * 
 * @param pixels The raw pixel data (RGBA)
 * @param k Number of clusters (colors) to find
 * @param maxIterations Safety limit
 * @param sampleStep Step to skip pixels (downsampling logic here)
 */
export const kMeansClustering = (
    pixels: Uint8Array,
    k: number,
    maxIterations: number = 10,
    sampleStep: number = 40 // Skip every 40 pixels (stride) for speed
): string[] => {
    // 1. Initialize Centroids (Randomly pick k pixels)
    // We store centroids as [r, g, b]
    let centroids: RGB[] = [];
    const length = pixels.length;

    // Safety check
    if (length < 4) return ["#000000"];

    for (let i = 0; i < k; i++) {
        const randomIdx = Math.floor(Math.random() * (length / 4)) * 4;
        centroids.push({
            r: pixels[randomIdx],
            g: pixels[randomIdx + 1],
            b: pixels[randomIdx + 2],
        });
    }

    // 2. Iterate
    for (let iter = 0; iter < maxIterations; iter++) {
        // Assignments: which centroid is each pixel closest to?
        // We accumulate sum and count for each centroid to recalculate mean in one pass
        const sums = new Array(k).fill(0).map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

        // Iterate pixels with stride
        for (let i = 0; i < length; i += (4 * sampleStep)) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Ignore transparent/white-ish? (Optional filtering)
            // if (a < 128) continue; 

            // Find closest centroid
            let minDist = Infinity;
            let closestIndex = 0;

            for (let c = 0; c < k; c++) {
                const cent = centroids[c];
                const dr = r - cent.r;
                const dg = g - cent.g;
                const db = b - cent.b;
                // Euclidean distance squared is enough for comparison
                const dist = dr * dr + dg * dg + db * db;

                if (dist < minDist) {
                    minDist = dist;
                    closestIndex = c;
                }
            }

            // Assign
            sums[closestIndex].r += r;
            sums[closestIndex].g += g;
            sums[closestIndex].b += b;
            sums[closestIndex].count++;
        }

        // 3. Update Centroids
        let converged = true;
        for (let c = 0; c < k; c++) {
            const sum = sums[c];
            if (sum.count === 0) {
                // Orphaned centroid - logic to re-init? Or leave as is.
                // Leave keeps it where it last was.
                continue;
            }

            const newR = Math.floor(sum.r / sum.count);
            const newG = Math.floor(sum.g / sum.count);
            const newB = Math.floor(sum.b / sum.count);

            // Check convergence
            if (Math.abs(newR - centroids[c].r) > 1 ||
                Math.abs(newG - centroids[c].g) > 1 ||
                Math.abs(newB - centroids[c].b) > 1) {
                converged = false;
            }

            centroids[c] = { r: newR, g: newG, b: newB };
        }

        if (converged) break;
    }

    // 4. Convert Centroids to Hex
    const hexPalette = centroids.map(c => rgbToHex(c.r, c.g, c.b));
    console.log("K-Means Result:", hexPalette);
    return hexPalette;
};

const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

/**
 * Main Palette Generator Function
 */
export const generatePalette = (image: SkImage, colorCount: number = 5): string[] => {
    if (!image) {
        console.error("generatePalette: No image provided");
        return [];
    }

    console.log(`generatePalette: Starting for ${colorCount} colors on image ${image.width()}x${image.height()}`);

    // Attempt to read pixels
    const pixels = extractPixels(image);
    if (!pixels) {
        console.error("generatePalette: extractPixels returned null");
        return [];
    }

    console.log(`generatePalette: Extracted ${pixels.length} bytes`);

    // Run K-Means
    const totalPixels = pixels.length / 4;
    const targetSample = 4000;
    const step = Math.max(1, Math.floor(totalPixels / targetSample));

    console.log(`generatePalette: Running K-Means with step ${step} on approx ${totalPixels} pixels`);

    try {
        const start = Date.now();
        const result = kMeansClustering(pixels, colorCount, 15, step);
        console.log(`generatePalette: Completed in ${Date.now() - start}ms`);
        return result;
    } catch (e) {
        console.error("generatePalette: K-Means failed", e);
        return [];
    }
};
