import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/react-tailwindcss-datepicker/dist/index.esm.js',
  ],
  // Tailwind optimises which classes are brought in. This breaks
  // dynamic behavior in some cases.
  safelist: [
    // We use dynamic cols for TransactionForm when showing exchange rate
    'visible',
    {
      pattern: /col-span-.*/,
    },
    // padding is added dynamically to expandable tables
    {
      pattern: /pl-.*/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', ...defaultTheme.fontFamily.sans],
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))'
      },
      colors: {
        dark: {
          50: '#f3f4f5',
          100: '#e5e7e9',
          200: '#cfd3d7',
          300: '#b9bfc4',
          400: '#a2a9af',
          500: '#8b9399',
          600: '#777f85',
          700: '#3a444e',
          800: '#323b44',
          900: '#282f36',
        },
        light: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}

