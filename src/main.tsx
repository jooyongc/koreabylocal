import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./styles/globals.css";
import "./i18n";

// Auto-recover from stale chunks after a deploy: when a lazy-loaded chunk's
// hashed filename no longer exists (new deploy), the dynamic import fails. Reload
// once to fetch the fresh index.html (which references the current hashes).
// Guarded so it never loops.
function reloadForStaleChunk() {
  const KEY = "kbl-chunk-reload";
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 15000) return; // don't loop
  sessionStorage.setItem(KEY, String(Date.now()));
  window.location.reload();
}
const STALE_RE =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch dynamically|module script.*MIME type/i;
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  reloadForStaleChunk();
});
window.addEventListener("error", (e) => {
  if (STALE_RE.test(String((e as ErrorEvent)?.message ?? ""))) reloadForStaleChunk();
});
window.addEventListener("unhandledrejection", (e) => {
  const r = (e as PromiseRejectionEvent)?.reason;
  if (STALE_RE.test(String(r?.message ?? r ?? ""))) reloadForStaleChunk();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min default
      gcTime: 1000 * 60 * 15, // 15 min garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster position="bottom-center" />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);
