// Calls the TypeSafe "System One" judgement API (Jev). Unlike a writing model it
// returns numbers a caller can branch on: a yes/no probability (noul), a pick
// from fixed options (choice), or a graded score.
//
// Judgements are advisory everywhere in this codebase. If the key is missing or
// the API fails, callers fall back to their previous behaviour — a judgement
// must never block a payment, a notification, or a publish.
//
// OPTIONAL secrets: TYPESAFE_API_KEY (absent -> judge() returns
// { ok: false, error: "not_configured" } so callers can skip quietly),
// TYPESAFE_MODEL (default "jev-latest"; pin to an exact version such as
// "jev-1.13.0" once thresholds are tuned, since the alias can move).
//
// Docs: https://docs.typesafe.ai/api.md · https://docs.typesafe.ai/models.md

const API_URL = "https://api.typesafe.ai/v1/systemone";
const DEFAULT_MODEL = "jev-latest";
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRIES = 2;

// Per-request ceilings, https://docs.typesafe.ai/models.md (read 2026-09-20).
// Documented as moving without notice, so treat these as budgets, not truths.
export const TOKEN_LIMIT_TOTAL = 64_000;
export const TOKEN_LIMIT_STATE = 32_000;

// ---------------------------------------------------------------- questions

export interface NoulQuestion {
  type: "noul";
  instructions: string;
  criteria?: { true: string; false: string };
}

export interface ChoiceQuestion {
  type: "choice";
  instructions: string;
  criteria: Record<string, string | null>;
}

export interface ScoreQuestion {
  type: "score";
  instructions: string;
  criteria: string[];
}

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

// Question ids are NOT sent to the model — every bit of meaning has to live in
// `instructions`. Reference fields of `state` with backtick paths, e.g.
// noul("Does `messages.m1` need an answer within 48 hours?").
export const noul = (
  instructions: string,
  criteria?: { true: string; false: string },
): NoulQuestion => (criteria ? { type: "noul", instructions, criteria } : { type: "noul", instructions });

export const choice = (
  instructions: string,
  criteria: Record<string, string | null>,
): ChoiceQuestion => ({ type: "choice", instructions, criteria });

// `criteria` is an ordered list of levels, lowest first. The returned score can
// land between levels (1.6 means "past level 2, not quite level 3").
export const score = (instructions: string, criteria: string[]): ScoreQuestion => ({
  type: "score",
  instructions,
  criteria,
});

// ------------------------------------------------------------------ answers

export interface NoulAnswer {
  type: "noul";
  noul: number;
}

export interface ChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface ScoreAnswer {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
}

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

// Narrowing helpers — a malformed or missing answer reads as null rather than
// throwing, so one bad question can't take down a whole handler.
export const asNoul = (a: Answer | undefined): NoulAnswer | null =>
  a?.type === "noul" && typeof a.noul === "number" ? a : null;

export const asChoice = (a: Answer | undefined): ChoiceAnswer | null =>
  a?.type === "choice" && typeof a.choice === "string" ? a : null;

export const asScore = (a: Answer | undefined): ScoreAnswer | null =>
  a?.type === "score" && typeof a.score === "number" ? a : null;

// ------------------------------------------------------------------- result

export interface JudgeSuccess {
  ok: true;
  answers: Record<string, Answer>;
  usage: { input_tokens: number; output_tokens: number };
  /** Resolved version, e.g. "jev-1.13.0". Store it alongside any saved verdict. */
  model: string;
  ms: number;
}

export type JudgeErrorCode =
  | "not_configured"
  | "timeout"
  | "rate_limited"
  | "overloaded"
  | "unauthorized"
  | "invalid_request"
  | "http_error"
  | "network_error"
  | "bad_response";

export interface JudgeFailure {
  ok: false;
  error: JudgeErrorCode;
  message: string;
  status?: number;
}

export type JudgeResult = JudgeSuccess | JudgeFailure;

