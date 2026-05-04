/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00236f',
          container: '#1e3a8a',
        },
        secondary: {
          DEFAULT: '#006c49',
          container: '#6cf8bb',
        },
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          container: '#e5eeff',
        },
        'on-surface': '#0b1c30',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
      }
    },
  },
  plugins: [],
}
