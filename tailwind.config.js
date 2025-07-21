/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        silver: {
          50: '#f0f9fa',
          100: '#daf1f3',
          200: '#b8e3e8',
          300: '#87cdd5',
          400: '#4fb0bc',
          500: '#378388', // Primary silver theme color
          600: '#2f6b70',
          700: '#2a575c',
          800: '#26484c',
          900: '#233d41',
          950: '#132528',
        },
        // Additional marketplace colors
        marketplace: {
          primary: '#378388',
          secondary: '#f0f9fa',
          accent: '#4fb0bc',
          dark: '#233d41',
          light: '#daf1f3',
        }
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};
