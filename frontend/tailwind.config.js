/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#001748',
          container: '#0D2B6B',
          fixed: '#dbe1ff',
          'fixed-dim': '#b3c5ff',
        },
        secondary: {
          DEFAULT: '#855300',
          container: '#FEA619',
        },
        surface: {
          DEFAULT: '#F8F9FB',
          'container-lowest': '#FFFFFF',
          'container-low': '#F2F4F6',
          container: '#edeef0',
          'container-highest': '#E1E2E4',
        },
        outline: {
          variant: '#C5C6D2',
        },
        error: {
          DEFAULT: '#ba1a1a',
        },
        on: {
          primary: '#ffffff',
          surface: '#191C1E',
          'surface-variant': '#444650',
        }
      },
      fontFamily: {
        sans: ['"Public Sans"', 'sans-serif'],
        serif: ['Newsreader', 'serif'],
      },
      boxShadow: {
        ambient: '0 4px 20px rgba(0, 23, 72, 0.04)',
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
