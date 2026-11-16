/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        softRose: '#FFC0CB',
        magentaBloom: '#D23669',
        floralWhite: '#FFFAF0',
        deepCharcoal: '#333333',
        petalLight: '#FFF0F5',
        sageCalm: '#E8F3EE',
      },
      borderRadius: {
        '3xl': '24px',
      }
    },
  },
  plugins: [],
};

