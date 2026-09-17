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
          light: "#F8FAFD",
          dark: "#121416",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1E1F20",
          hover: "#F1EFEA",
          darkHover: "#2A2B2D",
          border: "#E0E3E7",
          darkBorder: "#303134",
        },
        m3: {
          surfaceBg: "#F8FAFD",
          surfaceContainer: "#FFFFFF",
          surfaceContainerLow: "#F0F4F9",
          surfaceContainerHigh: "#E9EEF6",
          primary: "#0B57D0",
          primaryHover: "#0842A0",
          primaryContainer: "#C2E7FF",
          onPrimaryContainer: "#001D35",
          textPrimary: "#1F1F1F",
          textSecondary: "#444746",
          outline: "#E0E3E7",
          // Scout Stage colors in M3 tonal style
          cubs: "#B06000",
          scouts: "#146C2E",
          rovers: "#0B57D0",
          leaders: "#444746",
        },
        scout: {
          primary: "#0B57D0",
          dark: "#0842A0",
          accent: "#146C2E",
          tint: "#C2E7FF",
          tan: "#B06000",
          tanLight: "#FEF7EC",
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
          'var(--font-arabic)',
          'var(--font-sans)',
          '"Noto Sans Arabic"',
          '"Inter"',
          '"Alexandria"',
          '"Plus Jakarta Sans"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        arabic: [
          'var(--font-arabic)',
          '"Noto Sans Arabic"',
          '"Readex Pro"',
          '"Alexandria"',
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
