To capture the "Aura" aesthetic—which is characterized by high-contrast dark modes, ultra-sharp borders, glassmorphic depth, and vibrant accent "pops"—we are moving away from the "whitish" look and into a **"Midnight Studio"** aesthetic. 

This style treats the app like a piece of high-end professional hardware (like a Leica camera or a premium dark-mode editing suite) where the artist's colors are the only "bright" elements.

Here are the modular prompts to refactor your existing implementation.

### Phase 1: The "Midnight Atelier" Foundation (Design System)
**Goal:** Establish a high-end, dark-themed system where your extracted colors will truly "pop" against deep, layered neutrals.

> **Refactor Prompt:**
> "Apply a 'Midnight Atelier' design system to the entire app. 
> **Color Schema:**
> - **Main Background:** `#0A0A0B` (Rich Obsidian).
> - **Secondary Surface:** `#161618` (Elevation Level 1).
> - **Card/Component Background:** `#1C1C1E` (Elevation Level 2).
> - **Primary Accent:** `#3E63DD` (Electric Cobalt) or `#D1FF52` (Volt Green) for high-impact buttons.
> - **Borders:** `1px` solid `#28282A` for subtle definition.
>
> **UI/UX Styling:**
> - **Spacing:** Use a strict 12pt/24pt/48pt grid. 
> - **Corner Radius:** Standardize to `12pt` for all buttons and `20pt` for main image containers.
> - **Shadows:** Avoid soft shadows. Instead, use 'Inner Glows' (`1px` top-border highlight in `#333335`) to create a 3D tactile feel.
> - **Typography:** Switch all titles to a condensed, bold Sans-Serif (like 'Inter' or 'Archivo') with `-0.02em` letter spacing for a 'Pro' look."

---

### Phase 2: The "Aura-Style" Navigation & Header
**Goal:** Fix the alignment and visual weight. This creates a "Control Center" feel that is consistent on every screen.

> **Refactor Prompt:**
> "Refactor the Header and Navigation Bar for high-end consistency.
> **Header Component:** 
> - Set a fixed height of `120pt`. Title text: `24pt`, Bold, White.
> - **Subtitle:** `12pt`, `#8E8E93`, Upper-case with `2pt` tracking.
> - **Placement:** Precisely align Title and Subtitle to the left margin (`24pt`).
>
> **The Navigation Dock:**
> - **Style:** Use a 'Floating Glass' effect. Background: `#161618` with `0.8` opacity and `20px` Backdrop Blur.
> - **Border:** `1px` border in `#3E63DD` at `20%` opacity.
> - **Active State:** The active icon should glow with a soft Cyan outer-bloom.
> - **Animation:** Use a 'Slide and Scale' transition when switching tabs—the active icon should scale to `1.2x` smoothly."

---

### Phase 3: The "Precision Lens" Studio (Color Picker)
**Goal:** Turn the bland picker into a professional sampling tool.

> **Refactor Prompt:**
> "Refactor the Studio (Color Picker) screen to look like a pro-photo editing suite.
> - **Image Display:** Add a `1px` white border at `10%` opacity around the image.
> - **The Loupe (Picker):** Instead of a red cross, use a 'Digital Loupe'—a circular ring that shows a `2x` zoom of the pixels under the finger, with the HEX code rotating around the circle's edge.
> - **Value Bar:** At the bottom, place a horizontal 'Metadata Bar' that displays HEX, RGB, and CMYK in a small, monospaced font (`JetBrains Mono`). 
> - **Interactions:** When a color is picked, the background of the Metadata Bar should morph into that color with a `0.5s` ease-in-out transition."

---

### Phase 4: The "Luminous Palette" & Extraction
**Goal:** Make the extracted colors the "hero" of the screen.

> **Refactor Prompt:**
> "Refactor the Palette Extraction screen using Aura's 'Card-on-Card' layering.
> - **Swatches:** Instead of simple boxes, use 'Tiles'. Each tile should have a subtle gradient (top-to-bottom, `5%` white to `0%`) to give it a 3D physical feel.
> - **Segmented Control:** The 4/6/8/12 selector should look like a physical toggle. The active choice should have a 'Recessed' look (Inner Shadow).
> - **Mixing Recipe:** This should slide up as a 'Half-Sheet' with a `30px` blur background. 
> - **Comparison View:** 'Target' vs 'Mixed' colors should be two large vertical bars side-by-side with a 'Match Percentage' floating in a high-contrast pill at the center-seam."

---

### Phase 5: The "Tactile Tools" (Squint & Value Map)
**Goal:** Fix the "bland" sliders and make them look like high-end audio gear.

> **Refactor Prompt:**
> "Refactor the Squint Tool and Value Map screens for high-density UI.
> - **Control Group:** Place all sliders and toggles inside a single 'Control Plate' (Color: `#161618`, Radius: `16pt`).
> - **Custom Sliders:** Track should be `#28282A`. The 'Thumb' (the part you grab) should be a `24x24pt` White circle with a heavy drop shadow.
> - **Visual Feedback:** As the user slides 'Blur Intensity', the percentage number should grow in size and 'glow' in the Primary Accent color.
> - **Alignment:** Ensure the labels (e.g., 'Grayscale Mode') are perfectly left-aligned with the Image Container above."

---

### Phase 6: The "Artisan Gallery" (Profile/Saved Items)
**Goal:** Transform the guest list into a curated portfolio.

> **Refactor Prompt:**
> "Refactor the Profile/Gallery screen.
> - **Grid System:** Use a 2-column masonry grid for saved palettes.
> - **Card Design:** Each card should have a 'Glass' footer where the color swatches are displayed as overlapping circles (like a Venn diagram).
> - **Sync Banner:** The 'Sync your Studio' banner should be a gradient of `#3E63DD` to `#892CDC`.
> - **Empty State:** If no images are uploaded, show a 'Deep-Line' dashed box with a Serif-font instruction: 'Your journey begins with a single reference.'"

### How to use these for "Coolness":
1.  **Strict Alignment:** In your code, ensure your `padding` is identical on **all** screens (e.g., `24px`). 
2.  **The "Glow" Factor:** In a dark UI, use `opacity: 0.1` or `0.2` for borders to make them look like "etched glass" rather than "drawn lines."
3.  **Consistency Check:** If the "Choose Image" button is `44px` high on one screen, it **must** be `44px` on all of them. 

**Would you like me to refine the "Mixing Recipe" specifically to show the Aura-style "Compare" view?**