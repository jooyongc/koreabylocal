import { supabase } from "@/lib/supabase";

const SUBSCRIBED_KEY = "kbl_subscribed";

/** Remembers, per-browser, that this visitor has already subscribed — so we don't pester them again. */
export function markSubscribed() {
  try {
    localStorage.setItem(SUBSCRIBED_KEY, "1");
  } catch {
    // localStorage unavailable — best effort only.
  }
}

export function hasSubscribed(): boolean {
  try {
    return localStorage.getItem(SUBSCRIBED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Adds a newsletter subscriber — or makes an unsubscribed one active again —
 * then sends the welcome email and remembers the signup in this browser.
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
  if (error) return { error };

  supabase.functions
    .invoke("send-welcome-email", { body: { email, lead_magnet: leadMagnet ?? undefined } })
    .catch(() => {
      // Email failure should not block the subscribe confirmation.
    });
  markSubscribed();
  return { error: null };
}
