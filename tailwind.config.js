/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        brand: ['"Cinzel"', 'serif'],
        gothic: ['"Cinzel"', 'serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#eab308', // yellow-500
          hover:   '#ca8a04', // yellow-600
          subtle:  '#422006', // yellow-950
          light:   '#fef08a', // yellow-200 — texto sobre fondo oscuro
        },
      },
    },
  },
  plugins: [],
};
