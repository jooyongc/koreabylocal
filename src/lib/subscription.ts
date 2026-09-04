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
