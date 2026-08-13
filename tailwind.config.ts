import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        amharic: ["var(--font-noto-serif-ethiopic)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#fdf7ec",
          100: "#f9e9c8",
          200: "#f0cd82",
          300: "#e3ac4a",
          400: "#cf8a2b",
          500: "#a8671f", // primary institutional gold/brown
          600: "#7f4e19",
          700: "#5c3814",
          800: "#3c2510",
          900: "#241609"
        },
        ink: {
          900: "#1b1712"
        }
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
