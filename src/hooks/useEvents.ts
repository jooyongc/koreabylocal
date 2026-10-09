import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type EventRow = Tables<"events">;

/** Active events, soonest first. */
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Single event by slug — used by EventDetailPage. */
export function useEvent(slug: string | undefined) {
  return useQuery({
    queryKey: ["event", slug],
    enabled: !!slug,
    queryFn: async (): Promise<EventRow | null> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
