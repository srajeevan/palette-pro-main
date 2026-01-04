# Skia Pixel Reading Implementation

**Problem:**
Reading pixel colors from a `<Canvas>` or `<Image>` in React Native Skia on the JavaScript thread is non-trivial because the `SkImage` is often an opaque handle to a GPU texture or a compressed blob. Additionally, on Retina/High-Density screens, the logical coordinates (from gesture handlers) do not match the physical pixels of the backed surface.

**Solution:**
We implemented a robust solution in `ColorSkiaCanvas.tsx` using `makeImageSnapshot()` and `readPixels()`.

## Core Components

1.  **`useCanvasRef`**: We use this hook to get a reference to the underlying Skia Canvas View.
    ```typescript
    const internalCanvasRef = useCanvasRef();
    ```

2.  **`makeImageSnapshot()`**: This methods captures the *current rendered state* of the canvas as an `SkImage`. This includes scaling, letterboxing, and the image itself.
    ```typescript
    const snapshot = internalCanvasRef.current.makeImageSnapshot();
    ```

3.  **`PixelRatio` Scaling**: This is the critical fix for Retina devices.
    *   Gestures give **Logical coordinates** (e.g., `x: 100`).
    *   `readPixels` expects **Physical coordinates** (e.g., `x: 300` on an iPhone 16 Pro Max).
    
    ```typescript
    import { PixelRatio } from 'react-native';
    
    const density = PixelRatio.get();
    const physicalX = Math.round(x * density);
    const physicalY = Math.round(y * density);
    ```

4.  **`readPixels()`**: We read a single pixel from the snapshot at the calculated physical coordinates.
    ```typescript
    // standard (R, G, B, A)
    const pixels = snapshot.readPixels(physicalX, physicalY, { 
        width: 1, 
        height: 1, 
        colorType: 4, 
        alphaType: 1
    });
    ```

## Code Example

```typescript
// components/ColorSkiaCanvas.tsx

useImperativeHandle(ref, () => ({
    getPixelColor: (x: number, y: number) => {
        if (!internalCanvasRef.current) return null;

        const snapshot = internalCanvasRef.current.makeImageSnapshot();
        if (snapshot) {
            const density = PixelRatio.get();
            const physicalX = Math.round(x * density);
            const physicalY = Math.round(y * density);

            // Bounds check
            if (physicalX < 0 || physicalX >= snapshot.width() || 
                physicalY < 0 || physicalY >= snapshot.height()) {
                return null;
            }

            const pixels = snapshot.readPixels(physicalX, physicalY, { 
                width: 1, height: 1, colorType: 4, alphaType: 1 
            });

            if (pixels && pixels.length >= 3) {
                 return { r: pixels[0], g: pixels[1], b: pixels[2] };
            }
        }
        return null;
    }
}));
```
