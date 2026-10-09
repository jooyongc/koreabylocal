import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type AdminEventRow = Tables<"events">;

// Admin-authenticated client: the events_read RLS policy lets admins see
// every row, active or not.
export function useAdminEvents() {
  return useQuery<AdminEventRow[]>({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
