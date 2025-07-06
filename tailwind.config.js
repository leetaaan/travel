/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'preloader-pulse': {
          '0%': { opacity: '.5', transform: 'scale(0)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        }
      },
      animation: {
        'preloader-pulse': 'preloader-pulse 1.5s linear infinite',
        'preloader-pulse-delay': 'preloader-pulse 1.5s linear infinite 0.3s',
      }
    },
  },
  plugins: [],
}