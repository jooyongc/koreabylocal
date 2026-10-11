import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

/** Reads the GA4 Measurement ID from site_settings (admin-managed, runtime). */
export function useGa4Setting() {
  return useQuery({
    queryKey: ["site-settings", "ga4_id"],
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<string> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ga4_id")
        .maybeSingle();
      const v = data?.value;
      return typeof v === "string" ? v : "";
    },
  });
}

/**
 * Sends a GA4 event. A no-op when GA isn't configured or is blocked; calls
 * made before gtag.js loads are queued in dataLayer by the inline snippet.
 */
export function trackEvent(name: string, params: Record<string, string | number>) {
  try {
    window.gtag?.("event", name, params);
  } catch {
    // analytics must never break a click
  }
}

// GA4 should count the audience, not the people running the site. Only the live
// domain reports (not localhost, Pages previews, translate proxies), and GA4's
// own opt-out flag mutes it on /admin and for admin accounts on any page —
// gtag checks the flag on every hit, so it follows navigation.
const LIVE_HOSTS = ["koreabylocal.com", "www.koreabylocal.com"];

/** Loads Google Analytics (gtag.js) when a GA4 id is configured. Mount once at root. */
export function useSiteAnalytics() {
  const { data: gaId } = useGa4Setting();
  const { pathname } = useLocation();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const authLoading = useAuthStore((s) => s.isLoading);
  const valid = Boolean(gaId && /^G-[A-Z0-9]+$/i.test(gaId));

  // Runs before the loader below, so the flag is set before the first hit.
  useEffect(() => {
    if (!valid) return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = pathname.startsWith("/admin") || isAdmin;
  }, [valid, gaId, pathname, isAdmin]);

  useEffect(() => {
    if (!valid || !LIVE_HOSTS.includes(window.location.hostname)) return;
    // Wait until we know who this is, or an admin's first page view slips through.
    if (authLoading) return;
    if (document.getElementById("ga4-init")) return; // load only once

    // Queue the config now so the first page_view is never lost...
    const init = document.createElement("script");
    init.id = "ga4-init";
    init.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
    document.head.appendChild(init);

    // ...but fetch gtag.js (~180 KB) only once the page has loaded and gone
    // idle, so it never competes with the page's own scripts and images.
    const load = () => {
      if (document.getElementById("ga4-src")) return;
      const src = document.createElement("script");
      src.id = "ga4-src";
      src.async = true;
      src.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(src);
    };
    const whenIdle = () =>
      "requestIdleCallback" in window ? window.requestIdleCallback(load, { timeout: 4000 }) : setTimeout(load, 2000);
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
  }, [valid, gaId, authLoading]);
}
