import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Tailwind optimises which classes are brought in. This breaks
  // dynamic behavior in some cases.
  safelist: [
    // We use dynamic cols for TransactionForm when showing exchange rate
    'visible',
    {
      pattern: /col-span-.*/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        gunmetal: {
          50: '#f3f4f5',
          100: '#e5e7e9',
          200: '#cfd3d7',
          300: '#b9bfc4',
          400: '#a2a9af',
          500: '#8b9399',
          600: '#777f85',
          700: '#3a444e',  // Base color
          800: '#323b44',
          900: '#282f36',
        },
      },
    },
  },
  plugins: [],
}

