/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class', // enable class‑based dark mode
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // accent colour
      },
    },
  },
  plugins: [],
};
