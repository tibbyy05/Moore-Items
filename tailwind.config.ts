import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#0a0e1a',
          900: '#0f1629',
          800: '#1a2340',
          700: '#263059',
          600: '#354170',
          400: '#6b7aad',
          200: '#b4bdd4',
        },
        gold: {
          600: '#a8883e',
          500: '#c8a45e',
          400: '#d4b574',
          300: '#e0c78f',
          100: '#f5ecd8',
        },
        warm: {
          50: '#f7f6f3',
          100: '#efede8',
          200: '#e2dfd8',
          300: '#ccc8be',
          500: '#8a857c',
          700: '#4a4740',
          900: '#1f1e1b',
        },
        success: '#2a9d5c',
        warning: '#e5a020',
        danger: '#d94040',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0e1a, #1a2340, #0f1629)',
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
        lg: '10px',
        md: '8px',
      },
      keyframes: {
        fadeUp: {
          from: {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-12px)',
          },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        toastIn: {
          from: {
            opacity: '0',
            transform: 'translateY(12px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleBounce: {
          '0%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.15)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
        slideInRight: {
          from: {
            opacity: '0',
            transform: 'translateX(24px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease-out',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'toast-in': 'toastIn 0.25s ease-out',
        'scale-bounce': 'scaleBounce 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
