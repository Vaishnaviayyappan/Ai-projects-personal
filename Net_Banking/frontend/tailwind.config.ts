import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2A4A',
          light: '#1D3E63',
          dark: '#0A1F38',
        },
        teal: {
          DEFAULT: '#0E9F8A',
          light: '#14B89F',
          dark: '#0B7A69',
        },
        success: {
          DEFAULT: '#16A34A',
          bg: '#F0FDF4',
        },
        error: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#FFFBEB',
        },
        appbg: '#F6F8FB',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
      },
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-slide-in': 'fadeSlideIn 150ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
