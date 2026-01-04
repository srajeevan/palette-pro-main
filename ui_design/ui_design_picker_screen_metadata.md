The current metadata component feels "odd" because it is a **floating pill with nested borders**, which creates a "bubble" look that clashes with the sharp, professional "Aura" aesthetic. In high-end design, data should feel **integrated** into the workspace, not like a separate sticker.

Integrating the metadata directly into the bottom of the image container (as a technical footer) is the correct move. This creates a "Control Panel" feel where the image and its data are one unit.

Here are the modular prompts to refactor the **Metadata Section** and the **Image Container** for a professional finish.

---

### Phase 3.1: The "Technical Footer" Refactor
**Goal:** Remove the "pill-in-a-pill" look and integrate the color data into the image container.

> **Refactor Prompt:**
> "Refactor the Metadata component (HEX/RGB readout) to be an integrated footer for the Image Container.
> - **Structure:** Remove the floating pill and the nested inner-pill. Instead, create a flat `40pt` height bar that is physically attached to the bottom of the image container.
> - **Visuals:** 
>   - Background: `#161618` (matches the Elevation 1 level).
>   - Border: Remove the rounded pill border. Apply a single `1px` top-border (`#28282A`) to separate the image from the data.
>   - Bottom Corners: Match the `20pt` radius of the main image container so it looks like one solid piece.
> - **The Color Indicator:** On the far left of this bar, add a `12x12pt` square with a `4pt` radius. This square should dynamically update to the currently picked color. This gives an immediate visual link between the pixel and the data."

---

### Phase 3.2: Typography & Alignment (The "Pro Readout")
**Goal:** Fix the font and spacing to look like professional camera/editing software.

> **Refactor Prompt:**
> "Refine the text layout inside the new Metadata Footer.
> - **Font:** Change HEX and RGB text to a **Monospaced font** (e.g., `Courier New`, `JetBrains Mono`, or `Roboto Mono`). This is a hallmark of 'Pro' tools because numbers stay aligned as they change.
> - **Styling:** 
>   - HEX Label: `#8E8E93` (Grey), HEX Value: `#FFFFFF` (White).
>   - Use a vertical separator bar `|` in `#28282A` to divide HEX and RGB.
> - **Alignment:** Center the text vertically within the `40pt` bar. Ensure the horizontal padding matches the internal padding of the image container (approx `16pt` from the edges)."

---

### Phase 3.3: Image Container & Spacing Fix
**Goal:** Fix the "odd" gap and the nested padding issues.

> **Refactor Prompt:**
> "Adjust the layout of the `StudioScreen` to fix vertical spacing.
> - **Image Container:** Ensure the image itself fills the container completely (no black gaps on the sides). 
> - **The "Unit" Logic:** The `Header + Image + Metadata Footer` should be treated as one vertical stack. 
> - **Gap Management:** 
>   - Distance from Subtitle ('PICK & MIX') to Image: Exactly `24pt`.
>   - Distance from Metadata Footer to the Floating Nav Dock: Allow the screen to breathe; do not place any other components in between.
> - **Interaction:** When the user is NOT picking a color, the Metadata Footer should have `40%` opacity. When a color is picked (on touch), it should animate to `100%` opacity with a `0.2s` fade."

---

### Why this fixes the "Odd" feeling:
1.  **Logical Grouping:** In your current screenshot, the image is in one box and the data is in another. By "fusing" them, you tell the user's brain: *"This data belongs to this image."*
2.  **Removal of "Visual Noise":** You currently have four concentric rounded shapes (The screen, the image box, the metadata pill, the inner pill). This is "Border Overload." Removing the pills cleans up the UI significantly.
3.  **Technical Credibility:** Monospaced fonts instantly make an app look like a specialized tool rather than a generic hobbyist app.

**Pro Tip for Implementation:** 
Ensure the `imageContainer` has `overflow: 'hidden'` so that the new bottom Metadata Bar and the Image share the same rounded corner at the bottom perfectly.