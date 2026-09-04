import type { Config } from "tailwindcss";

// NOTE: Tailwind v4 reads design tokens from `@theme` in src/styles/globals.css.
// This config mirrors them for editor tooling / IntelliSense and content globs.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette (KBL original, v3 restore)
        ink: "#1a1a1a",
        paper: "#fafaf8",
        canvas: "#cfcabd",
        purple: "#5b2bff",
        green: "#0e8c6a",
        gold: "#f2b705",
        coral: "#e84b2a",
        muted: {
          DEFAULT: "#5d5949",
          2: "#8a8676",
          3: "#a39e8c",
        },
        cream: {
          200: "#e7e1d3",
          300: "#efe9dc",
        },
        // Back-compat semantic tokens, remapped to the new brand
        primary: {
          DEFAULT: "#1a1a1a",
          light: "#5b2bff",
        },
        accent: {
          DEFAULT: "#ff6b35",
          light: "#fff3ee",
          dark: "#e55a2b",
          purple: "#5b2bff",
          indigo: "#5b2bff",
        },
        background: {
          DEFAULT: "#fafaf8",
          gray: "#efe9dc",
        },
        text: {
          DEFAULT: "#1a1a1a",
          secondary: "#6b6757",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        display: ["Bricolage Grotesque", "Pretendard", "system-ui", "sans-serif"],
        serif: ["Newsreader", "Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
