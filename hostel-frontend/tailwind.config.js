/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1d4ed8', light: '#3b82f6', dark: '#1e3a8a' },
        success: { DEFAULT: '#10b981', light: '#34d399', dark: '#047857' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24', dark: '#b45309' },
        danger: { DEFAULT: '#ef4444', light: '#f87171', dark: '#b91c1c' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
};
