/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F2ECE1',
          300: '#E7DEC9',
          400: '#D5C7A3',
          500: '#C2B07E',
        },
        crimson: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F7C5CD',
          300: '#EF94A3',
          400: '#E25B74',
          500: '#C41E3D',
          600: '#9E1B32',
          700: '#801326',
          800: '#64101F',
          900: '#4D0C18',
        },
        paper: {
          yellow: '#FEF08A',
          mint: '#D1FAE5',
          lavender: '#EDE9FE',
          pink: '#FFE4E6',
          sky: '#E0F2FE',
          cream: '#FFFBEB',
          velvet: '#27272A',
        }
      },
      fontFamily: {
        hand: ['Caveat', 'Patrick Hand', 'cursive', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'paper': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.04)',
        'paper-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
        'paper-floating': '0 20px 30px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
