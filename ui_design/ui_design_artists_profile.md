Here are the **enhanced modular prompts** for Phase 5.

I have updated the original implementation plan to include specific instructions for **Playfair/Inter typography**, **Glassmorphism**, **Gallery-style layouts**, and **Spring animations**. This ensures the "Artist Studio" feels like a premium portfolio, not just a list of files.

---

### Module 1: The "Artist Studio" Dashboard (Profile Screen)

**Goal:** Create a stunning "Gallery View" of the user's saved work, replacing the generic profile list.

**Prompt:**
> Develop the main `ProfileScreen` (Artist Studio) using **NativeWind** and **Reanimated**.
>
> **Layout & Design:**
> 1.  **Header Section:**
>     *   **Typography:** Display the Username in **Playfair Display** (Bold, 32px, Color: #1A1A1A).
>     *   **Stats Row:** Below the name, display "Member since [Year] • [X] Palettes Created" in **Inter** (Medium, 14px, Color: #888).
>     *   **Settings Icon:** Place a sleek "Gear" icon (top right) that opens a settings modal.
> 2.  **The Gallery Grid:**
>     *   Use `@shopify/flash-list` with a `numColumns={2}` layout.
>     *   **Spacing:** Add 16px gap between items.
>     *   **Padding:** Add `paddingHorizontal: 16px` and `paddingBottom: 120px` (to clear the Floating Navbar).
> 3.  **Empty State (Artistic):**
>     *   If the user has no saved palettes, display a centered illustration (use a vector or Lucide icon like `Palette`).
>     *   Text: "Your studio is empty. Start mixing!" in **Playfair Display**.
>     *   Button: A "Create New" pill button (`bg-black`, `rounded-full`) with a shadow.

---

### Module 2: The "Gallery Card" Component (Visuals & Motion)

**Goal:** Design the individual grid items to look like high-end Polaroid or Museum cards.

**Prompt:**
> Create a modular component named `GalleryCard.tsx` for the profile grid.
>
> **Visual Design:**
> 1.  **Container:**
>     *   **Shape:** Rectangular card with `borderRadius: 16`.
>     *   **Background:** White (`#FFFFFF`).
>     *   **Shadow:** Soft iOS shadow (`shadowColor: "#000"`, `shadowOpacity: 0.1`, `shadowRadius: 8`, `offset: {0, 4}`).
> 2.  **Content Layout:**
>     *   **Top (Image):** The saved reference image (Aspect Ratio 1:1 or 4:3). `borderTopLeftRadius: 16`, `borderTopRightRadius: 16`.
>     *   **Bottom (Palette Footer):** A white section (`height: 50px`) displaying the 5 dominant colors as small circles (`width: 24`, `height: 24`, `marginRight: -8` for a stacked look).
> 3.  **Entrance Animation:**
>     *   Use `Reanimated`. Wrap the card in an `Animated.View`.
>     *   Apply `Entering.FadeInDown.delay(index * 100).springify()`. This creates a beautiful cascading effect where images pop in one by one.
> 4.  **Interaction:**
>     *   On Press: Scale down slightly (0.98) and open a Detail Modal.

---

### Module 3: The "Shareable Palette" Generator (Skia Implementation)

**Goal:** Create a hidden canvas that generates an "Instagram-ready" image using your brand fonts.

**Prompt:**
> Implement the `ShareCardGenerator` using **Expo Skia**.
>
> **Canvas Design (Off-screen):**
> 1.  **Dimensions:** 1080x1350 (4:5 Portrait) or 1080x1080 (Square).
> 2.  **Background:** Fill with a textured "Paper" color (`#F9F7F1`) or pure White.
> 3.  **Layout:**
>     *   **Image:** Draw the user's reference image in the top 75% of the canvas. Apply a subtle drop shadow using Skia Paint.
>     *   **Swatches:** In the bottom 25%, draw the 5 palette colors as large circles or rounded squares.
>     *   **Typography:**
>         *   Draw the HEX codes below each swatch using the **Inter** font file.
>         *   Draw the App Logo ("PalettePro") in the bottom center using **Playfair Display**.
> 4.  **Export Logic:**
>     *   Create a function `generateShareImage()` that uses `makeImageSnapshot().encodeToBase64()`.
>     *   Return the file path for sharing.

---

### Module 4: Mixing Notes (The "Field Journal" UI)

**Goal:** Add a text input that feels like writing in an artist's notebook.

**Prompt:**
> Create a `MixingNotesInput` component to be used inside the "Save Palette" modal.
>
> **Visual Design:**
> 1.  **Container:**
>     *   Background: Very light warm gray (`#FAF9F6` - "Off White").
>     *   Border: `borderWidth: 1`, `borderColor: '#E5E5E5'`, `borderRadius: 12`.
>     *   Padding: 16px.
> 2.  **Input Field:**
>     *   **Font:** Use **Inter** (Regular) or a monospaced font like **Courier** for a "notes" vibe.
>     *   **Placeholder:** "Add notes on mixing ratios, lighting, or brushes..." (Color: #999).
>     *   **Min Height:** 100px (Multiline).
> 3.  **Header:**
>     *   Label "Field Notes" in **Playfair Display** (Bold, 14px) above the input.
>     *   Icon: A small "Pencil" icon next to the label.

---

### Module 5: Guest Migration & Sync (Feedback UI)

**Goal:** Make the account creation process feel magical, not bureaucratic.

**Prompt:**
> Implement the "Guest to Member" Migration UI in `AuthContext`.
>
> **Syncing Overlay:**
> 1.  **Visuals:**
>     *   When the user signs up and data is uploading, show a **Full Screen Blur View** (Glassmorphism).
>     *   **Loader:** A custom circular progress indicator (using SVG or Skia) with your brand color.
>     *   **Text:** "Moving your studio to the cloud..." in **Playfair Display** (20px).
> 2.  **Success State:**
>     *   Once finished, animate the loader into a "Checkmark".
>     *   Fade out the overlay to reveal the new Profile Screen populated with their guest data.

---

### Module 6: Social Sharing Trigger (Floating Action)

**Goal:** A sleek button to trigger the sharing flow.

**Prompt:**
> Add an "Export" button to the Palette Detail View.
>
> **Component Design:**
> 1.  **Style:** A **Floating Action Button** (bottom right, above the navbar).
> 2.  **Visuals:**
>     *   Size: 56x56 Circle.
>     *   Background: Black (`#1A1A1A`).
>     *   Icon: White "Share" icon (Lucide/Feather).
>     *   Shadow: `shadowRadius: 10`, `shadowOpacity: 0.3`.
> 3.  **Animation:**
>     *   On press, scale the button to 1.1 and rotate the icon 15 degrees.
>     *   Trigger the `Sharing.shareAsync` function with the image generated from Module 3.

### Recommended Order of Execution:
1.  **Module 1 & 2:** Build the Gallery first. This gives you the visual "Profile" screen.
2.  **Module 4:** Add the Notes functionality (it's easier to implement before the complex sharing logic).
3.  **Module 3 & 6:** Implement the Image Generation and Sharing flow.
4.  **Module 5:** Handle the Guest Migration last (as it requires backend logic).