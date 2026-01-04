For **Phase 2**, we focus on the "Active Image." Since PalettePro relies on the same image across three different tabs (Picker, Palette, and Squint), we need a robust central state and a high-performance image rendering component.

Here are the modular prompts for Phase 2:

---

### Prompt 1: Global Project State (Zustand Setup)
**Focus:** Creating a lightweight, high-performance store to keep the image data synchronized across the Bottom Tabs.

> "Install `zustand`. Create a global store in `store/useProjectStore.ts` to manage the active project image.
> 1. **State variables:** `imageUri` (string | null), `imageDimensions` ({width, height} | null), and `isUploading` (boolean).
> 2. **Actions:** 
>    - `setImage(uri, dimensions)`: Update the active image.
>    - `resetProject()`: Clear the current image.
> 3. Ensure the store is typed with TypeScript. 
> 4. Integrate a basic check: if a user is a 'Guest' (from our AuthContext), images are only stored locally in the state. If logged in, we will later trigger a Supabase upload."

---

### Prompt 2: Image Picker Service & Permissions
**Focus:** Implementing the bridge between the device's hardware (Camera/Gallery) and the app.

> "Implement an `ImagePickerService` using `expo-image-picker`. 
> 1. Create a hook or utility function `useImagePicker` that handles:
>    - Requesting permissions for both Media Library and Camera.
>    - `pickImage()`: Opens the gallery with options to allow basic editing/cropping.
>    - `takePhoto()`: Opens the camera.
> 2. Upon a successful pick, extract the image URI and its width/height dimensions.
> 3. Update the `useProjectStore` with the result.
> 4. Use `lucide-react-native` icons for 'Image' and 'Camera' buttons in a simple 'Empty State' UI on the Home (Picker) screen."

---

### Prompt 3: Supabase Storage Configuration
**Focus:** Cloud persistence for authenticated artists.

> "Set up the Supabase Storage logic for PalettePro.
> 1. Provide the SQL or instructions to create a public bucket named `reference-images` in the Supabase dashboard.
> 2. Create a utility `services/storageService.ts` with an `uploadReferenceImage(uri, userId)` function.
> 3. The function should:
>    - Convert the file URI to a Blob/ArrayBuffer.
>    - Upload the file to a folder named after the `userId`.
>    - Return the public URL of the uploaded image.
> 4. Add logic to the `pickImage` flow: if `user` is authenticated in `AuthContext`, automatically upload the image to Supabase and store the *remote* URL in the Zustand store instead of the local one."

---

### Prompt 4: The "Image Canvas" Base Component
**Focus:** A high-performance, responsive UI component that displays the image consistently across all features.

> "Create a reusable component `components/ImageCanvas.tsx` using **NativeWind v4** and **Reanimated v4**.
> 1. This component should consume the `imageUri` from `useProjectStore`.
> 2. **Layout:** The image should be contained within the screen bounds while maintaining its aspect ratio (use `resizeMode: 'contain'`).
> 3. **Styling:** Add a subtle 'neutral-stone' border or shadow to give it a 'canvas on an easel' feel.
> 4. **Animation:** Use Reanimated to create a smooth 'fade-in and scale-up' entrance animation when a new image is loaded.
> 5. **Empty State:** If no image is selected, display a centered 'Upload' area with a dashed border and an icon."

---

### Prompt 5: Cross-Tab Image Persistence Logic
**Focus:** Ensuring the user doesn't lose their work when switching between the Picker, Palette, and Squint tabs.

> "Refactor the `(tabs)/index.tsx`, `(tabs)/palette.tsx`, and `(tabs)/squint.tsx` screens to handle the shared state.
> 1. Each screen should check the `useProjectStore`. 
> 2. If `imageUri` is null, show a 'No Image Selected' view with a button to redirect the user to the Picker tab or open the Image Picker.
> 3. If `imageUri` exists, render the `ImageCanvas` at the top of the screen, leaving the bottom half of the screen for the tab-specific features (which we will build in Phase 3 and 4)."

---

### Prompt 6: Interactive Bottom Sheet for Uploads
**Focus:** Enhancing the UX for selecting images using a modern drawer.

> "Install `@gorhom/bottom-sheet`. 
> 1. Create a `components/UploadBottomSheet.tsx` component.
> 2. This sheet should trigger when the user taps the 'Upload' area.
> 3. Provide three clear options: 'Take Photo', 'Choose from Gallery', and 'Cancel'.
> 4. Style the sheet using NativeWind to match our neutral 'Artist' theme (Zinc/Stone colors).
> 5. Ensure the sheet works smoothly with the Expo Router navigation."

---

### What this accomplishes:
By the end of this phase, your app will have:
1.  **Cloud vs. Local storage:** Intelligent handling of guests vs. logged-in users.
2.  **Shared State:** You can upload an image on the "Picker" tab, switch to the "Palette" tab, and see the same image instantly.
3.  **UI Foundation:** A beautiful, animated canvas ready to have the color-picking logic overlaid in the next phase.

**I recommend beginning with Prompt 1 and 2 together.**