import type { Config } from "tailwindcss";

/**
 * NLC brand-aligned Tailwind theme.
 * Brand tokens mirror the main NLC website (CLAUDE.md):
 *   --primary (navy)   #24285e
 *   --secondary (orange) #F6851F
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#24285e",
          50: "#eef0f7",
          100: "#d3d6e8",
          700: "#2c3170",
          800: "#24285e",
          900: "#1a1d47",
        },
        orange: {
          DEFAULT: "#F6851F",
          light: "#ff9d44",
          dark: "#d96d0c",
        },
        canvas: "#F0EFEF",
      },
      fontFamily: {
        // Bizmo is the NLC brand font; Inter is a clean corporate fallback.
        sans: ["Bizmo", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(36, 40, 94, 0.06), 0 1px 2px rgba(36, 40, 94, 0.04)",
        "card-hover": "0 8px 24px rgba(36, 40, 94, 0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
