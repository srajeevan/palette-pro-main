To ensure a solid foundation for **PalettePro**, I have broken Phase 1 into **7 modular prompts**. You can run these one by one with your AI coding assistant.

### Prompt 1: Project Initialization & Dependency Scaffolding
**Focus:** Setting up the base Expo project and installing all necessary libraries for the entire stack.

> "Initialize a new Expo project named 'palette-pro' using `npx create-expo-app@latest -t tabs`. 
> 
> Install the following core dependencies:
> 1. **Styling:** `nativewind@latest`, `tailwindcss`
> 2. **Animations:** `react-native-reanimated` (v4 if available, otherwise latest stable), `react-native-gesture-handler`
> 3. **Backend:** `@supabase/supabase-js`, `@react-native-async-storage/async-storage`
> 4. **Navigation:** `expo-router`
> 5. **Icons:** `lucide-react-native`
> 6. **Dev Client:** `expo-dev-client`
> 
> Configure the `package.json` with a script for the development build: `"ios": "npx expo run:ios"` and `"android": "npx expo run:android"`. Ensure the project structure uses the `/app` directory for Expo Router."

---

### Prompt 2: NativeWind v4 & Tailwind Configuration
**Focus:** Setting up the CSS-to-Native engine and defining the "Artist Neutral" color palette.

> "Configure **NativeWind v4** for this Expo project. 
> 1. Create a `tailwind.config.js` file. 
> 2. Set up the theme to include a 'neutral-artist' color palette using Zinc and Stone shades (e.g., `bg-stone-50` for canvas, `bg-zinc-900` for primary UI). 
> 3. Define a vibrant accent color called 'paint-accent' (a soft terracotta or deep teal).
> 4. Configure `babel.config.js` to include the NativeWind babel plugin.
> 5. Create a global CSS file (`global.css`) as per NativeWind v4 requirements and import it into the root `_layout.tsx`."

---

### Prompt 3: Expo Dev Client & Reanimated Setup
**Focus:** Preparing the app for native modules and high-performance animations.

> "Configure the `app.json` (Expo config) to support a **Development Build**. 
> 1. Set a unique `bundleIdentifier` for iOS and `package` name for Android.
> 2. Add the `expo-dev-client` plugin.
> 3. Ensure the `react-native-reanimated/plugin` is added to `babel.config.js` as the **last** item.
> 4. Create a basic 'Debug' screen that confirms `Reanimated` and `Gesture Handler` are working by rendering a simple draggable box using a `PanGestureHandler` and `useAnimatedStyle`."

---

### Prompt 4: Supabase Client & Database Schema
**Focus:** Setting up the cloud backend and the initial user profile table.

> "Initialize Supabase for PalettePro.
> 1. Create a `lib/supabase.ts` file to initialize the Supabase client using environment variables (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
> 2. Provide the SQL schema to be run in the Supabase SQL Editor to create a `profiles` table. The table should have:
>    - `id` (references auth.users)
>    - `username` (text)
>    - `avatar_url` (text)
>    - `preferred_brand` (text, e.g., 'Winsor & Newton')
>    - `updated_at` (timestamp)
> 3. Set up basic Row Level Security (RLS) so users can only read/write their own profile data."

---

### Prompt 5: Navigation - Tab Bar & Folder Structure
**Focus:** Implementing the Bottom Navigation Bar with the specific PalettePro features.

> "Set up the **Expo Router Tab Navigation** in the `/app/(tabs)` directory.
> 1. Create four tabs: `index.tsx` (Picker), `palette.tsx` (Generator), `squint.tsx` (Tonal Analysis), and `profile.tsx` (Settings).
> 2. Customize the `_layout.tsx` for the tabs:
>    - Use a neutral, minimalist design.
>    - Add icons from `lucide-react-native` for each tab (e.g., Pipette, Palette, Eye, User).
>    - Hide the header for the main screens to allow for a full-screen image experience later."

---

### Prompt 6: Authentication Layer (Context Provider)
**Focus:** Handling Guest vs. Authenticated state across the app.

> "Create an `AuthProvider` using React Context in `context/AuthContext.tsx`.
> 1. It should track the current `session` and `user` using Supabase's `onAuthStateChange`.
> 2. Implement a `loading` state to prevent flickering during app boot.
> 3. Include a `isGuest` boolean state.
> 4. Wrap the root `_layout.tsx` with this provider.
> 5. Create a basic `Auth` UI component for the `profile.tsx` tab that allows for Email/Password and Google login placeholders."

---

### Prompt 7: Global Theme Engine & UI Components
**Focus:** Finalizing the "Neutral Tones with Vibrant Accents" design system.

> "Create a set of reusable UI components in `/components` using **NativeWind v4**:
> 1. `AppText`: A custom text component that defaults to a clean sans-serif font and 'zinc-800' color.
> 2. `AppButton`: A styled button with variants for 'primary' (vibrant accent), 'secondary' (neutral stone), and 'outline'.
> 3. `AppHeader`: A minimalist header component that fits the artistic theme.
> 4. Apply a global background color of `stone-100` to all screens in the `(tabs)/_layout.tsx` to ensure a consistent 'canvas' feel."

---

### How to proceed:
1. Start with **Prompt 1**. 
2. Once the project is created and dependencies are installed, move to **Prompt 2**.
3. **Crucial:** After **Prompt 3**, you must run `npx expo run:ios` or `npx expo run:android` to build your development client, as NativeWind v4 and Reanimated v4 require native code compilation.