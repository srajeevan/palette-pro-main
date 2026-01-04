/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'neutral-artist': {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#1C1C1E', // Surface L2
          900: '#0A0A0B', // Rich Obsidian (Global Bg)
        },
        'primary-ui': {
          DEFAULT: '#3E63DD', // Electric Cobalt
          foreground: '#FFFFFF',
        },
        'paint-accent': {
          DEFAULT: '#D1FF52', // Volt Green (High Pop)
          dark: '#b3db3d',
        },
        'obsidian': '#0A0A0B',
        'surface-l1': '#161618', // Navigation Background
        'surface-l2': '#1C1C1E', // Card Background
        'border-midnight': '#28282A',
      },
    },
  },
  plugins: [],
}
