/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          50: '#fff0f5',
          100: '#ffe0ec',
          200: '#ffc2d9',
          300: '#ff94bb',
          400: '#ff5c95',
          500: '#ff2d72',
          600: '#f0005a',
          700: '#c9004d',
          800: '#a50043',
          900: '#8a003c',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        }
      }
    },
  },
  plugins: [],
}
