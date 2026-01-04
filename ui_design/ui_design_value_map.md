Here are the modular prompts to transform the **Value Map** screen.

We will focus on fixing the **overlap with the Floating Navbar**, making the image **immersive**, and grouping the controls (Grayscale & Posterization) into a **clean, professional card**.

### Module 1: Layout Refactor (Header & Safe Area)

**Goal:** clear the bottom area for the navbar and style the header to match the app's new brand.

**Prompt:**
> Refactor the main layout of the `ValueMapScreen`.
>
> **Layout Changes:**
> 1.  **Bottom Padding:** Apply `paddingBottom: 120px` to the main container. This is critical to ensure the controls sit *above* the new floating navigation bar.
> 2.  **Header Styling:**
>     *   **Title:** Change "Value Map" to use **Playfair Display** (Bold, 32px, Color: #1A1A1A).
>     *   **Subtitle:** Change "Light, mid-tone, and shadow" to **Inter** (Medium, 16px, Color: #666).
> 3.  **Spacing:** Reduce the top margin so the header sits tighter to the top of the screen.

---

### Module 2: The Immersive Canvas (Image Area)

**Goal:** Maximize the image size so it feels like a workspace, not a thumbnail.

**Prompt:**
> Update the image container styling in `ValueMapScreen`.
>
> **Visual Requirements:**
> 1.  **Full Width:** Remove any `paddingHorizontal` from the parent view relative to the image. The image should touch the left and right edges of the screen.
> 2.  **Vertical Expansion:** Set the image container to `flex: 1`. It should fill all available vertical space between the Header and the Bottom Controls.
> 3.  **Styling:**
>     *   **Border Radius:** Apply `borderBottomLeftRadius: 32` and `borderBottomRightRadius: 32` to the image container.
>     *   **Depth:** Add a soft shadow (`shadowColor: "#000"`, `shadowOpacity: 0.1`, `shadowRadius: 20`, `offset: {0, 10}`) to lift the image off the background.

---

### Module 3: The "Value Controls" Card

**Goal:** Group the "Grayscale" toggle and "Posterization" slider into a unified, sleek floating card.

**Prompt:**
> Create a new modular component named `ValueControls.tsx` to replace the current bottom controls.
>
> **Card Container Design:**
> 1.  **Shape:** A floating card with `backgroundColor: 'white'`, `borderRadius: 24`, and `marginHorizontal: 16`.
> 2.  **Shadow:** Apply a high-quality shadow (`elevation: 5` or `shadowOpacity: 0.08`, `shadowRadius: 10`).
> 3.  **Position:** Place this component at the bottom of the screen content (inside the padding area defined in Module 1).
>
> **Internal Layout:**
> 1.  **Row 1 (Grayscale Toggle):**
>     *   `Flex-Row` with "Space Between".
>     *   **Label:** "Grayscale Mode" (Inter, Medium, 14px, #333).
>     *   **Icon:** Add a small "Layers" or "Eye" icon next to the text if available.
>     *   **Control:** The existing `Switch`. Style the "On" track color to Black (`#1A1A1A`) and "Off" to Light Gray (`#E0E0E0`).
> 2.  **Separator:** Add a subtle horizontal divider line (`height: 1`, `backgroundColor: '#F5F5F5'`, `marginVertical: 12`).
> 3.  **Row 2 (Posterization Slider):**
>     *   **Header:** Text "Posterization Levels" (Inter, Medium, 14px, #333).
>     *   **Value Indicator:** Display the current level (e.g., "4") in Bold Inter font on the right side.
>     *   **Slider:** Place the slider below the text.
>         *   Make the track thicker (6px) with rounded ends.
>         *   Make the thumb a solid black circle (or white with shadow).

---

### Module 4: Polish & Animation

**Goal:** Add entrance animations so the UI doesn't look static.

**Prompt:**
> Add entrance animations to the `ValueControls` component using `react-native-reanimated`.
>
> **Tasks:**
> 1.  **Card Entry:** Wrap the `ValueControls` card in an `Animated.View`.
> 2.  **Effect:** Apply `Entering.FadeInUp.springify().damping(15).delay(100)`.
>     *   *Result:* When the screen loads, the control card should slide up gently from the bottom.
> 3.  **Haptics (Micro-interaction):**
>     *   Trigger `Haptics.selectionAsync()` whenever the Slider value changes (step-by-step) or when the Grayscale switch is toggled.

### Summary of the New Look
*   **Header:** Elegant Serif font.
*   **Image:** Takes up 70% of the screen, rounded at the bottom, looking like a pro photo editor.
*   **Controls:** Instead of floating loosely on the white background, they are organized into a **clean white card** that floats above the Navigation Bar. The slider is easy to grab, and the toggle is clearly defined.