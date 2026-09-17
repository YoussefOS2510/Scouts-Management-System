import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: "#F8F7F4",
          dark: "#0F1412",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#161D1A",
          hover: "#F1EFEA",
          darkHover: "#1E2723",
          border: "#E2DED6",
          darkBorder: "#27342F",
        },
        scout: {
          primary: "#1B4332",
          dark: "#143326",
          accent: "#2D6A4F",
          tint: "#E8F0EC",
          tan: "#C87A28",
          tanLight: "#FDF6EC",
          50: "#f0fdf4",
          100: "#E8F0EC",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#2D6A4F",
          600: "#1B4332",
          700: "#183e2e",
          800: "#143326",
          900: "#0e231a",
          950: "#06130e",
        },
      },
      fontFamily: {
        sans: [
          'var(--font-alexandria)',
          'var(--font-jakarta)',
          '"Alexandria"',
          '"Plus Jakarta Sans"',
          '"IBM Plex Sans Arabic"',
          '"Cairo"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        arabic: [
          'var(--font-alexandria)',
          '"Alexandria"',
          '"IBM Plex Sans Arabic"',
          '"Cairo"',
          "sans-serif",
        ],
        mono: [
          'var(--font-mono)',
          '"JetBrains Mono"',
          '"Geist Mono"',
          "monospace",
        ],
      },
    },
  },
  plugins: [forms],
};

export default config;
