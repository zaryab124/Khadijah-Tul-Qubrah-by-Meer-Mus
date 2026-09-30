/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#072A20',
          'emerald-light': '#0B3D2E',
          gold: '#C5A059',
          'gold-light': '#D4AF37',
          ivory: '#FCFBF7',
          dark: '#121212',
        },
      },
    },
  },
  plugins: [],
};
