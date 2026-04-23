/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: '#6366F1',
        },
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          focus: 'var(--color-brand-primary)',
        },
        text: {
          main: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
          soft: '#C4C4CC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        heading: ['Outfit', 'System'],
      },
      borderRadius: {
        xl: 12,
        '2xl': 16,
        '3xl': 24,
      },
    },
  },
  plugins: [],
};
