import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // React core
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-router") ||
              id.includes("/scheduler/")
            ) {
              return "react-vendor";
            }
            // Data layer
            if (id.includes("@tanstack/react-query")) return "query-vendor";
            // Supabase
            if (id.includes("@supabase/")) return "supabase";
            // Rich text editor (admin-only)
            if (id.includes("@tiptap/") || id.includes("prosemirror")) return "editor";
            // Drag and drop (admin-only)
            if (id.includes("@dnd-kit/")) return "dnd";
            // Carousel
            if (id.includes("swiper")) return "swiper";
            // Date formatting
            if (id.includes("date-fns")) return "date-fns";
            // Form handling
            if (id.includes("react-hook-form")) return "react-hook-form";
          }
        },
      },
    },
  },
});
