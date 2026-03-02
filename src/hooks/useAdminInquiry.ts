import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Inquiry } from "@/types";

export function useAdminInquiry(id: number | undefined) {
  return useQuery<Inquiry>({
    queryKey: ["admin-inquiry", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Inquiry;
    },
  });
}

export function useReplyInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reply }: { id: number; reply: string }) => {
      const { error } = await supabase
        .from("inquiries")
        .update({
          admin_reply: reply,
          status: "replied",
          replied_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
      qc.invalidateQueries({ queryKey: ["admin-inquiry"] });
    },
  });
}
