/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      keyframes: {
        'preloader-pulse': {
          '0%': { opacity: '.5', transform: 'scale(0)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-delay': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(20, 184, 166, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.8)' },
        }
      },
      animation: {
        'preloader-pulse': 'preloader-pulse 1.5s linear infinite',
        'preloader-pulse-delay': 'preloader-pulse 1.5s linear infinite 0.3s',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'fade-in-left': 'fade-in-left 0.6s ease-out',
        'fade-in-right': 'fade-in-right 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float-delay 6s ease-in-out infinite 2s',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'glow': 'glow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}