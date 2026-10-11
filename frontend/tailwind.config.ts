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
        saas: {
          bg: "#0B0F17",
          panel: "#111827",
          card: "#1E293B",
          cardHover: "#243247",
          border: "rgba(51, 65, 85, 0.45)",
          borderMuted: "rgba(51, 65, 85, 0.25)",
          primary: "#0284C7",
          primaryHover: "#0369A1",
          primaryFocus: "#38BDF8",
        },
        canvas: {
          light: "#F8FAFD",
          dark: "#0B0F17",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#111827",
          cardDark: "#1E293B",
          hover: "#F1EFEA",
          darkHover: "#1E293B",
          border: "#E0E3E7",
          darkBorder: "rgba(51, 65, 85, 0.45)",
        },
        m3: {
          surfaceBg: "#F8FAFD",
          surfaceContainer: "#FFFFFF",
          surfaceContainerLow: "#F0F4F9",
          surfaceContainerHigh: "#E9EEF6",
          primary: "#0284C7",
          primaryHover: "#0369A1",
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
