import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function setSubscriberStatus(id: number, status: "active" | "unsubscribed" | "bounced") {
  const { error } = await supabase
    .from("subscribers")
    .update({ status, unsubscribed_at: status === "unsubscribed" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export function useSetSubscriberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "unsubscribed" | "bounced" }) =>
      setSubscriberStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
      qc.invalidateQueries({ queryKey: ["admin-subscriber-stats"] });
    },
  });
}
