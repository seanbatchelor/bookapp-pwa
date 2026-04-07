/** @type {import('tailwindcss').Config} */

// Mirrors book-playground/tailwind.config.js and src/theme/colors.ts
const green = {
  50:  '#F3FCF6',
  100: '#E2F8EA',
  200: '#C3EFD3',
  300: '#94E1B0',
  400: '#5EC986',
  500: '#37AE63',
  600: '#298E4E',
  700: '#237040',
  800: '#205A36',
  900: '#1D492D',
  950: '#0B2816',
};

// Tailwind's built-in neutral palette
const neutral = {
  50:  '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
};

const red = {
  50:  '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
};

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        xs:   ['12px', { lineHeight: '14px' }],
        sm:   ['14px', { lineHeight: '16px' }],
        base: ['16px', { lineHeight: '20px' }],
        lg:   ['18px', { lineHeight: '24px' }],
        xl:   ['22px', { lineHeight: '28px' }],
        '2xl': ['26px', { lineHeight: '32px' }],
      },
      fontFamily: {
        sans:     ['"Work Sans"', 'sans-serif'],
        medium:   ['"Work Sans"', 'sans-serif'],
        semibold: ['"Work Sans"', 'sans-serif'],
        bold:     ['"Work Sans"', 'sans-serif'],
      },
      colors: {
        // Primary brand tokens
        primary:    green[500],
        primaryDark: green[600],
        background: green[100],
        surface:    green[50],
        border:     green[200],
        foreground: neutral[900],
        muted:      neutral[800],
        subtle:     neutral[700],

        // Semantic purpose tokens
        danger:            red[600],
        'danger-surface':  red[50],
        'danger-text':     red[700],
        neutral:           neutral[600],
        'neutral-surface': neutral[100],

        // Green palette exposed for direct use
        green,
      },
    },
  },
  plugins: [],
}
