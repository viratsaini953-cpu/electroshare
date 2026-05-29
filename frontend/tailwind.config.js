/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8f1",
          100: "#feebd8",
          200: "#fcd4b1",
          300: "#f9b27f",
          400: "#f58847",
          500: "#fd7100", // Robu Blaze Orange
          600: "#e05e00",
          700: "#b84900",
          800: "#913800",
          900: "#752d00",
          950: "#3f1500",
        },
        dark: {
          50: "#020617",
          100: "#0f172a", // Dark headings
          200: "#1e293b",
          300: "#334155", // Main body text
          400: "#475569",
          500: "#64748b",
          600: "#94a3b8",
          700: "#cbd5e1",
          800: "#e2e8f0", // Clean borders
          850: "#cbd5e1",
          900: "#ffffff", // Pure White cards
          950: "#f4f6f9", // Light page background
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
