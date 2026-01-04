# PalettePro

A professional color palette extraction and oil paint mixing app for artists. Built with React Native, Expo, and Supabase.

## Features

### Phase 1-3: Foundation
- **User Authentication**: Supabase-powered auth with email/password
- **Image Selection**: Pick from gallery or take photos
- **Color Picking**: Interactive canvas with color inspection
- **Oil Paint Mixing Engine**: Calculate paint recipes using the Universal Palette

### Phase 4: Advanced Analysis Tools
- **Palette Generator**: Extract dominant colors using K-Means clustering
  - Adjustable color count (4, 6, 8, or 12 colors)
  - Beautiful swatch display with HEX codes

- **Squint Tool**: Gaussian blur for simplified shape analysis
  - GPU-accelerated Skia blur filter
  - Real-time intensity control (0-50)

- **Value Map**: Grayscale and posterization analysis
  - Toggle grayscale mode
  - Posterization slider (1-12 levels)
  - Helps identify tonal relationships

- **Mixing Recipe Integration**: Tap any palette color to see:
  - Side-by-side comparison (digital vs physical mix)
  - Step-by-step mixing instructions
  - Match quality indicator
  - Uses Universal Palette pigments

- **Supabase Persistence**: Save and manage color palettes
  - Cloud storage with Row Level Security
  - Named palette collections
  - Links to source images

## Tech Stack

- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **NativeWind v4** for styling (TailwindCSS)
- **Reanimated v4** for smooth animations
- **Skia** for GPU-accelerated image processing
- **Supabase** for auth and database
- **Bottom Sheet** for beautiful modals
- **Expo Haptics** for tactile feedback

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/palette-pro.git
   cd palette-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Supabase credentials:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

4. Set up Supabase database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the migration in `supabase/migrations/create_palettes_table.sql`

5. Prebuild native modules:
   ```bash
   npx expo prebuild --clean
   ```

6. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

```
palette-pro/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Studio (color picker)
│   │   ├── palette.tsx    # Palette generator
│   │   ├── squint.tsx     # Squint/blur tool
│   │   └── valuemap.tsx   # Value map tool
│   ├── login.tsx          # Authentication screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── constants/             # Static data (pigments, colors)
├── context/              # React context providers (Auth)
├── lib/                  # Third-party integrations (Supabase)
├── services/             # Business logic (palette service)
├── store/                # Zustand state management
├── supabase/             # Database migrations
└── utils/                # Helper functions
    ├── paletteEngine.ts  # K-Means color extraction
    ├── mixingEngine.ts   # Oil paint mixing calculations
    └── colorUtils.ts     # Color conversion utilities
```

## Features Documentation

### Color Picker (Studio Tab)
- Load images from gallery or camera
- Interactive canvas with pinch-to-zoom
- Tap to sample colors
- Real-time color HUD showing HEX, RGB values

### Palette Generator
- Extracts dominant colors using K-Means clustering
- Adjustable palette size (4-12 colors)
- Save palettes to cloud with custom names
- Tap any swatch to see mixing recipe

### Squint Tool
- Real-time Gaussian blur (GPU-accelerated)
- Simulates the artist's "squint test"
- Helps identify major shapes and composition

### Value Map
- Converts image to grayscale
- Posterization effect (2-12 tonal levels)
- Essential for understanding light/shadow relationships

### Mixing Recipe
- Calculates closest match using Universal Palette
- Shows single pigments, 50/50 mixes, and tints
- Visual comparison of target vs mixed color
- Match quality percentage

## Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run prebuild` - Generate native folders

## Environment Variables

See `.env.example` for required variables.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Universal Palette based on traditional oil painting pigments
- K-Means clustering for color extraction
- Skia graphics engine for performant image processing
