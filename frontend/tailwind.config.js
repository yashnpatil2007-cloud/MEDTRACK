/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070F1E',
          900: '#0B192C',
          850: '#0F213A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        teal: {
          900: '#134E4A',
          700: '#0F766E',
          600: '#0D9488',
          500: '#14B8A6',
          400: '#2DD4BF',
          100: '#CCFBF1',
          50: '#F0FDFA',
        },
        cyan: {
          600: '#0891B2',
          500: '#06B6D4',
          400: '#22D3EE',
          100: '#CFFAFE',
          50: '#ECFEFF',
        },
        emergency: {
          900: '#7F1D1D',
          700: '#B91C1C',
          600: '#DC2626',
          500: '#EF4444',
          100: '#FEE2E2',
          50: '#FEF2F2',
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
