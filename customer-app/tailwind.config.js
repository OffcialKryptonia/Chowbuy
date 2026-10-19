/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#FF5A1F', alt: '#FF6A00', soft: '#FFEBDF', ink: '#A83208' },
        ok: { DEFAULT: '#00A86B', alt: '#00C070', soft: '#DFF6EB' },
        warn: { DEFAULT: '#B7791F', soft: '#FDF1D6' },
        bad: { DEFAULT: '#D92D20', soft: '#FDE7E4' },
        bg: { DEFAULT: '#FAF8F7', dark: '#0B0F1A' },
        surface: { DEFAULT: '#FFFFFF', dark: '#151B2A' },
        fill: { DEFAULT: '#F4F1EF', dark: '#1D2536' },
        line: { DEFAULT: '#ECE8E5', dark: '#263046' },
        ink: { DEFAULT: '#171311', dark: '#F3F5F9' },
        mute: { DEFAULT: '#6B625D', dark: '#A3ADBF' },
      },
      fontFamily: { display: ['Sora_700Bold'], body: ['Inter_500Medium'] },
    },
  },
  plugins: [],
};
