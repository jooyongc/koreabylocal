import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a1a2e",
          dark: "#12121f",
          light: "#2a2a4e",
        },
        accent: {
          DEFAULT: "#e8751a",
          dark: "#c96215",
          light: "#f09040",
        },
        background: {
          DEFAULT: "#ffffff",
          gray: "#f8f9fa",
        },
        text: {
          DEFAULT: "#1a1a2e",
          secondary: "#6b7280",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
