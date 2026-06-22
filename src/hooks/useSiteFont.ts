import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { applyFontPair, DEFAULT_FONT_PAIR } from "@/lib/fontPairs";

/** Reads the site-wide font pair from site_settings (graceful default). */
export function useFontPairSetting() {
  return useQuery({
    queryKey: ["site-settings", "font_pair"],
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<string> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "font_pair")
        .maybeSingle();
      const v = data?.value;
      return typeof v === "string" && v ? v : DEFAULT_FONT_PAIR;
    },
  });
}

/** Applies the configured font pair globally. Mount once at the app root. */
export function useSiteFont() {
  const { data } = useFontPairSetting();
  useEffect(() => {
    applyFontPair(data ?? DEFAULT_FONT_PAIR);
  }, [data]);
}
