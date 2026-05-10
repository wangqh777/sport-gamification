/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#7c6ff7', 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c6ff7', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
        accent: { DEFAULT: '#ff5e7a' },
        gold: { DEFAULT: '#f59e0b' },
        surface: { DEFAULT: '#151530', light: '#1e1e42', dark: '#0b0b1e' },
      },
    },
  },
  plugins: [],
};
