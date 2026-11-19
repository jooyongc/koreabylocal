// supabase.functions.invoke reports a non-2xx answer as an error whose
// `context` is the Response. The function's own message is in its JSON body.

/** The JSON body a failed edge-function call came back with, if any. */
export async function functionErrorBody(error: unknown): Promise<{ error?: unknown; detail?: unknown } | null> {
  const ctx = (error as { context?: Response } | null)?.context;
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    return await ctx.json();
  } catch {
    return null;
  }
}

/**
 * The function's own message — `detail` first when asked for, then `error` —
 * or the client's message when the body has neither.
 */
export async function functionErrorMessage(error: unknown, prefer: "error" | "detail" = "error"): Promise<string> {
  const body = await functionErrorBody(error);
  const msg = body?.[prefer] ?? body?.error;
  if (msg) return String(msg);
  return error instanceof Error ? error.message : "request_failed";
}
