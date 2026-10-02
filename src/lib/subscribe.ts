import { supabase } from "@/lib/supabase";

/**
 * Adds a newsletter subscriber — or makes an unsubscribed one active again.
 * Every signup form (checklist, banners, footer, popup) goes through this so
 * they all land in the same list the admin sends newsletters to. A bare insert
 * would hit the unique email and quietly drop the re-signup.
 */
export async function subscribe(email: string, source: string, leadMagnet?: string | null) {
  const { error } = await supabase.rpc("subscribe", {
    p_email: email,
    p_source: source,
    p_lead_magnet: leadMagnet ?? null,
  });
  return { error };
}
