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
        primary: {
          blue: "#4F63D2",
          "blue-hover": "#3D4EB8",
          "blue-light": "#EEF2FF",
        },
        background: "#F8F9FA",
        card: "#FFFFFF",
        border: "#E5E7EB",
        text: {
          primary: "#1A1A1A",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        accent: {
          green: "#6EBD9F",
          orange: "#F59E0B",
          red: "#EF6D6D",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "'DM Serif Display'",
          "Georgia",
          "serif",
        ],
      },
      fontSize: {
        base: ['1rem', { lineHeight: '1.75rem', fontWeight: '500' }],
      },
      letterSpacing: {
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
      },
    },
  },
  plugins: [],
};

export default config;
