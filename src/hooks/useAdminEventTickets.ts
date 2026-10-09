import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type AdminEventTicketRow = Tables<"event_tickets">;

export function useAdminEventTickets() {
  return useQuery<AdminEventTicketRow[]>({
    queryKey: ["admin-event-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Toggled at the door once a confirmation code is matched against this list. */
export function useSetTicketCheckedIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked_in }: { id: number; checked_in: boolean }) => {
      const { error } = await supabase.from("event_tickets").update({ checked_in }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-event-tickets"] }),
  });
}
