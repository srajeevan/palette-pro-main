The issue you are facing is a classic **"Stacking & Safe Area"** conflict.

1.  **The Overlap:** Your new "Floating Nav Dock" sits on top of everything at the bottom. Your "Color Comparison Bar" (the pink strip) is rendered at the bottom of your normal screen flow, so it gets covered by the Nav Dock.
2.  **The Whitespace:** The "Studio" header is taking up too much vertical space, and the image container isn't set to expand to fill the gap.

Here are the modular prompts to fix the overlap and maximize the image area.

### Module 1: Fix the Overlap (Lifting the Interface)

**Goal:** Ensure the content (specifically the pink Color Bar) respects the new Floating Navigation Bar height.

**Prompt:**
> Update the `StudioScreen` layout to prevent the Bottom Navigation Bar from covering the UI.
>
> **Action:**
> 1.  **Identify the Nav Height:** The new Floating Navbar takes up approximately `90px` to `100px` of space at the bottom (Height + Margins).
> 2.  **Apply Bottom Padding:**
>     *   Apply `paddingBottom: 110px` to the main container (or ScrollView) of the Studio Screen.
>     *   This ensures that the "Color Comparison Bar" (the pink strip) is pushed up and sits *visually above* the Floating Nav Bar, not behind it.
> 3.  **Alternative (If using Absolute Positioning):**
>     *   If the `ColorComparisonBar` is absolutely positioned, update its `bottom` value.
>     *   Change it from `bottom: 0` (or 20) to `bottom: 110`.
>
> **Result:** The User should see the Nav Bar at the very bottom, and the Color Tool stacked immediately above it, with no overlap.

### Module 2: Maximize Image Area (The "Immersive" Fix)

**Goal:** Shrink the header and force the image canvas to take up all remaining space to reduce whitespace.

**Prompt:**
> Refactor the `StudioScreen` to maximize the screen real estate for the image.
>
> **Tasks:**
> 1.  **Compact Header:**
>     *   The current "Studio / Pick & Mix" header is too tall.
>     *   Change the header container to `flexDirection: 'row'`, `alignItems: 'center'`, and `justifyContent: 'space-between'`.
>     *   Reduce the font size of "Studio" to approx 24px.
>     *   Move the "Pick & Mix" subtitle to sit *next to* the title (or remove it/hide it if not essential) to save vertical space.
>     *   Reduce the top margin/safe-area spacing so the header sits tighter to the top.
> 2.  **Expand the Canvas:**
>     *   Ensure the View/Container holding the Image/Skia Canvas has `flex: 1`.
>     *   **Important:** Ensure no parent container has a fixed height that restricts it. It should grow to fill the space between the (now smaller) Header and the (now padded) Bottom Footer.
> 3.  **Background Styling:**
>     *   Change the background color of the Image Container from White to a **Light Neutral Gray** (`#F2F2F7`) or **Dark Gray** (`#1A1A1A`).
>     *   This makes the "whitespace" caused by landscape images look like a deliberate "Canvas Workspace" rather than just empty UI space.

### Module 3: Dynamic Image Scaling (Fit vs Fill)

**Goal:** Handle landscape images better so they don't feel "tiny" in the middle of the screen.

**Prompt:**
> Update the Image rendering logic to handle Aspect Ratios better.
>
> **Logic:**
> 1.  **Calculate Ratios:** Compare the screen aspect ratio vs. the image aspect ratio.
> 2.  **Zoom Logic (Optional but recommended):**
>     *   If using Skia or a standard Image, set the `resizeMode` (or `fit`) to `"contain"`.
>     *   *However*, if the image is **Landscape** (wider than it is tall), allow it to touch the Left and Right edges of the screen (Width = 100%).
>     *   Currently, it looks like there might be horizontal padding restricting the width. **Remove any horizontal padding** (e.g., `paddingHorizontal: 20`) from the Image Container. The image should touch the edges of the phone.

### Summary of Changes:
1.  **Padding:** The bottom controls will shift UP by ~100px to clear the Nav Bar.
2.  **Header:** The top title will shrink and move up.
3.  **Width:** The image will expand to touch the left/right edges, making it feel 20-30% larger instantly.