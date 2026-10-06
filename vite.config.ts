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
        // "name.hash" rather than Vite's default "name-hash": every built file
        // got a new URL once, after browsers cached the SPA fallback HTML
        // under the old URLs for a year (see functions/_middleware.ts).
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // React core. Anchored to the package directory: a bare "/react/"
            // also matched node_modules/@tiptap/react/, which dragged the
            // admin editor into this always-loaded chunk on every public page.
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/react-router") ||
              id.includes("/node_modules/scheduler/")
            ) {
              return "vendor";
            }
            // Data layer
            if (id.includes("@tanstack/react-query")) return "query";
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
