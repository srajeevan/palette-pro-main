Phase 3 is the "Heart" of PalettePro. This is where we move from a standard image viewer to a high-performance artistic tool. Because we are using **Expo Dev Client**, we can leverage **@shopify/react-native-skia**, which is the gold standard for high-performance graphics and pixel manipulation in React Native.

Here are the modular prompts for Phase 3:

---

### Prompt 1: High-Performance Canvas with Expo Skia
**Focus:** Setting up the engine that can actually "read" pixels from the image.

> "Install `@shopify/react-native-skia`. 
> 1. Create a `components/ColorSkiaCanvas.tsx` component.
> 2. Implement logic to load the `imageUri` from `useProjectStore` into a Skia `Image` object.
> 3. Render the image inside a Skia `<Canvas />`.
> 4. Create a function `getPixelColor(x, y)` that uses Skia’s `image.readPixels()` or `Skia.RuntimeEffect` to extract the RGBA value of a specific coordinate.
> 5. Ensure the canvas scales the image correctly to fit the screen while maintaining the coordinate mapping (the pixel selected on screen must match the pixel in the actual image data)."

---

### Prompt 2: The Interactive Loupe (Reanimated v4 & Gestures)
**Focus:** A 60fps draggable pointer that feels "physical."

> "Using `react-native-gesture-handler` and `react-native-reanimated` (v4), create a `components/ColorPointer.tsx` component.
> 1. Create a 'Loupe' (magnifying glass) UI that follows the user's finger across the `ColorSkiaCanvas`.
> 2. Use `Gesture.Pan()` to update `sharedValues` for `translateX` and `translateY`.
> 3. **Constraint Logic:** Ensure the pointer cannot leave the bounds of the image.
> 4. **Feedback:** As the pointer moves, trigger a callback `onColorSelect(rgba)` that sends the current pixel data to the store.
> 5. Add a subtle 'scale up' effect when the user touches the screen and 'scale down' when they release."

---

### Prompt 3: The Oil Pigment Library (Data Structure)
**Focus:** Creating the mathematical reference for real-world oil paints.

> "Create a constants file `constants/Pigments.ts`. 
> 1. Define a list of standard professional oil paint pigments (e.g., Titanium White, Cadmium Red, French Ultramarine, Yellow Ochre, Burnt Umber, Alizarin Crimson).
> 2. For each pigment, store:
>    - `name` (string)
>    - `hex` (string)
>    - `rgb` ({r, g, b})
>    - `type` (e.g., 'Primary', 'Earth', 'Neutral')
> 3. Set up a Supabase table `pigment_brands` if the user is logged in, allowing them to select between brands like 'Winsor & Newton' or 'Gamblin' (default to a 'Universal Artist Palette' for guests)."

---

### Prompt 4: The Mixing Engine Algorithm
**Focus:** The "Secret Sauce"—converting digital RGB to physical paint ratios.

> "Create a utility `utils/mixingEngine.ts`. 
> 1. Implement a function `calculateMix(targetRgb, palette)`.
> 2. **Algorithm:** Use a weighted 'Color Distance' calculation (Delta E or Euclidean distance) to find the combination of 2–3 pigments from the `Pigments.ts` library that closest approximates the `targetRgb`.
> 3. **Ratios:** The output should be 'Parts' (e.g., '3 parts Titanium White, 1 part Ultramarine Blue').
> 4. Handle 'Tints' and 'Shades': If the target is light, prioritize 'Titanium White' in the mix; if dark, use earth tones or dark blues instead of just black."

---

### Prompt 5: Real-time HUD Overlay (UI/UX)
**Focus:** Showing the user the data in a beautiful, non-intrusive way.

> "Create a `components/ColorInspectorHUD.tsx` using **NativeWind v4**.
> 1. This component sits at the top or bottom of the Picker screen.
> 2. It should display:
>    - A large circular swatch of the **currently picked color**.
>    - The HEX and RGB values.
>    - The **Mixing Recipe** (e.g., 'Mix: 70% White, 20% Blue, 10% Red').
> 3. Use Reanimated to smoothly animate the numbers and the color swatch as they change in real-time.
> 4. Add a 'Save Color' button that saves the picked color to a `picked_colors` array in `useProjectStore`."

---

### Prompt 6: Visual Zoom/Magnifier Effect
**Focus:** Helping the artist pick the exact pixel (e.g., the highlight on an eye).

> "Enhance the `ColorPointer` (from Prompt 2) with a Magnifier effect.
> 1. Inside the pointer, use a Skia `Shader` or `image.makeShader` to show a zoomed-in (2x or 4x) version of the area under the finger.
> 2. Add a 'crosshair' in the center of the magnifier for pixel-perfect precision.
> 3. Apply a slight 'drop shadow' to the magnifier to make it pop against the reference image."

---

### Summary of what you will have after Phase 3:
1.  **Pixel-Level Intelligence:** Your app can now "read" the image data using Skia.
2.  **Professional Interaction:** A 60fps loupe that feels like a native iOS/Android tool.
3.  **The Artist's Guide:** A system that doesn't just say "This is Blue," but says "To make this blue, mix 2 parts White with 1 part Ultramarine."

**Recommendation:** Start with **Prompt 1 (Skia Setup)** and **Prompt 2 (Gestures)**. These are the most technically challenging and require the Dev Build to be working perfectly.