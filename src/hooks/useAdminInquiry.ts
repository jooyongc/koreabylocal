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

/** Why a reply could not be delivered, in words an admin can act on. */
const SEND_ERRORS: Record<string, string> = {
  mail_not_configured: "Email is not configured on the server, so nothing was sent.",
  send_failed: "Gmail rejected the message. Nothing was sent.",
  no_recipient: "This inquiry has no usable email address.",
  not_found: "That inquiry no longer exists.",
  empty_reply: "Write a reply first.",
  forbidden: "Your account is not an admin.",
  unauthorized: "Your session expired — sign in again.",
};

/**
 * Sends the reply to the traveler and only then marks the inquiry replied.
 *
 * Both happen server-side in send-inquiry-reply, deliberately: this used to
 * write "replied" straight to the database and send nothing, so a paying
 * customer could be recorded as answered while hearing nothing. If the send
 * fails this throws, and the inquiry stays open.
 */
export function useReplyInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reply }: { id: number; reply: string }) => {
      const { data, error } = await supabase.functions.invoke("send-inquiry-reply", {
        body: { id, reply },
      });

      if (error) {
        let code = "";
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) code = (await ctx.json())?.error ?? "";
        } catch { /* fall through to the generic message */ }
        throw new Error(SEND_ERRORS[code] ?? "Could not send the reply. Nothing was sent.");
      }
      if (!data?.success) throw new Error("Could not send the reply. Nothing was sent.");

      return data as { success: true; recorded: boolean; to?: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
      qc.invalidateQueries({ queryKey: ["admin-inquiry"] });
    },
  });
}
