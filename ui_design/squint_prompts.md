Here are the modular prompts to fix the layout overlap and bring the "Squint Tool" screen up to the premium design standard of the rest of your app.

### Module 1: Layout Fix (Clearing the Navigation Bar)

**Goal:** Fix the critical issue where the slider and text are hidden behind the floating navbar.

**Prompt:**
> Refactor the main layout of the `SquintScreen` to account for the new floating navigation bar.
>
> **Layout Changes:**
> 1.  **Container Padding:** Apply `paddingBottom: 120px` to the main parent View (or ScrollView). This creates a "Safe Zone" at the bottom so the content stops *above* the floating navbar, rather than sliding behind it.
> 2.  **Header:**
>     *   Apply the **Playfair Display** font (Bold, 32px, Color: #1A1A1A) to the "Squint Tool" title.
>     *   Apply **Inter** (Medium, 16px, Color: #666) to the subtitle "See shapes, not details."
>     *   Reduce the top margin of the header to save vertical space.

---

### Module 2: Image "Canvas" Styling

**Goal:** Make the image take up the maximum available space and look like a framed canvas.

**Prompt:**
> Update the styling of the Image container in `SquintScreen`.
>
> **Visual Requirements:**
> 1.  **Maximize Width:** Remove any side padding (e.g., `paddingHorizontal`) from the image container. The image should touch the left and right edges of the screen.
> 2.  **Flex Growth:** Ensure the image container has `flex: 1`. It should expand vertically to fill the gap between the Header and the Bottom Controls.
> 3.  **Styling:**
>     *   **Corner Radius:** Apply `borderBottomLeftRadius: 32` and `borderBottomRightRadius: 32` to the image (or its masking container).
>     *   **Shadow:** Add a soft shadow (`shadowOpacity: 0.15`, `shadowRadius: 20`, `offset: {0, 10}`) to the bottom of the image container so it feels like it's lifting off the background.

---

### Module 3: The "Control Deck" (Slider & Info)

**Goal:** Redesign the bottom section (Slider + Text) into a sleek, unified card that sits nicely above the navbar.

**Prompt:**
> Create a new modular component named `SquintControls.tsx` to replace the current bottom section.
>
> **Component Design:**
> 1.  **Container:**
>     *   A "floating card" style view.
>     *   **Background:** White (`#FFFFFF`).
>     *   **Border:** `borderRadius: 24`.
>     *   **Margin:** Horizontal margin of 16px.
>     *   **Shadow:** High-quality iOS shadow (`shadowColor: "#000"`, `shadowOpacity: 0.08`, `shadowRadius: 10`).
> 2.  **Slider Section:**
>     *   **Header Row:** Create a row with "Blur Intensity" (Left, Inter Medium) and the Percentage value (Right, Inter Bold).
>     *   **The Slider:**
>         *   Style the slider track to be thicker (approx 6px height) with rounded ends.
>         *   **Active Color:** Black or Dark Gray.
>         *   **Inactive Color:** Light Gray (`#E0E0E0`).
>         *   **Thumb:** If possible, style the thumb to be a clean white circle with a shadow, or a solid black circle (minimalist).
> 3.  **Info Tip (The Text):**
>     *   Move the text "Squinting helps artists..." inside this card, below the slider.
>     *   **Styling:** Use a subtle background box (`backgroundColor: '#F9F9F9'`, `borderRadius: 12`, `padding: 12`).
>     *   **Typography:** Inter font, size 12px, color `#666`, line height 18px.
>
> **Integration:** Place this `SquintControls` component at the bottom of the content area (just inside the padding we added in Module 1).

### Summary of the Result:
1.  **No Overlap:** The content will sit comfortably above your pink/white navigation dock.
2.  **Immersive Image:** The photo will span edge-to-edge with rounded bottom corners.
3.  **Clean Controls:** Instead of loose text and a thin slider, you'll have a professional "Control Card" that groups the slider and the explanation tip together. 