Phase 4 focuses on converting a reference image into actionable artistic data. We will use the **Skia** foundation established in Phase 3 to perform image processing (blurring and posterization) and a clustering algorithm for palette generation.

Here are the modular prompts for Phase 4:

---

### Prompt 1: Dominant Color Extraction (K-Means Logic)
**Focus:** The math behind finding the "soul" of the image colors.

> "Implement a color extraction utility in `utils/paletteEngine.ts`.
> 1. Use a K-Means clustering algorithm (or the `react-native-pixso-colors` library) to analyze the `imageUri` from the store.
> 2. Create a function `generatePalette(uri, colorCount)` that:
>    - Samples pixels from the image (downsample for performance).
>    - Groups them into `colorCount` clusters.
>    - Returns an array of HEX codes representing the dominant colors.
> 3. Add an action `setGeneratedPalette` to `useProjectStore` to store these colors."

---

### Prompt 2: Interactive Palette Gallery UI
**Focus:** A beautiful, manageable interface for the generated colors.

> "Build the UI for the `(tabs)/palette.tsx` screen using **NativeWind v4**.
> 1. **Header:** A slider to choose the number of colors to extract (3 to 12).
> 2. **The Grid:** A responsive layout of 'Swatches'. Each swatch should:
>    - Show the color.
>    - Display the HEX code.
>    - Have a 'Delete' button on long-press.
> 3. **Manual Entry:** Add a '+' button to allow users to add a color they picked manually in the 'Picker' tab.
> 4. **Animation:** Use **Reanimated v4** for 'Layout Transitions' so swatches slide into place beautifully when the palette is re-generated."

---

### Prompt 3: The "Squint" Tool (Skia Gaussian Blur)
**Focus:** Simulating the act of an artist squinting their eyes to see shapes rather than details.

> "In the `(tabs)/squint.tsx` screen, implement the Blur feature using **Expo Skia**.
> 1. Load the active image into a Skia Canvas.
> 2. Apply a `Blur` filter to the image.
> 3. Create a `sharedValue` called `blurIntensity` linked to a slider at the bottom of the screen.
> 4. As the user moves the slider, the image should transition from sharp to a heavy blur in real-time.
> 5. Ensure the blur is performant by using Skia’s native GPU-accelerated filters."

---

### Prompt 4: The Value Map (Grayscale & Posterization Shader)
**Focus:** Helping artists see "Tonal Values" (Light vs. Dark).

> "Enhance the Squint screen with a 'Value Map' mode using a **Skia Runtime Effect (Shader)**.
> 1. **Grayscale Toggle:** A switch to strip all saturation from the image.
> 2. **Posterization Slider:** Implement a shader that reduces the image to a specific number of 'Levels' (e.g., 3, 5, or 7 tones). 
>    - *Logic:* This forces the image into distinct blocks of light, mid-tone, and shadow.
> 3. The UI should allow combining both: A blurred, posterized, grayscale image is the ultimate 'Value Map' for an oil painter.
> 4. Use NativeWind to style the control panel at the bottom of the screen."

---

### Prompt 5: Supabase Persistence for Palettes
**Focus:** Saving the artistic discovery to the cloud.

> "Integrate Supabase for palette storage.
> 1. Provide the SQL schema to create a `palettes` table:
>    - `id` (uuid)
>    - `user_id` (references profiles)
>    - `name` (text, e.g., 'Sunset Study')
>    - `colors` (jsonb / array of hex strings)
>    - `image_url` (text, reference to the source image)
> 2. Create a `savePalette()` function in `services/paletteService.ts`.
> 3. In the UI, add a 'Save to Collection' button that only appears if the user is logged in.
> 4. Add a success toast or haptic feedback when the save is complete."

---

### Prompt 6: The "Mixing Recipe" Integration
**Focus:** Connecting the generated palette back to the Mixing Engine from Phase 3.

> "Enhance the Palette Swatches created in Prompt 2.
> 1. When a user taps a swatch in the Palette tab, show a modal or bottom sheet.
> 2. This sheet should use the `mixingEngine.ts` (from Phase 3) to show exactly how to mix that specific dominant color using the user's preferred oil paint brand.
> 3. Include a 'Compare' view where the user can see the digital color vs. the suggested physical mix side-by-side."

---

### Summary of what you will have after Phase 4:
1.  **Analytical Tools:** The user can now break an image down into its "Value" (light/dark) and its "Atmosphere" (dominant colors).
2.  **The Squint Experience:** A digital version of a classic painting technique, adjustable via a slider.
3.  **Cloud Storage:** Artists can now build a library of palettes and reference images for future studio sessions.

**Next Step Recommendation:** Start with **Prompt 1 and 2** to get the palette generation working, as it's the most satisfying visual feature for the user.