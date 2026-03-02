import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00005a",
          light: "#6312ff",
        },
        accent: {
          DEFAULT: "#f430ff",
          purple: "#d930ff",
          indigo: "#6312ff",
        },
        background: {
          DEFAULT: "#ffffff",
          gray: "#f8f9fa",
        },
        text: {
          DEFAULT: "#00005a",
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