export interface JudgeOptions {
  model?: string;
  /** Per attempt, not for the call as a whole. Default 8s. */
  timeoutMs?: number;
  /** Retries for 429/529 only. Default 2. */
  retries?: number;
  apiKey?: string;
  /** Injected by tests. */
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export function isTypeSafeConfigured(): boolean {
  return Boolean(Deno.env.get("TYPESAFE_API_KEY"));
}

// 500ms, then 1s, with jitter so retries from parallel invocations spread out.
const backoffMs = (attempt: number) => 500 * 2 ** attempt + Math.floor(Math.random() * 250);

const retryAfterMs = (res: Response): number | null => {
  const raw = res.headers.get("Retry-After");
  if (!raw) return null;
  const secs = Number(raw);
  return Number.isFinite(secs) && secs >= 0 ? Math.min(secs * 1000, 10_000) : null;
};

/**
 * Sends one request holding many questions — they are judged in parallel and
 * cannot see each other's answers, so each must stand on its own.
 *
 * Never throws: every failure comes back as { ok: false }.
 */
export async function judge(
  state: unknown,
  questions: Record<string, Question>,
  opts: JudgeOptions = {},
): Promise<JudgeResult> {
  const apiKey = opts.apiKey ?? Deno.env.get("TYPESAFE_API_KEY");
  if (!apiKey) {
    return { ok: false, error: "not_configured", message: "TYPESAFE_API_KEY is not set" };
  }
  if (Object.keys(questions).length === 0) {
    return { ok: false, error: "invalid_request", message: "questions is empty" };
  }

  const doFetch = opts.fetch ?? fetch;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const retries = opts.retries ?? DEFAULT_RETRIES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const model = opts.model ?? Deno.env.get("TYPESAFE_MODEL") ?? DEFAULT_MODEL;
  const body = JSON.stringify({ state, model, questions });
  const started = Date.now();

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await doFetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
    } catch (e) {
      // Not retried: callers (the payment webhook above all) budget on wall
      // clock, and a second 8s wait would cost more than the judgement is worth.
      const err = e as Error;
      return err.name === "AbortError"
        ? { ok: false, error: "timeout", message: `no response within ${timeoutMs}ms` }
        : { ok: false, error: "network_error", message: err.message };
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) {
      let payload: { model?: string; answers?: Record<string, Answer>; usage?: { input_tokens: number; output_tokens: number } };
      try {
        payload = await res.json();
      } catch {
        return { ok: false, error: "bad_response", message: "response was not JSON", status: res.status };
      }
      if (!payload?.answers || typeof payload.answers !== "object") {
        return { ok: false, error: "bad_response", message: "response had no answers", status: res.status };
      }
      return {
        ok: true,
        answers: payload.answers,
        usage: payload.usage ?? { input_tokens: 0, output_tokens: 0 },
        model: payload.model ?? model,
        ms: Date.now() - started,
      };
    }

    const detail = (await res.text().catch(() => "")).slice(0, 300);

    // 401 means a bad key and 422 a malformed body — retrying either just burns
    // the caller's latency budget on the same answer.
    if (res.status === 401) {
      return { ok: false, error: "unauthorized", message: detail || "invalid API key", status: 401 };
    }
    if (res.status === 422) {
      return { ok: false, error: "invalid_request", message: detail || "request failed validation", status: 422 };
    }

    if (res.status === 429 || res.status === 529) {
      const code: JudgeErrorCode = res.status === 429 ? "rate_limited" : "overloaded";
      if (attempt >= retries) {
        return { ok: false, error: code, message: detail || `${res.status} after ${attempt + 1} attempts`, status: res.status };
      }
      await sleep(retryAfterMs(res) ?? backoffMs(attempt));
      continue;
    }

    return { ok: false, error: "http_error", message: detail || `unexpected status ${res.status}`, status: res.status };
  }
}

// -------------------------------------------------------- budgeting helpers

/**
 * Rough size estimate (~4 chars per token). Jev bills per token but offers no
 * counting endpoint, so callers budget with this and leave headroom.
 */
export function estimateTokens(value: unknown): number {
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? "";
  return Math.ceil(text.length / 4);
}

/**
 * Splits items into groups that each stay under `budget` estimated tokens, so a
 * long candidate list can be judged batch by batch instead of blowing the 32k
 * state ceiling. An item bigger than the budget gets a group of its own rather
 * than being dropped — truncating is the caller's call.
 */
export function chunkByTokens<T>(
  items: T[],
  budget: number,
  sizeOf: (item: T) => number = estimateTokens,
): T[][] {
  const groups: T[][] = [];
  let current: T[] = [];
  let used = 0;

  for (const item of items) {
    const size = sizeOf(item);
    if (current.length > 0 && used + size > budget) {
      groups.push(current);
      current = [];
      used = 0;
    }
    current.push(item);
    used += size;
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

// Common English words plus the words every title on this site shares, which
// would otherwise make everything look related to everything.
const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "how", "what", "why", "when", "where", "who", "can", "does",
  "are", "with", "from", "this", "that", "they", "them", "there", "here", "about", "into", "out",
  "not", "but", "all", "any", "get", "got", "use", "using", "make", "guide", "complete", "ultimate",
  "best", "top", "new", "korea", "korean", "travel", "traveler", "travelers", "local",
]);

/** Content words of a string, lowercased and de-duplicated. */
export function contentWords(text: string): Set<string> {
  const found = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(found.filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}

/**
 * Ranks `items` by how many content words they share with `query` and returns
 * the best `limit`. Cheap, code-side pre-filtering — it keeps `state` small so
 * Jev stays sharp, since a big mixed state blunts its accuracy.
 *
 * Ties keep their original order, so a caller that passes newest-first gets the
 * newer of two equally-related items.
 */
export function topByWordOverlap<T>(
  query: string,
  items: T[],
  limit: number,
  textOf: (item: T) => string,
): T[] {
  if (items.length <= limit) return items;
  const q = contentWords(query);
  return items
    .map((item, index) => {
      let shared = 0;
      for (const w of contentWords(textOf(item))) if (q.has(w)) shared++;
      return { item, index, shared };
    })
    .sort((a, b) => b.shared - a.shared || a.index - b.index)
    .slice(0, limit)
    .map((x) => x.item);
}
