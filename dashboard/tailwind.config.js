/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme base colors
        dark: {
          50: '#f8fafc',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#020617',
        },
        // Colorblind-friendly primary (Blue)
        primary: {
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339eff',
          500: '#0077BB',
          600: '#0066a3',
          700: '#00558a',
          800: '#004472',
          900: '#003359',
        },
        // Colorblind-friendly secondary (Orange)
        secondary: {
          50: '#fff4eb',
          100: '#ffe9d6',
          200: '#ffd3ad',
          300: '#ffbd85',
          400: '#ffa75c',
          500: '#EE7733',
          600: '#d4682d',
          700: '#ba5a27',
          800: '#9f4c21',
          900: '#853e1b',
        },
        // Accent colors (colorblind-friendly)
        accent: {
          cyan: '#33BBEE',
          magenta: '#EE3377',
          yellow: '#CCBB44',
          teal: '#009988',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
