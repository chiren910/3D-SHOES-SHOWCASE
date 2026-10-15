/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        wide: ['Syncopate', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: '#06070B',
        carbon: '#0D0F17',
        volt: '#D4FF00',
        crimson: '#FF2A54',
        cryo: '#00F0FF',
      },
    },
  },
  plugins: [],
};
