import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: "#0B0F17",
          panel: "#131B2E",
          panelHover: "#18223B",
          border: "#1E293B",
          borderLight: "#334155",
          accent: "#F97316",
          accentHover: "#EA580C",
          textLight: "#F8FAFC",
          textMuted: "#94A3B8",
          blue: "#38BDF8",
          green: "#10B981",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "monospace"],
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
