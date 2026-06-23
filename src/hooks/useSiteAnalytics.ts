import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

/** Loads Google Analytics (gtag.js) when a GA4 id is configured. Mount once at root. */
export function useSiteAnalytics() {
  const { data: gaId } = useGa4Setting();
  useEffect(() => {
    if (!gaId || !/^G-[A-Z0-9]+$/i.test(gaId)) return;
    if (document.getElementById("ga4-src")) return; // load only once
    const src = document.createElement("script");
    src.id = "ga4-src";
    src.async = true;
    src.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(src);
    const init = document.createElement("script");
    init.id = "ga4-init";
    init.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
    document.head.appendChild(init);
  }, [gaId]);
}
