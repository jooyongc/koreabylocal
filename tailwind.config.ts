import type { Config } from "tailwindcss";

// NOTE: Tailwind v4 reads design tokens from `@theme` in src/styles/globals.css.
// This config mirrors them for editor tooling / IntelliSense and content globs.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette (2026 renewal)
        ink: "#100f2c",
        paper: "#f6f1e7",
        canvas: "#cfcabd",
        purple: "#5b2bff",
        green: "#0e8c6a",
        gold: "#f2b705",
        coral: "#e8452a",
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
          DEFAULT: "#100f2c",
          light: "#5b2bff",
        },
        accent: {
          DEFAULT: "#ff2d78",
          purple: "#5b2bff",
          indigo: "#5b2bff",
        },
        background: {
          DEFAULT: "#f6f1e7",
          gray: "#efe9dc",
        },
        text: {
          DEFAULT: "#100f2c",
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
