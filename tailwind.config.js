/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'neutral-artist': {
          50: '#fafaf9', // stone-50
          100: '#f5f5f4', // stone-100
          200: '#e7e5e4', // stone-200
          300: '#d6d3d1', // stone-300
          400: '#a8a29e', // stone-400
          500: '#78716c', // stone-500
          600: '#57534e', // stone-600
          700: '#44403c', // stone-700
          800: '#292524', // stone-800
          900: '#1c1917', // stone-900
        },
        'primary-ui': {
          DEFAULT: '#18181b', // zinc-900
          foreground: '#f4f4f5', // zinc-100
        },
        'paint-accent': {
          DEFAULT: '#e07a5f', // soft terracotta
          dark: '#c45a3f',
        }
      },
    },
  },
  plugins: [],
}
